// -----------------------------------------------------------------------------
// server-mercadopago/mercadopago-conversions.ts
//
// Plugin Fastify que (1) fecha o loop de "compra de verdade" e (2) eleva a
// QUALIDADE DA CORRESPONDÊNCIA DE EVENTOS (EMQ) do Meta enriquecendo o
// `user_data` de cada evento server-side.
//
// ROTAS
//   1) GET  /api/subscriptions/:id/status
//        Lê o status REAL da preapproval no Mercado Pago (precisa do access
//        token, por isso é server-side) e devolve normalizado. O front chama
//        isto no retorno do checkout antes de liberar/disparar qualquer coisa.
//
//   2) POST /api/webhooks/mercadopago
//        Recebe as notificações do MP. Quando a assinatura fica `authorized`
//        (ou o primeiro authorized_payment vira `approved`), dispara o Purchase
//        na Conversions API (CAPI) do Meta — a ÚNICA origem confiável da compra.
//
//   3) POST /api/lead                 [NOVO]
//        Espelha um Lead do navegador na CAPI, já com IP + User-Agent + email +
//        _fbp + _fbc hasheados. Deduplicado com o pixel pelo mesmo event_id.
//
//   4) POST /api/checkout/attach      [NOVO]
//        Guarda os dados de correspondência do visitante (email, _fbp, _fbc,
//        external_id, IP, UA) por preapproval_id. O webhook (que não enxerga os
//        cookies nem o IP do usuário) usa isso para mandar o Purchase com
//        correspondência FORTE.
//
// POR QUE A EMQ ESTAVA BAIXA (3/10): o Purchase server-side ia só com o email do
// MP e o external_id. Faltavam os sinais de maior peso — _fbc (clique no
// anúncio), _fbp, IP e User-Agent do usuário. Agora todos entram.
//
// ── Registrar no seu app Fastify ─────────────────────────────────────────────
//   import mercadopagoConversions from "./server-mercadopago/mercadopago-conversions";
//   await app.register(mercadopagoConversions);
//
// ⚠️ CORS: o front chama /api/lead e /api/checkout/attach de outra origem
//   (o site) — garanta @fastify/cors permitindo POST + Content-Type: application/json
//   para a origem do site (o mesmo CORS que já faz o GET de status funcionar).
//
// ── Variáveis de ambiente ────────────────────────────────────────────────────
//   MP_ACCESS_TOKEN        Access token do Mercado Pago (Produção).
//   META_PIXEL_ID          967920369353096
//   META_CAPI_TOKEN        Token da Conversions API (System User no Events Manager).
//   META_TEST_EVENT_CODE   (opcional) TESTxxxx para validar em "Eventos de teste".
//   PUBLIC_APP_URL         (opcional) ex.: https://pedagogy.com.br (event_source_url).
//
// ── Configurar no painel do Mercado Pago ─────────────────────────────────────
//   Notificações/Webhooks → URL: https://<seu-backend>/api/webhooks/mercadopago
//   Eventos: "Assinaturas" (preapproval) e "Pagamentos de assinatura".
// -----------------------------------------------------------------------------

import type { FastifyPluginAsync, FastifyRequest } from "fastify";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const META_PIXEL_ID = process.env.META_PIXEL_ID || "967920369353096";
const META_CAPI_TOKEN =
  process.env.META_CAPI_TOKEN ||
  "EAAoGZA4t0d9oBRxjtrnjnnWgWZCycoirlTNZAKKwHujeNeE7JKn6G7WLqhsewO6GiXqQh7d8Q5XalOgcQlEN5zcnknI0GVv4tamikWhTZAgttDTiwy0uMyZCl3DFt9zivZAKWyHWiZCfKBqSVPkOr1XlROmgTuOK0lYkCzYqjoSNYwZBzNCOSZCVyFfyANS0dXLscwAZDZD";
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || "https://pedagogy.com.br";

const MP_API = "https://api.mercadopago.com";
const GRAPH_API = "https://graph.facebook.com/v20.0";

// event_id determinístico — TEM que bater com o do navegador (pixel.js →
// subscriptionEventId) para o Meta deduplicar as duas cópias.
const subscriptionEventId = (preapprovalId: string) => `sub.${preapprovalId}`;

type NormalizedStatus = "authorized" | "pending" | "paused" | "cancelled";

interface Preapproval {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  payer_email?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string };
}

/** Mapeia o status cru da preapproval do MP para o nosso conjunto normalizado. */
function normalizeStatus(raw?: string): NormalizedStatus {
  switch ((raw || "").toLowerCase()) {
    case "authorized":
      return "authorized";
    case "paused":
      return "paused";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

async function mpGet<T>(path: string): Promise<T | null> {
  if (!MP_ACCESS_TOKEN) return null;
  const res = await fetch(`${MP_API}${path}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function getPreapproval(id: string): Promise<Preapproval | null> {
  return mpGet<Preapproval>(`/preapproval/${encodeURIComponent(id)}`);
}

// ── Normalização + hash (têm que espelhar o cliente em src/lib/identity.js) ───
const normEmail = (v?: string) =>
  v && v.trim() ? v.trim().toLowerCase() : undefined;
const normName = (v?: string) =>
  v && v.trim() ? v.trim().toLowerCase() : undefined;
const normPhone = (v?: string) => {
  if (!v) return undefined;
  let d = v.replace(/\D/g, "");
  if (!d) return undefined;
  if (d.length <= 11) d = `55${d}`; // assume Brasil quando vier sem DDI
  return d;
};

// SHA-256 hex (lowercase, trim) — exigido pelo Meta para os dados de contato.
async function sha256Hex(input?: string): Promise<string | undefined> {
  if (!input) return undefined;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Dados crus de correspondência de um usuário (antes do hash).
interface RawMatch {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
}

/**
 * Monta o `user_data` no formato do Meta: dados de contato HASHEADOS (em/fn/ln/ph
 * como arrays), e sinais que vão CRUS (fbp, fbc, IP, User-Agent, external_id).
 * Só inclui o que existir — chaves vazias pioram a EMQ.
 */
async function buildUserData(raw: RawMatch): Promise<Record<string, unknown>> {
  const em = await sha256Hex(normEmail(raw.email));
  const fn = await sha256Hex(normName(raw.firstName));
  const ln = await sha256Hex(normName(raw.lastName));
  const ph = await sha256Hex(normPhone(raw.phone));

  const ud: Record<string, unknown> = {};
  if (em) ud.em = [em];
  if (fn) ud.fn = [fn];
  if (ln) ud.ln = [ln];
  if (ph) ud.ph = [ph];
  if (raw.externalId) ud.external_id = [raw.externalId];
  if (raw.fbp) ud.fbp = raw.fbp;
  if (raw.fbc) ud.fbc = raw.fbc;
  if (raw.clientIp) ud.client_ip_address = raw.clientIp;
  if (raw.userAgent) ud.client_user_agent = raw.userAgent;
  return ud;
}

/** IP real do cliente, respeitando proxies (Render/Cloudflare mandam XFF). */
function getClientIp(req: FastifyRequest): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return String(xff[0]).trim();
  return req.ip || req.socket?.remoteAddress || undefined;
}

function getUserAgent(req: FastifyRequest): string | undefined {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : undefined;
}

// ── Armazenamento de correspondência por preapproval ─────────────────────────
// O webhook do MP chega SEM os cookies/IP do usuário. Guardamos aqui os dados de
// correspondência capturados no site (no retorno do checkout, quando ainda temos
// o navegador do usuário) e o webhook consome na hora de disparar o Purchase.
//
// ⚠️ É um Map EM MEMÓRIA: reinicia no deploy e não é compartilhado entre várias
// instâncias. Para 1 instância no Render está ótimo. Com múltiplas instâncias,
// troque por Redis/DB. (Mesmo sem isto, a cópia do Purchase no NAVEGADOR já sai
// com o Advanced Matching, então a compra não fica "cega".)
interface StoredMatch {
  match: RawMatch;
  ts: number;
}
const MATCH_TTL_MS = 1000 * 60 * 60 * 24; // 24h — janela folgada até o webhook
const matchStore = new Map<string, StoredMatch>();

function pruneMatchStore() {
  const now = Date.now();
  for (const [k, v] of matchStore) {
    if (now - v.ts > MATCH_TTL_MS) matchStore.delete(k);
  }
}

/** POST em /events da CAPI. Retorna true em sucesso; loga e retorna false se falhar. */
async function postToCapi(
  event: Record<string, unknown>,
  req?: FastifyRequest,
): Promise<boolean> {
  const payload = {
    data: [event],
    ...(META_TEST_EVENT_CODE ? { test_event_code: META_TEST_EVENT_CODE } : {}),
  };
  const res = await fetch(
    `${GRAPH_API}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    req?.log?.error(
      { status: res.status, body: await res.text(), event: event.event_name },
      "Falha ao enviar evento à CAPI",
    );
    return false;
  }
  return true;
}

/**
 * Dispara o Purchase na CAPI. Idempotente do lado do Meta: como o event_id é
 * sempre `sub.<preapprovalId>`, reenvios (webhook duplicado, retry) deduplicam.
 * Enriquecido com os dados guardados via /api/checkout/attach (fbp, fbc, IP, UA
 * e o external_id estável do visitante).
 */
async function sendCapiPurchase(pre: Preapproval, req?: FastifyRequest) {
  if (!META_CAPI_TOKEN) {
    req?.log?.warn("META_CAPI_TOKEN ausente — Purchase não enviado à CAPI");
    return;
  }
  const value = pre.auto_recurring?.transaction_amount;
  const currency = pre.auto_recurring?.currency_id || "BRL";

  pruneMatchStore();
  const stored = matchStore.get(pre.id)?.match;

  const user_data = await buildUserData({
    // Email: prioriza o capturado no site; cai no payer_email do MP.
    email: stored?.email || pre.payer_email,
    firstName: stored?.firstName,
    lastName: stored?.lastName,
    phone: stored?.phone,
    externalId: stored?.externalId,
    fbp: stored?.fbp,
    fbc: stored?.fbc,
    clientIp: stored?.clientIp,
    userAgent: stored?.userAgent,
  });

  // external_id como array: o do visitante (estável) + o id da preapproval →
  // mais superfície de correspondência.
  const ext: string[] = [];
  if (stored?.externalId) ext.push(stored.externalId);
  ext.push(pre.id);
  user_data.external_id = ext;

  const ok = await postToCapi(
    {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: subscriptionEventId(pre.id), // dedupe com o navegador
      action_source: "website",
      event_source_url: `${PUBLIC_APP_URL}/app/paywall`,
      user_data,
      custom_data: {
        currency,
        value,
        content_type: "subscription",
        subscription_id: pre.id,
        transaction_id: pre.id,
        num_items: 1,
      },
    },
    req,
  );

  if (ok) {
    req?.log?.info(
      { preapprovalId: pre.id, value, currency, matched: !!stored },
      "Purchase enviado à CAPI",
    );
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  // 1) Verificação síncrona usada pelo front no retorno do checkout.
  app.get<{ Params: { id: string } }>(
    "/api/subscriptions/:id/status",
    async (req, reply) => {
      const pre = await getPreapproval(req.params.id);
      if (!pre) {
        return reply.code(404).send({ status: "unknown", paid: false });
      }
      const status = normalizeStatus(pre.status);
      return reply.send({
        status,
        paid: status === "authorized",
        value: pre.auto_recurring?.transaction_amount,
        currency: pre.auto_recurring?.currency_id || "BRL",
      });
    },
  );

  // 2) Webhook do Mercado Pago — a fonte da verdade da compra.
  app.post("/api/webhooks/mercadopago", async (req, reply) => {
    // Responder 200 rápido: o MP reenvia se demorar. Processa o mínimo aqui.
    const body = (req.body || {}) as any;
    const query = (req.query || {}) as any;
    const type = body.type || body.topic || query.type || query.topic;
    const dataId = body?.data?.id || query.id || query["data.id"];

    try {
      if (!dataId) return reply.code(200).send({ received: true });

      // Assinatura (preapproval): dispara quando fica `authorized`.
      if (type === "subscription_preapproval" || type === "preapproval") {
        const pre = await getPreapproval(String(dataId));
        if (pre && normalizeStatus(pre.status) === "authorized") {
          await sendCapiPurchase(pre, req);
        }
      }

      // Primeiro pagamento da assinatura: dispara quando `approved`. Resolvemos
      // a preapproval a partir do authorized_payment para reusar o mesmo id/dedupe.
      if (
        type === "subscription_authorized_payment" ||
        type === "authorized_payment"
      ) {
        const ap = await mpGet<{
          status?: string;
          preapproval_id?: string;
        }>(`/authorized_payments/${encodeURIComponent(String(dataId))}`);
        if (
          ap &&
          (ap.status || "").toLowerCase() === "approved" &&
          ap.preapproval_id
        ) {
          const pre = await getPreapproval(ap.preapproval_id);
          if (pre) await sendCapiPurchase(pre, req);
        }
      }
    } catch (err) {
      req.log.error({ err }, "Erro processando webhook do Mercado Pago");
    }

    return reply.code(200).send({ received: true });
  });

  // 3) Lead server-side (espelho do pixel) — o que puxa a EMQ do Lead pra cima.
  app.post("/api/lead", async (req, reply) => {
    if (!META_CAPI_TOKEN) {
      return reply.code(200).send({ ok: false, reason: "capi_token_missing" });
    }
    const body = (req.body || {}) as any;
    const m = (body.match || {}) as RawMatch;

    const user_data = await buildUserData({
      email: m.email,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      externalId: m.externalId,
      fbp: m.fbp,
      fbc: m.fbc,
      // IP + User-Agent REAIS: esta request vem do navegador do usuário.
      clientIp: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    const eventId =
      typeof body.eventId === "string" && body.eventId
        ? body.eventId
        : `lead.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

    const ok = await postToCapi(
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId, // dedupe com o pixel
        action_source: "website",
        event_source_url: body.eventSourceUrl || `${PUBLIC_APP_URL}/`,
        user_data,
        custom_data: { ...(body.custom || {}) },
      },
      req,
    );

    return reply.code(ok ? 200 : 200).send({ ok });
  });

  // 4) Guarda os dados de correspondência do visitante por preapproval, para o
  //    webhook enriquecer o Purchase.
  app.post("/api/checkout/attach", async (req, reply) => {
    const body = (req.body || {}) as any;
    const preapprovalId = String(body.preapprovalId || "").trim();
    if (!preapprovalId) {
      return reply
        .code(400)
        .send({ ok: false, error: "preapprovalId ausente" });
    }
    const m = (body.match || {}) as RawMatch;

    pruneMatchStore();
    matchStore.set(preapprovalId, {
      ts: Date.now(),
      match: {
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone,
        externalId: m.externalId,
        fbp: m.fbp,
        fbc: m.fbc,
        // IP + UA REAIS do usuário (request do retorno do checkout, no navegador dele).
        clientIp: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    return reply.send({ ok: true });
  });
};

export default plugin;

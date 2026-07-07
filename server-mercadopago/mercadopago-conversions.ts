// -----------------------------------------------------------------------------
// server-mercadopago/mercadopago-conversions.ts
//
// Plugin Fastify que fecha o loop de "compra de verdade":
//
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
// PONTO-CHAVE (o bug que você tinha): o Purchase NUNCA é disparado a partir do
// clique no botão nem do back_url. Só a partir de status `authorized`/`approved`
// confirmado pelo MP. E usa event_id determinístico (`sub.<preapprovalId>`),
// idêntico ao do navegador, para o Meta DEDUPLICAR navegador + servidor.
//
// ── Registrar no seu app Fastify ─────────────────────────────────────────────
//   import mercadopagoConversions from "./server-mercadopago/mercadopago-conversions";
//   await app.register(mercadopagoConversions);
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
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";
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

// SHA-256 hex (lowercase, trim) — exigido pelo Meta para dados de contato (email).
async function sha256Hex(input?: string): Promise<string | undefined> {
  if (!input) return undefined;
  const norm = input.trim().toLowerCase();
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(norm),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Dispara o Purchase na CAPI. Idempotente do lado do Meta: como o event_id é
 * sempre `sub.<preapprovalId>`, reenvios (webhook duplicado, retry) deduplicam.
 */
async function sendCapiPurchase(pre: Preapproval, req?: FastifyRequest) {
  if (!META_CAPI_TOKEN) {
    req?.log?.warn("META_CAPI_TOKEN ausente — Purchase não enviado à CAPI");
    return;
  }
  const value = pre.auto_recurring?.transaction_amount;
  const currency = pre.auto_recurring?.currency_id || "BRL";
  const em = await sha256Hex(pre.payer_email);

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: subscriptionEventId(pre.id), // dedupe com o navegador
        action_source: "website",
        event_source_url: `${PUBLIC_APP_URL}/app/paywall`,
        user_data: {
          ...(em ? { em: [em] } : {}),
          external_id: [pre.id],
        },
        custom_data: {
          currency,
          value,
          content_type: "subscription",
          subscription_id: pre.id,
          transaction_id: pre.id,
          num_items: 1,
        },
      },
    ],
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
      { status: res.status, body: await res.text() },
      "Falha ao enviar Purchase à CAPI",
    );
  } else {
    req?.log?.info(
      { preapprovalId: pre.id, value, currency },
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
};

export default plugin;

// -----------------------------------------------------------------------------
// payments/mercadopago.js — Checkout de assinatura do Mercado Pago.
//
// COMO FUNCIONA
//   Usamos "Planos de assinatura" criados no painel (Ferramentas de vendas →
//   Planos de assinatura). Cada plano tem um `preapproval_plan_id`. Assinar =
//   mandar o usuário para o checkout hospedado do Mercado Pago:
//
//       https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=<ID>
//
//   O MP coleta o cartão e roda a cobrança recorrente no lado deles.
//
// ⚠️  POR QUE O RETORNO (back_url) NÃO PROVA PAGAMENTO
//   Quando o usuário volta do checkout, o MP acrescenta `preapproval_id` na URL.
//   Isso significa apenas que ELE VOLTOU — não que houve pagamento. O MP manda
//   de volta mesmo quando a preapproval está `pending` (cartão em análise, Pix
//   ou boleto não pago, ou o usuário só fechou o modal). Por isso NUNCA
//   concluímos "pagou" a partir da URL. O único sinal confiável de receita é o
//   status real da preapproval no MP = `authorized`, que só o servidor consegue
//   ler (precisa do access token). Ver `fetchSubscriptionStatus` abaixo e o
//   backend em `server-mercadopago/`.
// -----------------------------------------------------------------------------

// import.meta.env só existe no build Vite; protegido para nunca quebrar caso
// este arquivo seja avaliado fora do bundler.
let ENV = {};
try {
  ENV = import.meta.env || {};
} catch {
  ENV = {};
}

/** Base do backend Fastify (verificação + CAPI). Ex.: https://api.exemplo.com */
const API_BASE = (ENV.VITE_API_BASE || "").replace(/\/+$/, "");

const CHECKOUT_BASE = "https://www.mercadopago.com.br/subscriptions/checkout";

// Plan ids do painel do Mercado Pago.
export const MP_PLANS = {
  monthly: {
    id: "monthly",
    cycle: "monthly",
    preapprovalPlanId: "af9ff462253545b49e6dfbc34d3f3a7a",
  },
  annual: {
    id: "annual",
    cycle: "annual",
    preapprovalPlanId: "af56e93c58e74f4685ab990252d3e04d",
  },
};

/** True quando o plano tem um preapproval_plan_id real configurado. */
export const isCheckoutConfigured = (planId) =>
  !!MP_PLANS[planId]?.preapprovalPlanId;

/** Monta a URL do checkout hospedado do Mercado Pago para um plano. */
export function buildCheckoutUrl(planId) {
  const planId_ = MP_PLANS[planId]?.preapprovalPlanId;
  if (!planId_) return null;
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set("preapproval_plan_id", planId_);
  return url.toString();
}

// O checkout do MP é um redirect de página inteira, então o `location.state` do
// React Router (qual plano, para onde voltar) se perde na ida e volta.
// sessionStorage sobrevive à navegação externa dentro da mesma aba.
const PENDING_KEY = "mp.pendingCheckout";

/** Guarda o plano escolhido + caminho de retorno antes de ir pro checkout. */
export function stashPendingCheckout(data = {}) {
  try {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ ...data, ts: Date.now() }),
    );
  } catch {
    /* storage indisponível (aba anônima) — degrada sem quebrar */
  }
}

/** Lê o contexto guardado no retorno (null se não houver/indisponível). */
export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Limpa o contexto guardado depois de tratar o retorno. */
export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignora */
  }
}

/**
 * Inicia o checkout de assinatura redirecionando o navegador para o checkout
 * hospedado do plano selecionado. Antes de redirecionar, guarda o plano +
 * caminho de retorno (o back_url do plano é fixo no painel e não carrega isso).
 *
 * @param {{ planId: string, returnTo?: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'not_configured' }>}
 */
export async function startSubscriptionCheckout({ planId, returnTo } = {}) {
  const url = buildCheckoutUrl(planId);
  if (!url) return { ok: false, reason: "not_configured" };
  stashPendingCheckout({ planId, returnTo });
  window.location.assign(url);
  return { ok: true };
}

/**
 * Lê os parâmetros do retorno (back_url) do Mercado Pago.
 *
 * IMPORTANTE: a presença de `preapproval_id` significa SÓ que o usuário voltou
 * do checkout — não que pagou. Por isso nunca devolvemos "authorized" apenas por
 * causa do id. Quando só temos o id (caso mais comum em assinatura), o resultado
 * é `unverified` e o pagamento PRECISA ser confirmado no servidor
 * (fetchSubscriptionStatus). Só um status explícito de aprovação/cancelamento na
 * própria URL é tratado como tal.
 *
 * @param {URLSearchParams} params
 * @returns {{ outcome: 'authorized'|'pending'|'cancelled'|'unverified', preapprovalId: string|null, rawStatus: string|null } | null}
 */
export function readCheckoutReturn(params) {
  const preapprovalId = params.get("preapproval_id");
  const rawStatus = (
    params.get("status") ||
    params.get("collection_status") ||
    ""
  ).toLowerCase();

  if (!preapprovalId && !rawStatus) return null;

  let outcome = "unverified"; // precisa de checagem server-side contra o MP
  if (rawStatus === "authorized" || rawStatus === "approved") {
    outcome = "authorized";
  } else if (
    rawStatus === "cancelled" ||
    rawStatus === "canceled" ||
    rawStatus === "rejected" ||
    rawStatus === "failure"
  ) {
    outcome = "cancelled";
  } else if (rawStatus === "pending" || rawStatus === "in_process") {
    outcome = "pending";
  }

  return {
    outcome,
    preapprovalId: preapprovalId || null,
    rawStatus: rawStatus || null,
  };
}

/**
 * Confirma o status REAL da assinatura no Mercado Pago, via backend.
 * O backend (server-mercadopago/) lê `GET /preapproval/{id}` com o access token
 * e normaliza o status. Este é o único jeito de saber se houve pagamento.
 *
 * Contrato do backend:
 *   GET {VITE_API_BASE}/api/subscriptions/:preapprovalId/status
 *   → 200 { status: 'authorized'|'pending'|'paused'|'cancelled', paid: boolean,
 *           value?: number, currency?: string }
 *
 * @param {string} preapprovalId
 * @returns {Promise<{ ok: boolean, status: string, paid?: boolean, value?: number, currency?: string, raw?: any }>}
 *   status pode ser: 'authorized' | 'pending' | 'paused' | 'cancelled'
 *                    | 'unconfigured' (sem VITE_API_BASE) | 'error' | 'unknown'
 */
export async function fetchSubscriptionStatus(preapprovalId) {
  if (!preapprovalId) return { ok: false, status: "unknown" };
  if (!API_BASE) return { ok: false, status: "unconfigured" };
  try {
    const res = await fetch(
      `${API_BASE}/api/subscriptions/${encodeURIComponent(preapprovalId)}/status`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return { ok: false, status: "error", httpStatus: res.status };
    const data = await res.json();
    return {
      ok: true,
      status: data.status || "unknown",
      paid: !!data.paid,
      value: data.value,
      currency: data.currency,
      raw: data,
    };
  } catch {
    return { ok: false, status: "error" };
  }
}

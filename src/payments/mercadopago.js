// -----------------------------------------------------------------------------
// payments/mercadopago.js — Mercado Pago subscription checkout (no backend).
//
// HOW THIS WORKS
//   We use Mercado Pago "Planos de assinatura" created in the dashboard
//   (Ferramentas de vendas → Planos de assinatura). Each plan has a
//   `preapproval_plan_id`. Subscribing = sending the user to Mercado Pago's
//   hosted checkout for that plan:
//
//       https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=<ID>
//
//   Mercado Pago collects the card and runs the recurring billing on their
//   side. No access token is needed in the browser, so this works with NO
//   backend.
//
// WHAT STILL NEEDS A SERVER (later, for production-grade reliability)
//   The return below (back_url) is an OPTIMISTIC unlock: when the user comes
//   back with a preapproval_id we flip the account to Premium. It is good
//   enough to ship, but it is NOT authoritative — a user can close the tab, and
//   a recurring charge can later fail without them visiting the site. To be
//   fully reliable you need a webhook endpoint that listens to Mercado Pago
//   notifications and updates the account's plan server-side.
//   Docs: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing
//
// PANEL SETUP REQUIRED
//   In the plan settings, set the plan's back_url (URL de retorno) to:
//       https://<your-domain>/app/paywall
//   The SPA rewrites (vercel.json / public/_redirects) already make that deep
//   link resolve, and Paywall.jsx reads the return params from there.
// -----------------------------------------------------------------------------

const CHECKOUT_BASE = "https://www.mercadopago.com.br/subscriptions/checkout";

// Plan ids from the Mercado Pago dashboard. Fill `annual` once you create the
// annual plan (Planos de assinatura → criar novo → copie o preapproval_plan_id).
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

/** True when the given plan has a real preapproval_plan_id wired up. */
export const isCheckoutConfigured = (planId) =>
  !!MP_PLANS[planId]?.preapprovalPlanId;

/** Build the Mercado Pago hosted checkout URL for a plan. */
export function buildCheckoutUrl(planId) {
  const planId_ = MP_PLANS[planId]?.preapprovalPlanId;
  if (!planId_) return null;
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set("preapproval_plan_id", planId_);
  return url.toString();
}

/**
 * Start a Mercado Pago subscription checkout by redirecting the browser to the
 * hosted checkout for the selected plan.
 *
 * @param {{ planId: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'not_configured' }>}
 *   Resolves to not_configured (without redirecting) when the plan has no id
 *   yet; on success it redirects and the promise effectively never resolves.
 */
export async function startSubscriptionCheckout({ planId } = {}) {
  const url = buildCheckoutUrl(planId);
  if (!url) return { ok: false, reason: "not_configured" };
  window.location.assign(url);
  return { ok: true };
}

/**
 * Parse Mercado Pago's return (back_url) query params.
 * After a successful subscription the redirect carries a `preapproval_id`
 * (subscriptions don't always include a `status`, so the presence of the id is
 * our success signal). Returns null when there's nothing subscription-related.
 *
 * @param {URLSearchParams} params
 * @returns {{ status: 'approved' | 'pending' | 'cancelled', preapprovalId: string|null } | null}
 */
export function readCheckoutReturn(params) {
  const preapprovalId = params.get("preapproval_id");
  const rawStatus = (
    params.get("status") ||
    params.get("collection_status") ||
    ""
  ).toLowerCase();

  if (!preapprovalId && !rawStatus) return null;

  let status = "pending";
  if (
    rawStatus === "authorized" ||
    rawStatus === "approved" ||
    (preapprovalId && !rawStatus)
  ) {
    status = "approved";
  } else if (rawStatus === "cancelled" || rawStatus === "rejected") {
    status = "cancelled";
  }
  return { status, preapprovalId: preapprovalId || null };
}

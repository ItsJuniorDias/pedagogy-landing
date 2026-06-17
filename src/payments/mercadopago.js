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

// Mercado Pago's hosted checkout is a FULL-PAGE redirect, so React Router's
// in-memory `location.state` (which plan was chosen, where to return) is lost on
// the round-trip. sessionStorage survives navigating away and back within the
// same tab, so we stash that context here and recover it on return.
const PENDING_KEY = "mp.pendingCheckout";

/** Remember the chosen plan + return path before redirecting to checkout. */
export function stashPendingCheckout(data = {}) {
  try {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ ...data, ts: Date.now() }),
    );
  } catch {
    /* storage unavailable (private mode) — degrade gracefully */
  }
}

/** Read the stashed checkout context on return (null if none/unavailable). */
export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear the stashed context once the return has been handled. */
export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Start a Mercado Pago subscription checkout by redirecting the browser to the
 * hosted checkout for the selected plan. Before redirecting it stashes the
 * chosen plan + return path (see PENDING_KEY) so the return handler can restore
 * them — the plan's back_url is fixed in the dashboard and can't carry them.
 *
 * @param {{ planId: string, returnTo?: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'not_configured' }>}
 *   Resolves to not_configured (without redirecting) when the plan has no id
 *   yet; on success it redirects and the promise effectively never resolves.
 */
export async function startSubscriptionCheckout({ planId, returnTo } = {}) {
  const url = buildCheckoutUrl(planId);
  if (!url) return { ok: false, reason: "not_configured" };
  stashPendingCheckout({ planId, returnTo });
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

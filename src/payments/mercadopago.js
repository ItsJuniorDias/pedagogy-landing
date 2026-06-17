// -----------------------------------------------------------------------------
// payments/mercadopago.js — placeholder for the future subscription checkout.
//
// ⚠️ NOT IMPLEMENTED YET. Payment integration is a later step. This module only
// marks WHERE Mercado Pago plugs in and keeps the paywall honest in the
// meantime (the Subscribe button reports "coming soon" instead of pretending to
// charge). To exercise the unlock flow today, use the dev "Simulate
// subscription" button on the paywall.
//
// When you build the real thing (recurring plans = Mercado Pago "Preapproval"):
//   • This CANNOT be done from the browser alone — the access token must live
//     on a server. Add a backend endpoint (e.g. POST /api/subscribe) that calls
//     Mercado Pago's Preapproval API and returns an `init_point` URL.
//   • Front-end flow: call that endpoint here, then redirect the user to the
//     returned `init_point` (Mercado Pago hosted checkout).
//   • Handle the return/`back_url` + a server-side webhook to confirm the
//     subscription, then flip the account to Premium (see AuthContext.upgradePlan).
//   • Docs: https://www.mercadopago.com.br/developers/en/docs/subscriptions/landing
// -----------------------------------------------------------------------------

// Plan ids the paywall offers — kept here so the future API call has stable keys.
export const MP_PLANS = {
  monthly: { id: 'monthly', cycle: 'monthly' },
  annual: { id: 'annual', cycle: 'annual' },
}

export const isCheckoutConfigured = () => false

/**
 * Start a Mercado Pago subscription checkout.
 * Today this is a no-op that signals the feature isn't live yet. Replace the
 * body with a fetch() to your backend that returns Mercado Pago's init_point,
 * then `window.location.assign(init_point)`.
 *
 * @returns {Promise<{ ok: false, reason: 'not_configured' }>}
 */
export async function startSubscriptionCheckout(/* { planId, email, returnTo } */) {
  // const res = await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ planId, email }) })
  // const { init_point } = await res.json()
  // window.location.assign(init_point)
  return { ok: false, reason: 'not_configured' }
}

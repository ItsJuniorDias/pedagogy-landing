// -----------------------------------------------------------------------------
// payments/coins.js — Mercado Pago one-time COIN purchase (no backend).
//
// HOW THIS WORKS  (same spirit as payments/mercadopago.js, but for one-off
// purchases instead of subscriptions)
//   Each coin pack maps to a Mercado Pago "Link de pagamento" created in the
//   dashboard (Seu negócio → Link de pagamento / "Cobrar com link"). Each link
//   has a fixed price and a URL. Buying = redirecting the browser to that link:
//
//       https://www.mercadopago.com.br/...  (or  https://mpago.la/xxxxx)
//
//   Mercado Pago collects the payment on their side. No access token lives in
//   the browser, so this works with NO backend.
//
// CREDITING THE COINS  (optimistic, on return)
//   The hosted checkout is a FULL-PAGE redirect, so we stash the chosen pack in
//   sessionStorage before leaving. On the configured return URL the buyer comes
//   back with `payment_id` + `status=approved`; we then credit the stashed
//   pack's coins ONCE (deduped by payment_id so a refresh can't double-credit).
//
//   ⚠️ This is OPTIMISTIC and NOT authoritative: with no backend we can't
//   verify the payment against Mercado Pago's API, and the back_url is shared by
//   all packs (we rely on the stashed SKU to know how many coins to grant). It
//   is good enough to ship a web build; for a tamper-proof balance you'd need a
//   server that verifies the payment and owns the coin balance.
//
// PANEL SETUP REQUIRED  (do this once per pack)
//   1. Create a Link de pagamento for each pack at the price below.
//   2. In the link's settings, set the return URL ("Para onde levar o cliente
//      depois do pagamento" / back_url de sucesso) to:
//          https://<your-domain>/app/games/farm
//      The SPA rewrites (vercel.json / public/_redirects) make that deep link
//      resolve, and useCoinStore reads the return params there.
//   3. Paste each link URL into PAYMENT_LINK below.
// -----------------------------------------------------------------------------

// ── Pack catalog ──────────────────────────────────────────────────────────────
// Fill `paymentLink` with the dashboard URL for each pack. Until a pack has a
// link it stays "simulated" (instant grant, clearly flagged, no real charge) so
// the game keeps working in dev. Prices are display-only here — the real charge
// is whatever the dashboard link is configured for, so keep them in sync.
const PAYMENT_LINK = {
  coins_small: "https://mpago.la/2sjCFfF", // e.g. "https://mpago.la/xxxxxxx"
  coins_medium: "https://mpago.la/2ZANNzi",
  coins_large: "https://mpago.la/1NVhYw5",
};

export const COIN_PACKS = [
  {
    sku: "coins_small",
    coins: 500,
    bonus: 0,
    emoji: "🪙",
    priceBRL: 19.9,
    displayPrice: "R$ 19,90",
    tag: null,
    paymentLink: PAYMENT_LINK.coins_small,
  },
  {
    sku: "coins_medium",
    coins: 1500,
    bonus: 250,
    emoji: "💰",
    priceBRL: 49.9,
    displayPrice: "R$ 49,90",
    tag: "POPULAR",
    paymentLink: PAYMENT_LINK.coins_medium,
  },
  {
    sku: "coins_large",
    coins: 5000,
    bonus: 1500,
    emoji: "👑",
    priceBRL: 99.9,
    displayPrice: "R$ 99,90",
    tag: "BEST VALUE",
    paymentLink: PAYMENT_LINK.coins_large,
  },
];

/** Look up a pack by SKU. */
export const getPack = (sku) => COIN_PACKS.find((p) => p.sku === sku) || null;

/** True when the pack has a real payment link wired up. */
export const isCoinCheckoutConfigured = (sku) => !!getPack(sku)?.paymentLink;

// ── Pending-checkout stash (survives the external redirect within the tab) ────
const PENDING_KEY = "coins.pendingCheckout";

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

export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

// ── Dedupe (so refreshing the return URL can't credit the same payment twice) ─
const CREDITED_KEY = "coins.creditedPayments";
const CREDITED_MAX = 50;

function readCredited() {
  try {
    const raw = localStorage.getItem(CREDITED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isCredited(paymentId) {
  if (!paymentId) return false;
  return readCredited().includes(String(paymentId));
}

export function markCredited(paymentId) {
  if (!paymentId) return;
  try {
    const list = readCredited();
    list.push(String(paymentId));
    // Keep only the most recent N so the key never grows unbounded.
    const trimmed = list.slice(-CREDITED_MAX);
    localStorage.setItem(CREDITED_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

/**
 * Start a coin purchase by redirecting to the pack's Mercado Pago payment link.
 * Stashes the chosen pack first so the return handler knows what to credit.
 *
 * @param {{ sku: string, returnTo?: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'not_configured' }>}
 */
export async function startCoinCheckout({ sku, returnTo } = {}) {
  const pack = getPack(sku);
  if (!pack?.paymentLink) return { ok: false, reason: "not_configured" };
  stashPendingCheckout({ sku, returnTo });
  window.location.assign(pack.paymentLink);
  return { ok: true };
}

/**
 * Parse Mercado Pago's return (back_url) query params for a coin purchase.
 * Returns null when there's nothing payment-related on the URL.
 *
 * @param {URLSearchParams} params
 * @returns {{ status: 'approved'|'pending'|'cancelled', paymentId: string|null } | null}
 */
export function readCoinCheckoutReturn(params) {
  const paymentId = params.get("payment_id") || params.get("collection_id");
  const rawStatus = (
    params.get("status") ||
    params.get("collection_status") ||
    ""
  ).toLowerCase();

  if (!paymentId && !rawStatus) return null;

  let status = "pending";
  if (rawStatus === "approved") {
    status = "approved";
  } else if (
    rawStatus === "rejected" ||
    rawStatus === "cancelled" ||
    rawStatus === "failure" ||
    rawStatus === "null"
  ) {
    status = "cancelled";
  } else if (paymentId && !rawStatus) {
    // Some links omit status but carry the id — treat the id as success.
    status = "approved";
  }
  return { status, paymentId: paymentId || null };
}

// Mercado Pago params we append-cleanup after handling the return, so a refresh
// doesn't re-trigger and the URL goes back to a clean /app/games/farm.
const MP_RETURN_PARAMS = [
  "payment_id",
  "collection_id",
  "collection_status",
  "status",
  "external_reference",
  "merchant_order_id",
  "preference_id",
  "payment_type",
  "site_id",
  "processing_mode",
  "merchant_account_id",
];

/** Strip Mercado Pago return params from the current URL without reloading. */
export function clearReturnParams() {
  try {
    const url = new URL(window.location.href);
    MP_RETURN_PARAMS.forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

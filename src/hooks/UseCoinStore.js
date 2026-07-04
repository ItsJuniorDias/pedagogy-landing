// Web coin store backed by Mercado Pago payment links (no backend).
//
// Replaces the old simulated grant: buying a pack now redirects to that pack's
// Mercado Pago "Link de pagamento" (configured in src/payments/coins.js). On
// return we credit the pack's coins ONCE (deduped by payment_id). Packs without
// a link yet stay "simulated" (instant grant, flagged, no real charge) so the
// game keeps working before the links are filled in.
//
// On native (Expo) this hook is replaced by the real IAP flow; this file is the
// web build only. The public shape is unchanged so MarketModal/FarmGameScreen
// keep working untouched: { packs, connected, purchasingSku, storeError, buy,
// clearError }.
import { useCallback, useEffect, useRef, useState } from "react";

import {
  COIN_PACKS,
  getPack,
  isCoinCheckoutConfigured,
  startCoinCheckout,
  readCoinCheckoutReturn,
  readPendingCheckout,
  clearPendingCheckout,
  clearReturnParams,
  isCredited,
  markCredited,
} from "../payments/coins.js";
import {
  trackInitiateCoinCheckout,
  trackCoinPurchase,
  trackSimulatedCoinPurchase,
} from "../lib/pixel.js";

// Shape the catalog into what MarketModal expects. A pack is "simulated" until
// it has a real payment link, so dev still works and the modal shows the
// "no real money" disclaimer for those.
const PACKS = COIN_PACKS.map((p) => ({
  sku: p.sku,
  coins: p.coins,
  bonus: p.bonus,
  emoji: p.emoji,
  displayPrice: p.displayPrice,
  tag: p.tag,
  available: true,
  simulated: !p.paymentLink,
}));

export function useCoinStore({ onCoinsGranted } = {}) {
  const [purchasingSku, setPurchasingSku] = useState(null);
  const [storeError, setStoreError] = useState(null);
  const cbRef = useRef(onCoinsGranted);
  useEffect(() => {
    cbRef.current = onCoinsGranted;
  });

  // ── Handle the return from Mercado Pago's hosted checkout ──────────────────
  // The pack's return URL points back to /app/games/farm, so this runs when the
  // game mounts after a redirect. We credit the stashed pack's coins ONCE.
  useEffect(() => {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const ret = readCoinCheckoutReturn(params);
    if (!ret) return;

    if (ret.status === "approved") {
      // Dedupe: if we already credited this payment (e.g. user refreshed the
      // return URL), do nothing but still clean up.
      if (!isCredited(ret.paymentId)) {
        const pending = readPendingCheckout();
        const pack = getPack(pending?.sku);
        if (pack) {
          markCredited(ret.paymentId);
          trackCoinPurchase({
            sku: pack.sku,
            value: pack.priceBRL,
            currency: "BRL",
            coins: pack.coins + pack.bonus,
            id: ret.paymentId,
          });
          cbRef.current && cbRef.current(pack.coins + pack.bonus);
        } else {
          // Lost the stashed pack (different tab / cleared storage). We can't
          // safely guess how many coins to grant without a backend.
          setStoreError(
            "Pagamento aprovado, mas não conseguimos identificar o pacote. Se as moedas não aparecerem, fale com o suporte.",
          );
        }
      }
    } else if (ret.status === "cancelled") {
      setStoreError("Pagamento cancelado — nenhuma cobrança foi feita.");
    }

    clearPendingCheckout();
    clearReturnParams();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = useCallback((sku) => {
    setStoreError(null);
    const pack = getPack(sku);
    if (!pack) return;

    // Not configured yet → simulated grant (dev), clearly flagged in the modal.
    if (!isCoinCheckoutConfigured(sku)) {
      setPurchasingSku(sku);
      setTimeout(() => {
        setPurchasingSku(null);
        trackSimulatedCoinPurchase({
          sku: pack.sku,
          coins: pack.coins + pack.bonus,
        });
        cbRef.current && cbRef.current(pack.coins + pack.bonus);
      }, 350);
      return;
    }

    // Real purchase → redirect to the Mercado Pago payment link.
    setPurchasingSku(sku);
    trackInitiateCoinCheckout({
      sku: pack.sku,
      value: pack.priceBRL,
      currency: "BRL",
      coins: pack.coins + pack.bonus,
    });
    startCoinCheckout({
      sku,
      returnTo: window.location.pathname + window.location.search,
    })
      .then((res) => {
        // On success the browser is already navigating away; only handle the
        // no-redirect case here.
        if (!res?.ok) {
          setPurchasingSku(null);
          setStoreError(
            "Não foi possível abrir o checkout. Tente novamente em instantes.",
          );
        }
      })
      .catch(() => {
        setPurchasingSku(null);
        setStoreError(
          "Não foi possível abrir o checkout. Tente novamente em instantes.",
        );
      });
  }, []);

  const clearError = useCallback(() => setStoreError(null), []);

  return {
    packs: PACKS,
    connected: true,
    purchasingSku,
    storeError,
    buy,
    clearError,
  };
}

export default useCoinStore;

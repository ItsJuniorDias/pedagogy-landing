// Web stub for the native in-app-purchase coin store (expo-iap).
// The web build has no native store, so coin packs are granted instantly and
// clearly flagged as simulated (the Market modal shows a "no real money"
// disclaimer for simulated packs). On native this hook does the real IAP flow.
import { useCallback, useEffect, useRef, useState } from 'react'

const PACKS = [
  { sku: 'coins_small',  coins: 500,  bonus: 0,    emoji: '🪙', displayPrice: 'Grab', tag: null,        available: true, simulated: true },
  { sku: 'coins_medium', coins: 1500, bonus: 250,  emoji: '💰', displayPrice: 'Grab', tag: 'POPULAR',   available: true, simulated: true },
  { sku: 'coins_large',  coins: 5000, bonus: 1500, emoji: '👑', displayPrice: 'Grab', tag: 'BEST VALUE', available: true, simulated: true },
]

export function useCoinStore({ onCoinsGranted } = {}) {
  const [purchasingSku, setPurchasingSku] = useState(null)
  const [storeError, setStoreError] = useState(null)
  const cbRef = useRef(onCoinsGranted)
  useEffect(() => { cbRef.current = onCoinsGranted })

  const buy = useCallback((sku) => {
    const pack = PACKS.find((p) => p.sku === sku)
    if (!pack) return
    setPurchasingSku(sku)
    setTimeout(() => {
      setPurchasingSku(null)
      cbRef.current && cbRef.current(pack.coins + pack.bonus)
    }, 350)
  }, [])

  const clearError = useCallback(() => setStoreError(null), [])

  return { packs: PACKS, connected: true, purchasingSku, storeError, buy, clearError }
}

export default useCoinStore

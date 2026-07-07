// -----------------------------------------------------------------------------
// lib/capi-client.js — Ponte navegador → backend (Conversions API).
//
// Manda a identidade do visitante (email + cookies do pixel + external_id) para
// o nosso backend Fastify, que hasheia e reenvia ao Meta pela CAPI JÁ com o IP e
// o User-Agent do request. É isto que faz a EMQ subir de verdade: um evento
// server-side com email + _fbp + _fbc + IP + UA casa MUITO melhor do que o
// pixel do navegador sozinho.
//
// Tudo aqui é FALHA SEGURA: sem VITE_API_BASE (ou com o backend fora do ar) as
// funções viram no-op e NUNCA quebram o app nem o fluxo do usuário.
// -----------------------------------------------------------------------------
import { getServerMatchPayload } from './identity.js'

let ENV = {}
try {
  ENV = import.meta.env || {}
} catch {
  ENV = {}
}

/** Base do backend Fastify (mesma usada no checkout). Ex.: https://api.exemplo.com */
const API_BASE = (ENV.VITE_API_BASE || '').replace(/\/+$/, '')
const enabled = () => typeof fetch === 'function' && !!API_BASE

const sourceUrl = () =>
  typeof window !== 'undefined' ? window.location.href : undefined

async function post(path, body) {
  if (!enabled()) return { ok: false, reason: 'unconfigured' }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // keepalive: o evento SAI mesmo que a página navegue logo em seguida
      // (ex.: redirect pro checkout do MP ou pra App Store).
      keepalive: true,
      body: JSON.stringify(body),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/**
 * Espelha um Lead no servidor (CAPI). Passe o MESMO eventId usado no pixel para
 * o Meta DEDUPLICAR navegador + servidor. `custom` são dados opcionais do
 * evento (content_name, step, value…).
 */
export function reportLead({ eventId, custom = {} } = {}) {
  return post('/api/lead', {
    eventId,
    eventSourceUrl: sourceUrl(),
    match: getServerMatchPayload(),
    custom,
  })
}

/**
 * Anexa os dados de correspondência do visitante (email, _fbp, _fbc,
 * external_id) a uma preapproval do Mercado Pago, guardando no backend por
 * `preapprovalId`. Quando o webhook confirmar o pagamento, o Purchase server-
 * side sai com ESSES dados — o webhook, sozinho, não enxerga os cookies nem o
 * IP real do usuário. Chame no RETORNO do checkout, assim que houver o
 * preapprovalId.
 */
export function attachCheckoutMatch(preapprovalId) {
  if (!preapprovalId) return Promise.resolve({ ok: false })
  return post('/api/checkout/attach', {
    preapprovalId,
    eventSourceUrl: sourceUrl(),
    match: getServerMatchPayload(),
  })
}

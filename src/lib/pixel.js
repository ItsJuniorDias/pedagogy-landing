// -----------------------------------------------------------------------------
// lib/pixel.js — Camada de eventos do Meta (Facebook) Pixel para o build web.
//
// O pixel base (init + primeiro PageView) já vive no index.html. Este módulo é
// o ÚNICO ponto por onde toda ação rastreada passa, de forma que:
//   • nada quebra se o pixel estiver bloqueado, ainda carregando ou ausente
//     (ex.: o código react-native-web dos jogos rodando onde não há `fbq`);
//   • os eventos têm nome e formato consistentes (padrão vs. custom);
//   • em dev (ou com ?pixeldebug=1 na URL) cada evento é logado no console,
//     para você conferir o funil com a extensão Meta Pixel Helper.
//
// EVENTOS PADRÃO vs. CUSTOM
//   fbq('track', 'PageView' | 'ViewContent' | 'Lead' | 'CompleteRegistration' |
//                'InitiateCheckout' | 'Subscribe' | 'Purchase' | 'Contact')
//     → Eventos predefinidos do Meta. Otimização de campanha, mensuração
//       agregada (AEM) e as colunas padrão do Gerenciador de Anúncios já
//       entendem esses eventos nativamente.
//   fbq('trackCustom', 'DownloadClick' | 'PlanSelected' | 'GamePlayed' | ...)
//     → Eventos nossos. Aparecem para criar públicos/regras, mas o Meta só
//       otimiza por eles depois que você cria uma Conversão Personalizada no
//       Gerenciador de Eventos.
//
// COMPATÍVEL COM A CONVERSIONS API (CAPI)
//   Todo evento padrão é enviado com um `eventID` gerado. Se mais tarde você
//   adicionar uma chamada server-side pela Conversions API, envie o MESMO
//   evento com o MESMO eventID e o Meta faz a DEDUPLICAÇÃO das cópias
//   navegador + servidor automaticamente.
// -----------------------------------------------------------------------------

import { getPixelMatchKeys, saveIdentity } from './identity.js'
import { reportLead } from './capi-client.js'

const isBrowser = typeof window !== 'undefined'

// import.meta.env só existe no build Vite; protegido para nunca quebrar caso
// este arquivo seja avaliado em outro contexto (ex.: bundler nativo).
let ENV = {}
try {
  ENV = import.meta.env || {}
} catch {
  ENV = {}
}

/** ID do pixel, espelhado do index.html. Sobrescreva com VITE_META_PIXEL_ID. */
export const PIXEL_ID = ENV.VITE_META_PIXEL_ID || '967920369353096'

// Debug ao rodar o dev server, ou em qualquer página com ?pixeldebug=1.
const DEBUG =
  isBrowser &&
  (Boolean(ENV.DEV) || /[?&]pixeldebug=1\b/.test(window.location.search))

/** O `fbq` está presente? (false no nativo / quando o pixel é bloqueado). */
export const fbqReady = () => isBrowser && typeof window.fbq === 'function'

/** ID usado para deduplicar as cópias navegador vs. Conversions API. */
function makeEventId(name) {
  const rnd = Math.random().toString(36).slice(2, 10)
  return `${name}.${Date.now().toString(36)}.${rnd}`
}

function logEvent(kind, name, params, eventID) {
  if (!DEBUG) return
  // eslint-disable-next-line no-console
  console.debug(
    `%c[pixel]%c ${kind} %c${name}`,
    'color:#6D4BE0;font-weight:700',
    'color:#888',
    'color:#16BFA6;font-weight:700',
    { ...params, ...(eventID ? { eventID } : {}) },
  )
}

// Remove undefined/null/'' para nunca mandar chaves vazias ao Meta.
function clean(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined && v !== null && v !== '') out[k] = v
  }
  return out
}

// =============================================================================
// ADVANCED MATCHING — o que faz a Qualidade da Correspondência de Eventos (EMQ)
// sair de 3/10. Reinicia o pixel passando os dados do visitante (email, nome,
// telefone, external_id). O fbq NORMALIZA e faz o HASH sozinho e passa a anexar
// esses dados em TODOS os eventos seguintes. Reinit NÃO redispara PageView.
// =============================================================================

let lastAmSig = '' // evita reinit redundante com os mesmos dados

// Loga só quais chaves foram setadas — nunca o valor (não vaza PII no console).
function maskKeys(keys) {
  return Object.keys(keys).reduce((o, k) => ((o[k] = 'set'), o), {})
}

/** Aplica no pixel os dados de correspondência já conhecidos do visitante. */
export function applyAdvancedMatching() {
  if (!fbqReady()) return
  const keys = getPixelMatchKeys() // { em?, fn?, ln?, ph?, external_id }
  const sig = JSON.stringify(keys)
  if (sig === lastAmSig) return // nada mudou desde a última vez
  lastAmSig = sig
  logEvent('init', 'AdvancedMatching', maskKeys(keys))
  try {
    window.fbq('init', PIXEL_ID, keys)
  } catch {
    /* analytics nunca pode quebrar o app */
  }
}

/**
 * "Agora sabemos quem é este visitante." Salva a identidade (email/nome/telefone)
 * e aplica o Advanced Matching, de forma que os próximos eventos do pixel já
 * saiam com email. Chame no cadastro, no login e na captura de email.
 */
export function identify(partial = {}) {
  saveIdentity(partial)
  applyAdvancedMatching()
}

/**
 * Chame UMA vez no boot do app. Aplica o Advanced Matching com o que já estiver
 * guardado (external_id sempre; email/nome se o visitante já se identificou numa
 * visita anterior) — assim usuários recorrentes já são casados desde o começo.
 */
export const bootIdentity = () => applyAdvancedMatching()

/** Dispara um evento PADRÃO do Meta (com eventID automático p/ dedupe CAPI). */
export function track(name, params = {}, { eventID } = {}) {
  const id = eventID || makeEventId(name)
  logEvent('track', name, params, id)
  if (!fbqReady()) return id
  try {
    window.fbq('track', name, clean(params), { eventID: id })
  } catch {
    /* analytics nunca pode quebrar o app */
  }
  return id
}

/** Dispara um evento CUSTOM do Meta. */
export function trackCustom(name, params = {}, { eventID } = {}) {
  const id = eventID || makeEventId(name)
  logEvent('trackCustom', name, params, id)
  if (!fbqReady()) return id
  try {
    window.fbq('trackCustom', name, clean(params), { eventID: id })
  } catch {
    /* ignora */
  }
  return id
}

/** PageView de SPA — chame a cada troca de rota client-side. */
export function pageView(path) {
  logEvent('track', 'PageView', path ? { path } : {})
  if (!fbqReady()) return
  try {
    window.fbq('track', 'PageView')
  } catch {
    /* ignora */
  }
}

// ── Helper de preço ──────────────────────────────────────────────────────────
// Converte um preço de exibição ("$9.99", "$79.99", "R$ 49,90") em
// { value, currency }. Detecta R$ → BRL e $ → USD.
export function parsePrice(display) {
  if (typeof display !== 'string') return { value: undefined, currency: undefined }
  const currency = /r\$/i.test(display)
    ? 'BRL'
    : display.includes('$')
      ? 'USD'
      : undefined
  let n = display.replace(/[^\d.,]/g, '')
  if (currency === 'BRL') n = n.replace(/\./g, '').replace(',', '.') // 49,90 → 49.90
  else n = n.replace(/,/g, '') // 1,299.99 → 1299.99
  const value = parseFloat(n)
  return { value: Number.isFinite(value) ? value : undefined, currency }
}

// =============================================================================
// Helpers nomeados — um por ação relevante do funil. Importe estes em vez de
// chamar track()/trackCustom() com strings soltas, para manter nomes e
// parâmetros consistentes em todo o código.
// =============================================================================

// ---- Topo do funil (landing) -----------------------------------------------

/** Qualquer CTA de "baixar o app" (botão do hero, selos das lojas, preços). */
export const trackDownloadClick = ({ placement, cta, destination, plan } = {}) =>
  trackCustom('DownloadClick', { placement, cta, destination, plan })

/** Botão flutuante do WhatsApp → Contact (evento padrão do Meta). */
export const trackContact = ({ channel = 'whatsapp' } = {}) =>
  track('Contact', { channel })

/** Clique leve de CTA no header (Get started / Log in). */
export const trackCtaClick = ({ cta, placement } = {}) =>
  trackCustom('CTAClick', { cta, placement })

/** Seção de preços entrou na viewport → ViewContent (padrão). */
export const trackViewPricing = () =>
  track('ViewContent', { content_type: 'pricing', content_name: 'Landing pricing' })

/** Marco de profundidade de rolagem na landing (custom). */
export const trackScrollDepth = (depth) => trackCustom('ScrollDepth', { depth })

// ---- Cadastro / autenticação -----------------------------------------------

/**
 * Intenção real (etapa de conta válida / email capturado) → Lead (padrão).
 *
 * Dispara no navegador E espelha no servidor (CAPI) com o MESMO eventID, então
 * o Meta deduplica as duas cópias. A cópia do servidor leva IP + User-Agent +
 * _fbp + _fbc + email hasheado — é ela que puxa a EMQ deste evento pra cima.
 * Só tem efeito de servidor se o visitante já foi identificado (identify) e se
 * VITE_API_BASE estiver configurado; caso contrário, o mirror é no-op seguro.
 */
export const trackLead = ({ content_name = 'signup', step } = {}) => {
  const eventID = track('Lead', { content_name, step })
  reportLead({ eventId: eventID, custom: { content_name, step } })
  return eventID
}

/** Conta criada → CompleteRegistration (padrão). */
export const trackCompleteRegistration = ({ method = 'email' } = {}) =>
  track('CompleteRegistration', {
    method,
    status: true,
    content_name: 'account',
  })

/** Usuário existente fez login (custom — o Meta não tem evento Login padrão). */
export const trackLogin = ({ method = 'email' } = {}) =>
  trackCustom('Login', { method })

// ---- Assinatura (a receita) ------------------------------------------------

/** Paywall exibido → ViewContent (padrão). */
export const trackViewPaywall = ({ kind, title } = {}) =>
  track('ViewContent', {
    content_type: 'paywall',
    content_name: title || 'Premium paywall',
    context: kind,
  })

/** Plano alternado no paywall (custom). */
export const trackSelectPlan = ({ plan, value, currency } = {}) =>
  trackCustom('PlanSelected', { plan, value, currency })

/** Botão Assinar tocado → InitiateCheckout (padrão). */
export const trackInitiateSubscription = ({ plan, value, currency } = {}) =>
  track('InitiateCheckout', {
    content_type: 'subscription',
    content_name: plan,
    value,
    currency,
    num_items: 1,
  })

/**
 * ID de evento DETERMINÍSTICO para a conversão da assinatura, derivado do
 * preapproval_id do Mercado Pago. Navegador e servidor DEVEM montar o mesmo id
 * do mesmo jeito — assim o Meta DEDUPLICA as cópias navegador vs. CAPI em vez de
 * contar receita duas vezes. (O eventID aleatório de makeEventId nunca bateria
 * com o servidor, então dedupe não funcionaria para a compra.)
 */
export const subscriptionEventId = (preapprovalId) =>
  preapprovalId ? `sub.${preapprovalId}` : undefined

/**
 * Assinatura PAGA e confirmada (status MP = authorized) → Purchase (padrão).
 *
 * Este é o ÚNICO evento de receita da assinatura. Dispare-o SOMENTE depois de
 * confirmar o pagamento no servidor — NUNCA no clique do botão nem no retorno
 * cru do checkout (o back_url do MP dispara mesmo sem pagamento).
 *
 * Usa eventID determinístico (subscriptionEventId) para o servidor mandar o
 * MESMO Purchase com o MESMO id e o Meta deduplicar as duas cópias.
 */
export const trackSubscriptionPurchase = ({ plan, value, currency, id } = {}) =>
  track(
    'Purchase',
    {
      content_type: 'subscription',
      content_name: plan,
      value,
      currency,
      predicted_ltv: value,
      num_items: 1,
      subscription_id: id,
      transaction_id: id,
    },
    { eventID: subscriptionEventId(id) },
  )

/**
 * @deprecated Disparava `Subscribe` no retorno do checkout, de forma otimista —
 * antes de confirmar o pagamento. Use `trackSubscriptionPurchase`, chamado só
 * após o servidor confirmar status `authorized`. Mantido apenas para não quebrar
 * imports antigos; não use em código novo.
 */
export const trackSubscribe = ({ plan, value, currency, provider, id } = {}) =>
  track('Subscribe', {
    content_name: plan,
    value,
    currency,
    predicted_ltv: value,
    provider,
    subscription_id: id,
  })

/** Botão dev "Simular assinatura" — custom, para nunca poluir o Purchase. */
export const trackSimulatedSubscribe = ({ plan } = {}) =>
  trackCustom('SimulatedSubscribe', { plan })

// ---- Loja de moedas (compras avulsas dentro do jogo) -----------------------

export const trackInitiateCoinCheckout = ({
  sku,
  value,
  currency = 'BRL',
  coins,
} = {}) =>
  track('InitiateCheckout', {
    content_type: 'coins',
    content_ids: sku ? [sku] : undefined,
    content_name: sku,
    value,
    currency,
    coins,
    num_items: 1,
  })

/** Pacote de moedas pago + creditado no retorno → Purchase (padrão). */
export const trackCoinPurchase = ({
  sku,
  value,
  currency = 'BRL',
  coins,
  id,
} = {}) =>
  track('Purchase', {
    content_type: 'coins',
    content_ids: sku ? [sku] : undefined,
    content_name: sku,
    value,
    currency,
    coins,
    num_items: 1,
    transaction_id: id,
  })

export const trackSimulatedCoinPurchase = ({ sku, coins } = {}) =>
  trackCustom('SimulatedCoinPurchase', { sku, coins })

// ---- Engajamento (públicos / sinais de retenção) ---------------------------

export const trackViewStory = ({ id, title } = {}) =>
  track('ViewContent', {
    content_type: 'story',
    content_ids: id ? [id] : undefined,
    content_name: title,
  })

export const trackViewLesson = ({ id, title } = {}) =>
  track('ViewContent', {
    content_type: 'lesson',
    content_ids: id ? [id] : undefined,
    content_name: title,
  })

export const trackPlayGame = ({ game } = {}) =>
  trackCustom('GamePlayed', { game })

export const trackAddReader = () => trackCustom('AddReader', {})

// -----------------------------------------------------------------------------
// lib/identity.js — Identidade do visitante para ELEVAR a Qualidade da
// Correspondência de Eventos (EMQ) do Meta.
//
// POR QUE ISTO EXISTE
//   EMQ baixa (3/10) = o Meta recebe os eventos mas quase não consegue casá-los
//   com um usuário real do Facebook, porque o `user_data` vai fraco. O maior
//   ganho de correspondência vem de mandar um EMAIL junto de CADA evento, além
//   dos cookies do próprio pixel (_fbp / _fbc), de um external_id estável e —
//   no servidor — do IP e do User-Agent.
//
// O QUE ESTE MÓDULO FAZ (só ESTADO — nada de rede nem de fbq aqui)
//   • Guarda a identidade do visitante (email, nome, telefone) no localStorage,
//     para reaproveitar em TODOS os eventos seguintes, não só no da captura.
//   • Cria um external_id estável (uuid) e persistido — o MESMO no navegador e
//     no servidor, o que por si só já melhora a correspondência.
//   • Lê os cookies _fbp e _fbc do pixel e, quando o _fbc não existe mas a URL
//     tem `fbclid`, SINTETIZA o _fbc no formato oficial que o Meta espera.
//
// Quem aplica isto no pixel é o lib/pixel.js; quem manda pro servidor (CAPI) é
// o lib/capi-client.js.
// -----------------------------------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const ID_KEY = 'pedagogy.identity.v1' // { email, firstName, lastName, phone }
const XID_KEY = 'pedagogy.external_id.v1' // uuid estável do visitante

// ── localStorage seguro (aba anônima / SSR nunca quebram) ────────────────────
function readJSON(key, fallback) {
  if (!isBrowser) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, val) {
  if (!isBrowser) return
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* storage cheio/indisponível — degrada sem quebrar */
  }
}

// ── Normalização (o Meta exige minúsculas/trim p/ o hash bater) ──────────────
// Estas regras TÊM que ser idênticas às do servidor (mercadopago-conversions.ts)
// senão o hash do navegador e o do backend não casam.
export const normEmail = (v) =>
  typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : undefined
export const normName = (v) =>
  typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : undefined
// Telefone: só dígitos, com DDI. Assume Brasil (55) quando vier sem DDI.
export const normPhone = (v) => {
  if (typeof v !== 'string') return undefined
  let d = v.replace(/\D/g, '')
  if (!d) return undefined
  if (d.length <= 11) d = `55${d}` // (11) 98888-7777 → 5511988887777
  return d
}

// ── external_id estável ──────────────────────────────────────────────────────
function uuid() {
  if (isBrowser && window.crypto?.randomUUID) return window.crypto.randomUUID()
  return 'xid-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** external_id do visitante — criado uma vez e reusado sempre (nav + servidor). */
export function getExternalId() {
  let id = readJSON(XID_KEY, null)
  if (!id) {
    id = uuid()
    writeJSON(XID_KEY, id)
  }
  return id
}

// ── Cookies do pixel: _fbp e _fbc ────────────────────────────────────────────
function readCookie(name) {
  if (!isBrowser) return undefined
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : undefined
}

/** _fbp — id de navegador que o pixel grava sozinho no primeiro PageView. */
export const getFbp = () => readCookie('_fbp')

/**
 * _fbc identifica o CLIQUE no anúncio — é o parâmetro de MAIOR peso para casar
 * uma conversão com o anúncio que a gerou. O pixel cria o cookie _fbc quando a
 * pessoa chega com `fbclid` na URL, mas isso pode não ter rodado ainda (ou o
 * cookie foi perdido numa navegação). Aqui, na falta do cookie, sintetizamos o
 * _fbc a partir do fbclid da URL no formato oficial: fb.1.<timestamp_ms>.<fbclid>.
 */
export function getFbc() {
  const cookie = readCookie('_fbc')
  if (cookie) return cookie
  if (!isBrowser) return undefined
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`
  } catch {
    /* ignora */
  }
  return undefined
}

// ── Identidade (email / nome / telefone) ─────────────────────────────────────
export function getIdentity() {
  return readJSON(ID_KEY, {})
}

/** Já sabemos o email deste visitante? (usado para não repetir a captura). */
export function hasEmail() {
  return !!getIdentity().email
}

/**
 * Salva/mescla a identidade do visitante. Só grava campos com valor, então
 * chamar com { email } NÃO apaga um nome já guardado. Retorna a identidade
 * normalizada resultante.
 */
export function saveIdentity(partial = {}) {
  const next = { ...getIdentity() }
  const email = normEmail(partial.email)
  const firstName = normName(partial.firstName)
  const lastName = normName(partial.lastName)
  const phone = normPhone(partial.phone)
  if (email) next.email = email
  if (firstName) next.firstName = firstName
  if (lastName) next.lastName = lastName
  if (phone) next.phone = phone
  writeJSON(ID_KEY, next)
  return next
}

/**
 * Chaves de correspondência RAW (não hasheadas) para o Advanced Matching do
 * pixel. O próprio fbq normaliza e faz o hash SHA-256 antes de enviar — então
 * aqui vão valores CRUS. Só inclui o que existir (nada de chaves vazias).
 */
export function getPixelMatchKeys() {
  const id = getIdentity()
  const out = {}
  if (id.email) out.em = id.email
  if (id.firstName) out.fn = id.firstName
  if (id.lastName) out.ln = id.lastName
  if (id.phone) out.ph = id.phone
  out.external_id = getExternalId()
  return out
}

/**
 * Pacote para o SERVIDOR (CAPI). Manda os valores CRUS + os cookies do pixel; o
 * backend faz o hash do que precisa e anexa IP/User-Agent do request. Enviar
 * email cru para o NOSSO backend por HTTPS é o fluxo padrão de CAPI — o hash
 * acontece no servidor, antes de ir pro Meta.
 */
export function getServerMatchPayload() {
  const id = getIdentity()
  return {
    email: id.email,
    firstName: id.firstName,
    lastName: id.lastName,
    phone: id.phone,
    externalId: getExternalId(),
    fbp: getFbp(),
    fbc: getFbc(),
  }
}

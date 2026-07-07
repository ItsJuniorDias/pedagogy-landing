// -----------------------------------------------------------------------------
// components/EmailGate.jsx — Captura de email antes de mandar pro app.
//
// PARA QUE SERVE
//   Elevar a Qualidade da Correspondência de Eventos (EMQ) do Meta. Sem email, o
//   Meta quase não casa as conversões com quem viu o anúncio (EMQ ~3/10). Aqui,
//   no momento de maior intenção (clique em "baixar o app"), pedimos o email uma
//   única vez. Com ele em mãos:
//     • disparamos um Lead com Advanced Matching (o pixel já anexa email
//       hasheado em TODOS os eventos seguintes);
//     • espelhamos o Lead no servidor (CAPI) com IP + User-Agent + _fbp + _fbc;
//     • seguimos o usuário pro destino normal (App Store no iOS/desktop, app web
//       no Android).
//
//   Uma vez capturado o email (aqui, no cadastro ou no login), o gate não
//   aparece de novo — os cliques seguintes vão direto pro destino.
//
// COMO PLUGAR
//   1) Envolva o app com <EmailGateProvider> (feito no main.jsx).
//   2) Os CTAs de "get the app" usam useGetApp(), que chama requestApp() daqui.
// -----------------------------------------------------------------------------
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { IMG } from '../assets.js'
import { spring, EASE } from '../motion.js'
import { hasEmail } from '../lib/identity.js'
import { identify, trackLead } from '../lib/pixel.js'

const GateCtx = createContext(null)

/** Hook usado pelos CTAs para pedir a abertura do app (com gate quando preciso). */
export const useAppGate = () => {
  const ctx = useContext(GateCtx)
  // Fallback defensivo: se por algum motivo o provider não estiver montado,
  // não trava o clique — segue direto pro destino.
  if (!ctx) {
    return {
      requestApp: ({ target } = {}) => {
        if (!target) return
        if (target.external) {
          window.open(target.to, '_blank', 'noopener,noreferrer')
        } else {
          window.location.assign(target.to)
        }
      },
    }
  }
  return ctx
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailGateProvider({ children }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(null) // { placement, cta, plan, target }
  const emailRef = useRef(null)

  const open = !!pending

  // Leva o usuário ao destino original do CTA.
  const proceed = useCallback(
    (target) => {
      if (!target) return
      if (target.external) {
        // App Store: nova aba, mantém a landing aberta. Chamado dentro de um
        // clique (gesto do usuário), então o popup não é bloqueado.
        window.open(target.to, '_blank', 'noopener,noreferrer')
      } else {
        navigate(target.to)
      }
    },
    [navigate],
  )

  const requestApp = useCallback(
    (info = {}) => {
      const { target } = info
      // Já temos o email? Não incomoda de novo — vai direto (ainda no gesto do
      // clique, então window.open segue liberado).
      if (hasEmail()) {
        proceed(target)
        return
      }
      setPending(info)
    },
    [proceed],
  )

  const value = useMemo(() => ({ requestApp }), [requestApp])

  return (
    <GateCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && (
          <GateModal
            pending={pending}
            emailRef={emailRef}
            onClose={() => setPending(null)}
            onProceed={proceed}
          />
        )}
      </AnimatePresence>
    </GateCtx.Provider>
  )
}

function GateModal({ pending, emailRef, onClose, onProceed }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  // Fecha no Esc; foca o campo de email ao abrir.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => emailRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [onClose, emailRef])

  const submit = (e) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setErr('Enter a valid email so we can send your link.')
      emailRef.current?.focus()
      return
    }
    // 1) Identifica → aplica Advanced Matching (email hasheado em todo evento).
    identify({ email: value, firstName: name })
    // 2) Lead (navegador + servidor, mesmo eventID → dedupe).
    trackLead({ content_name: 'get_app', step: 'email_gate' })
    // 3) Segue pro destino original do CTA e fecha.
    const target = pending?.target
    onClose()
    onProceed(target)
  }

  const skip = () => {
    const target = pending?.target
    onClose()
    onProceed(target)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      aria-hidden={false}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={spring.press}
        className="relative w-full max-w-md rounded-[28px] bg-cream p-6 sm:p-7 ring-1 ring-black/5 shadow-2xl"
      >
        {/* close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-inksoft ring-1 ring-black/5 hover:text-ink"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={IMG.owl}
            alt=""
            className="mb-3 h-20 w-20 select-none"
            draggable={false}
          />
          <h2
            id="gate-title"
            className="font-display text-2xl font-extrabold text-ink"
          >
            One quick thing 🎈
          </h2>
          <p className="mt-1.5 text-[15px] font-semibold text-inksoft">
            Pop in your email and we'll send your download link plus a free
            reading starter pack. Ad-free, no spam — ever.
          </p>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
          <input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (err) setErr('')
            }}
            className="w-full rounded-2xl border-2 border-black/5 bg-white px-4 py-3.5 text-base font-bold text-ink placeholder:text-inksoft/60 focus:border-grape focus:outline-none"
          />
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Your first name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border-2 border-black/5 bg-white px-4 py-3.5 text-base font-bold text-ink placeholder:text-inksoft/60 focus:border-grape focus:outline-none"
          />

          {err && <p className="text-sm font-bold text-bubbled">{err}</p>}

          <motion.button
            type="submit"
            className="btn3d b-pink w-full px-6 py-3.5 text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
          >
            Get the app →
          </motion.button>
        </form>

        <button
          type="button"
          onClick={skip}
          className="mt-3 block w-full text-center text-sm font-bold text-inksoft hover:text-ink hover:underline"
        >
          No thanks, take me there
        </button>
      </motion.div>
    </motion.div>
  )
}

import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Reveal, Stagger, RevealItem, Check } from '../../components/ui.jsx'
import { fadeUp, spring } from '../../motion.js'
import { PRICING } from '../../data.js'
import { isPremiumPlan } from '../../access.js'
import { startSubscriptionCheckout } from '../../payments/mercadopago.js'

// Where to send people who back out, based on what they tried to unlock.
const backFor = (kind) => (kind === 'course' ? '/app/path' : '/app/stories')

function PlanCard({ id, name, price, per, sub, features, highlight, selected, onSelect }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.press}
      aria-pressed={selected}
      className={
        'relative h-full text-left rounded-3xl p-6 sm:p-7 flex flex-col transition-shadow focus:outline-none ' +
        (highlight
          ? 'text-white ring-1 ring-white/15'
          : 'bg-white text-ink ring-1 ' + (selected ? 'ring-grape' : 'ring-black/5')) +
        (selected ? ' shadow-[0_22px_46px_-26px_rgba(58,49,66,.55)]' : '')
      }
      style={highlight ? { background: 'linear-gradient(160deg,#6D4BE0,#5435C4)' } : undefined}
    >
      {highlight && (
        <span className="absolute -top-3 right-6 rounded-full bg-sunny text-ink text-[12px] font-extrabold px-3 py-1 shadow">
          ★ BEST VALUE
        </span>
      )}

      {/* selection check */}
      <span
        className={
          'absolute top-5 left-5 grid place-items-center w-6 h-6 rounded-full text-[13px] font-extrabold ' +
          (selected
            ? highlight
              ? 'bg-sunny text-ink'
              : 'bg-grape text-white'
            : highlight
            ? 'bg-white/20 text-white/70'
            : 'bg-cream text-inksoft')
        }
        aria-hidden="true"
      >
        {selected ? '✓' : ''}
      </span>

      <div className={'font-display font-extrabold text-xl ' + (highlight ? '' : 'text-ink')}>
        {name}
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="font-display font-extrabold text-5xl">{price}</span>
        <span className={'mb-1.5 font-bold ' + (highlight ? 'text-white/80' : 'text-inksoft')}>
          / {per}
        </span>
      </div>
      <p className={'mt-1.5 font-bold text-[14px] ' + (highlight ? 'text-sunny' : 'text-inksoft')}>
        {sub}
      </p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className={'flex gap-2.5 font-bold text-[15px] ' + (highlight ? '' : 'text-ink')}>
            <Check color={highlight ? '#16BFA6' : '#6D4BE0'} />
            {f}
          </li>
        ))}
      </ul>
    </motion.button>
  )
}

export default function Paywall() {
  const { user, upgradePlan } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const ctx = location.state || {} // { kind, title, emoji, from }

  const [selected, setSelected] = useState('annual')
  const [notice, setNotice] = useState(null) // 'coming-soon' | 'error'
  const [working, setWorking] = useState(false)

  // Already subscribed → no paywall; go back where they were.
  if (isPremiumPlan(user?.plan)) {
    return <Navigate to={ctx.from || '/app'} replace />
  }

  const goBack = ctx.from && ctx.kind ? backFor(ctx.kind) : '/app'

  const plans = useMemo(
    () => ({
      monthly: {
        id: 'monthly',
        name: 'Monthly',
        price: PRICING.monthly.price,
        per: 'month',
        sub: PRICING.monthly.note,
        features: PRICING.monthly.features,
      },
      annual: {
        id: 'annual',
        name: 'Annual',
        price: PRICING.annual.price,
        per: 'year',
        sub: PRICING.annual.subnote,
        features: PRICING.annual.features,
        highlight: true,
      },
    }),
    []
  )

  // Real checkout (Mercado Pago) isn't wired up yet — report that honestly.
  const handleSubscribe = async () => {
    setNotice(null)
    setWorking(true)
    try {
      const res = await startSubscriptionCheckout({ planId: selected, email: user?.email })
      if (!res?.ok) setNotice('coming-soon')
    } catch {
      setNotice('error')
    } finally {
      setWorking(false)
    }
  }

  // Dev-only: flip to Premium so the unlock flow is testable before payments.
  const handleSimulate = () => {
    upgradePlan('Premium', { plan: selected, cycle: plans[selected].per })
    navigate(ctx.from || '/app', { replace: true })
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Reveal>
        <Link
          to={goBack}
          className="inline-flex items-center gap-1.5 font-display font-extrabold text-inksoft hover:text-grape text-sm"
        >
          ← Maybe later
        </Link>
      </Reveal>

      {/* hero */}
      <Reveal delay={40}>
        <div
          className="relative overflow-hidden rounded-[28px] p-7 sm:p-9 text-white"
          style={{ background: 'linear-gradient(140deg,#6D4BE0,#5435C4)' }}
        >
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide">
              ✨ Pedagogy Premium
            </span>
            <h1 className="mt-3 font-display font-extrabold text-3xl sm:text-4xl leading-tight">
              {ctx.title ? `Unlock ${ctx.title}` : 'Unlock the whole world of stories'}
            </h1>
            <p className="mt-2 text-white/85 font-semibold text-lg">
              {ctx.title
                ? 'Plus every other story, the full learning path, and new content each month.'
                : '50+ interactive stories, the full phonics path, and mini-games — all in one plan.'}
            </p>
          </div>
          <div className="pointer-events-none absolute -right-3 -bottom-5 text-[7rem] opacity-90 select-none">
            {ctx.emoji || '🪄'}
          </div>
        </div>
      </Reveal>

      {/* plans */}
      <Stagger className="grid sm:grid-cols-2 gap-5 items-stretch" stagger={0.1}>
        <RevealItem variants={fadeUp}>
          <PlanCard
            {...plans.monthly}
            selected={selected === 'monthly'}
            onSelect={() => setSelected('monthly')}
          />
        </RevealItem>
        <RevealItem variants={fadeUp}>
          <PlanCard
            {...plans.annual}
            selected={selected === 'annual'}
            onSelect={() => setSelected('annual')}
          />
        </RevealItem>
      </Stagger>

      {/* checkout */}
      <Reveal>
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)]">
          <motion.button
            type="button"
            onClick={handleSubscribe}
            disabled={working}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={'btn3d b-grape w-full px-6 py-4 text-lg ' + (working ? 'opacity-70 pointer-events-none' : '')}
          >
            {working ? 'Connecting…' : `Subscribe — ${plans[selected].price} / ${plans[selected].per}`}
          </motion.button>

          {notice === 'coming-soon' && (
            <p className="mt-3 rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
              💳 Card checkout with Mercado Pago is coming soon. Subscriptions aren’t live just yet —
              hang tight!
            </p>
          )}
          {notice === 'error' && (
            <p className="mt-3 rounded-2xl bg-blush px-4 py-3 text-[14px] font-bold text-bubbled ring-1 ring-bubblegum/20">
              Something went wrong reaching checkout. Please try again.
            </p>
          )}

          <p className="mt-4 text-center text-[13px] font-bold text-inksoft">
            Cancel anytime · Family-friendly billing · No ads, ever
          </p>
        </div>
      </Reveal>

      {/* dev preview — remove once Mercado Pago is connected */}
      <Reveal>
        <div className="rounded-3xl border-2 border-dashed border-grape/30 bg-lilac/20 p-5">
          <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide text-grape">
            🛠️ Developer preview
          </div>
          <p className="mt-1.5 text-[14px] font-semibold text-inksoft">
            Payments aren’t wired up yet. Use this to simulate a successful subscription and test the
            unlock flow end to end.
          </p>
          <button
            type="button"
            onClick={handleSimulate}
            className="btn3d b-white ring-1 ring-grape/15 px-5 py-3 mt-3"
          >
            Simulate subscription ({plans[selected].name})
          </button>
        </div>
      </Reveal>
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal, Stagger, RevealItem } from './ui.jsx'
import { fadeUp, EASE } from '../motion.js'
import { FAQ } from '../data.js'

function Item({ q, a, isOpen, onToggle }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_12px_30px_-24px_rgba(58,49,66,.5)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 sm:py-5"
      >
        <span className="font-display font-extrabold text-ink text-[17px] sm:text-lg">{q}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-lilac text-grape"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-5 sm:px-6 pb-5 -mt-0.5 text-inksoft font-semibold leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Faq() {
  // First question open by default so the section reads as answered, not empty.
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-mint">Questions</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
            Everything parents ask
          </h2>
          <p className="mt-4 text-lg text-inksoft font-semibold">
            Straight answers — safety, price, devices, and how to cancel.
          </p>
        </Reveal>

        <Stagger className="mt-10 space-y-3" stagger={0.06} amount={0.15}>
          {FAQ.map(([q, a], i) => (
            <RevealItem key={i} variants={fadeUp}>
              <Item q={q} a={a} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

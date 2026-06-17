import { motion } from 'framer-motion'
import { Reveal, Stagger, RevealItem, Check } from './ui.jsx'
import { fadeUp, popIn, spring, viewport as vp } from '../motion.js'
import { PRICING } from '../data.js'
import { useGetApp } from '../hooks/useGetApp.js'

export default function Pricing() {
  const { monthly, annual } = PRICING
  const app = useGetApp()
  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-bubblegum">Plans</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
            Unlock the whole world of stories
          </h2>
          <p className="mt-4 text-lg text-inksoft font-semibold">
            Free to download. Try it with your child, then choose the plan that fits.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid md:grid-cols-2 gap-6 items-stretch" stagger={0.12} amount={0.2}>
          {/* Monthly */}
          <RevealItem variants={fadeUp}>
            <motion.div
              className="h-full rounded-3xl bg-white p-7 sm:p-8 ring-1 ring-black/5 shadow-[0_18px_40px_-28px_rgba(58,49,66,.5)] flex flex-col"
              whileHover={{ y: -6, boxShadow: '0 28px 52px -26px rgba(58,49,66,.5)' }}
              transition={spring.press}
            >
              <div className="font-extrabold text-xl text-ink">Monthly</div>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-extrabold text-5xl text-ink">{monthly.price}</span>
                <span className="mb-1.5 font-bold text-inksoft">/ month</span>
              </div>
              <p className="mt-2 text-inksoft font-semibold text-[15px]">{monthly.note}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {monthly.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-ink font-bold">
                    <Check color="#6D4BE0" />
                    {f}
                  </li>
                ))}
              </ul>
              <motion.a
                {...app}
                className="btn3d b-white w-full px-6 py-3.5 mt-7 ring-1 ring-grape/15"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring.press}
              >
                Start monthly
              </motion.a>
            </motion.div>
          </RevealItem>

          {/* Annual (popular) */}
          <RevealItem variants={fadeUp}>
            <motion.div
              className="relative h-full rounded-3xl p-7 sm:p-8 flex flex-col text-white shadow-2xl"
              style={{ background: 'linear-gradient(160deg,#6D4BE0,#5435C4)' }}
              whileHover={{ y: -8, boxShadow: '0 34px 60px -26px rgba(84,53,196,.65)' }}
              transition={spring.press}
            >
              <motion.span
                className="absolute -top-3 right-6 rounded-full bg-sunny text-ink text-[12px] font-extrabold px-3 py-1 shadow"
                initial={{ scale: 0, rotate: -12 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ ...spring.bouncy, delay: 0.25 }}
              >
                ★ MOST POPULAR
              </motion.span>
              <div className="font-extrabold text-xl">Annual</div>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-extrabold text-5xl">{annual.price}</span>
                <span className="mb-1.5 font-bold text-white/80">/ year</span>
              </div>
              <p className="mt-2 font-bold text-sunny text-[15px]">{annual.subnote}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {annual.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5 font-bold">
                    <Check color="#16BFA6" />
                    {f}
                  </li>
                ))}
              </ul>
              <motion.div
                className="mt-5 rounded-2xl bg-white/10 ring-1 ring-white/20 px-4 py-3 text-center font-extrabold text-sunny text-[14px]"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ ...spring.pop, delay: 0.3 }}
              >
                {annual.promo}
              </motion.div>
              <motion.a
                {...app}
                className="btn3d b-sun w-full px-6 py-3.5 mt-4"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring.press}
              >
                Start annual
              </motion.a>
            </motion.div>
          </RevealItem>
        </Stagger>

        <p className="mt-6 text-center text-sm font-bold text-inksoft">
          Free to download · Cancel anytime · Family-friendly billing
        </p>
      </div>
    </section>
  )
}

import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
} from "framer-motion";
import { useEffect, useState } from "react";
import { resolveColor, WEEKDAYS } from "../../data.app.js";
import { Reveal } from "../ui.jsx";
import { spring } from "../../motion.js";

/** Section header with an eyebrow + optional action link on the right. */
export function SectionHead({ title, emoji, action }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
        {title} {emoji}
      </h2>
      {action}
    </div>
  );
}

/** A single big stat (streak, minutes, etc.) on a colored tile. */
export function StatTile({ emoji, value, label, color = "grape", delay = 0 }) {
  const c = resolveColor(color);
  return (
    <Reveal delay={delay}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={spring.press}
        className="rounded-3xl bg-white p-4 sm:p-5 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)]"
      >
        <span
          className="grid place-items-center w-11 h-11 rounded-2xl text-xl"
          style={{ background: c.bg }}
        >
          {emoji}
        </span>
        <div className="mt-3 font-display font-extrabold text-3xl text-ink leading-none">
          {value}
        </div>
        <div className="mt-1 text-[13px] font-bold text-inksoft">{label}</div>
      </motion.div>
    </Reveal>
  );
}

/**
 * Counts 0 → value once on mount. Honors the OS "reduce motion" setting
 * (the global <MotionConfig reducedMotion="user"> can't reach this imperative
 * animation, so we gate it here too).
 */
function useCountUp(value, { duration = 0.9 } = {}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [value, reduce, mv, duration]);

  return rounded;
}

/** Weekly reading-minutes mini bar chart. */
export function WeekBars({ week = [], color = "grape", total }) {
  const c = resolveColor(color);
  const reduce = useReducedMotion();

  const max = Math.max(1, ...week);
  const today = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  // Prefer the precise weekly total (raw minutes, rounded once) when provided;
  // fall back to summing the rounded bars so the component still works alone.
  const totalMin = total != null ? total : week.reduce((a, b) => a + b, 0);
  const animatedTotal = useCountUp(totalMin);

  const [hover, setHover] = useState(null);

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)] h-full">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display font-extrabold text-lg text-ink">
          This week
        </h3>
        <span className="text-[13px] font-bold text-inksoft">
          <motion.span>{animatedTotal}</motion.span> min read
        </span>
      </div>

      {/* Bars cascade in (stagger). Heights animate even though the parent
          <Reveal> handles the card's fade — different properties, no conflict. */}
      <motion.div
        className="mt-5 flex items-end justify-between gap-2 h-32"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        {week.map((v, i) => {
          const h = Math.max(Math.round((v / max) * 100), 6);
          const isToday = i === today;
          const isHover = hover === i;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 flex-1 h-full"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="relative w-full flex-1 flex items-end">
                {/* minute value, revealed on hover */}
                <motion.span
                  className="absolute left-1/2 -translate-x-1/2 -top-1 text-[10px] font-extrabold text-ink bg-cream px-1.5 py-0.5 rounded-full ring-1 ring-black/5 pointer-events-none whitespace-nowrap"
                  initial={false}
                  animate={{ opacity: isHover ? 1 : 0, y: isHover ? 0 : 4 }}
                  transition={spring.soft}
                >
                  {Math.round(v)}m
                </motion.span>

                <motion.div
                  className="w-full rounded-t-xl rounded-b-md origin-bottom"
                  style={{ background: isToday ? c.ring : c.bg }}
                  variants={{
                    hidden: { height: "0%" },
                    show: { height: `${h}%` },
                  }}
                  transition={spring.soft}
                  whileHover={
                    reduce ? undefined : { scaleY: 1.04, filter: "brightness(1.05)" }
                  }
                />
              </div>

              <span
                className={
                  "text-[11px] font-extrabold " +
                  (isToday ? "text-grape" : "text-inksoft/70")
                }
              >
                {WEEKDAYS[i]}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/** A learning-path tile with progress bar — mirrors the app mockup. */
export function PathTile({
  name,
  emoji,
  done,
  total,
  color = "grape",
  delay = 0,
}) {
  const c = resolveColor(color);
  const pct = Math.round((done / total) * 100);
  const complete = done >= total;
  return (
    <Reveal delay={delay}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={spring.press}
        className="rounded-3xl bg-white p-4 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)]"
        style={{ borderTop: `4px solid ${c.ring}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center w-12 h-12 rounded-2xl text-2xl"
            style={{ background: c.bg }}
          >
            {emoji}
          </span>
          <div className="min-w-0">
            <div className="font-display font-extrabold text-ink truncate">
              {name}
            </div>
            <div className="text-[12px] font-bold text-inksoft">
              {done} / {total} done {complete ? "🎉" : "⭐"}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-cream overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: c.ring }}
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ ...spring.soft, delay: 0.1 }}
          />
        </div>
      </motion.div>
    </Reveal>
  );
}

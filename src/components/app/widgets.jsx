import { motion } from "framer-motion";
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

/** Weekly reading-minutes mini bar chart. */
export function WeekBars({ week = [], color = "grape", total }) {
  const c = resolveColor(color);

  const max = Math.max(1, ...week);

  const today = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  // Prefer the precise weekly total (raw minutes, rounded once) when provided;
  // fall back to summing the rounded bars so the component still works alone.
  const totalMin = total != null ? total : week.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)] h-full">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display font-extrabold text-lg text-ink">
          This week
        </h3>
        <span className="text-[13px] font-bold text-inksoft">
          {totalMin} min read
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-2 h-32">
        {week.map((v, i) => {
          const h = Math.round((v / max) * 100);

          const isToday = i === today;

          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
              <div className="relative w-full flex-1 flex items-end">
                <motion.div
                  className="w-full rounded-t-xl rounded-b-md"
                  style={{ background: isToday ? c.ring : c.bg }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, 6)}%` }}
                  transition={{ ...spring.soft, delay: 0.04 * i }}
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
      </div>
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

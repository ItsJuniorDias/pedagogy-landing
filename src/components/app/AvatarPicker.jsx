import { motion } from 'framer-motion'
import { AVATARS, COLOR_KEYS, resolveColor } from '../../data.app.js'
import { spring } from '../../motion.js'

/**
 * AvatarPicker — choose an emoji + a color for a reader profile.
 * Controlled: pass `emoji`, `color`, and the onChange handlers.
 */
export default function AvatarPicker({ emoji, color, onEmoji, onColor }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-extrabold uppercase tracking-wide text-inksoft mb-2">
          Pick a buddy
        </p>
        <div className="grid grid-cols-8 gap-2">
          {AVATARS.map((e) => {
            const active = e === emoji
            return (
              <motion.button
                key={e}
                type="button"
                onClick={() => onEmoji(e)}
                whileTap={{ scale: 0.88 }}
                transition={spring.press}
                aria-pressed={active}
                aria-label={`Choose ${e}`}
                className={
                  'aspect-square grid place-items-center rounded-2xl text-2xl transition ' +
                  (active
                    ? 'ring-2 ring-grape bg-lilac'
                    : 'bg-white ring-1 ring-black/5 hover:bg-cream')
                }
              >
                <span>{e}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-extrabold uppercase tracking-wide text-inksoft mb-2">
          Pick a color
        </p>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_KEYS.map((key) => {
            const c = resolveColor(key)
            const active = key === color
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => onColor(key)}
                whileTap={{ scale: 0.88 }}
                transition={spring.press}
                aria-pressed={active}
                aria-label={`Color ${key}`}
                className="w-9 h-9 rounded-full grid place-items-center"
                style={{
                  background: c.bg,
                  boxShadow: `0 0 0 ${active ? 3 : 2}px ${active ? c.ring : 'transparent'}`,
                }}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: c.ring }} />
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal, Stagger, RevealItem } from '../../components/ui.jsx'
import { fadeUp, spring } from '../../motion.js'
import { STORIES_GRID, resolveStory } from '../../stories.index.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { getProgress, completedCount, hasLockedChapters, isPremiumPlan } from '../../access.js'

// Badge → little corner pill styling.
const BADGE = {
  New: { label: 'New', bg: '#16BFA6', fg: '#fff' },
  Hot: { label: 'Hot', bg: '#FF4D87', fg: '#fff' },
}

function StoryCard({ card }) {
  const { user, activeReader } = useAuth()
  const { status, chapters } = resolveStory(card.id)
  const ready = status === 'playable'
  const badge = card.badge ? BADGE[card.badge] : null

  // Active reader's progress on this story.
  const prog = getProgress(activeReader, 'chapter', card.id)
  const total = chapters.length
  const done = completedCount(chapters, prog)
  const finished = ready && total > 0 && done === total
  const inProgress = ready && done > 0 && !finished
  const pct = total ? Math.round((done / total) * 100) : 0

  // Has premium (locked) chapters the current plan can't open yet.
  const hasPremium = ready && hasLockedChapters(chapters) && !isPremiumPlan(user?.plan)

  const cta = !ready
    ? 'Peek →'
    : finished
    ? 'Re-read →'
    : inProgress
    ? 'Continue →'
    : 'Read →'

  return (
    <Link
      to={`/app/stories/${card.id}`}
      className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30 rounded-3xl"
      aria-label={`${card.title} — ${card.tag}, ${card.chapters} chapters, ages ${card.ageRange}${
        ready ? (hasPremium ? ', includes premium chapters' : '') : ', coming soon'
      }`}
    >
      <motion.article
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.97 }}
        transition={spring.press}
        className="group h-full overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)]"
      >
        {/* cover */}
        <div
          className="relative h-28 sm:h-32 grid place-items-center"
          style={{ background: `linear-gradient(150deg, ${card.bg}, ${card.bg}cc)` }}
        >
          <motion.span
            className="text-5xl sm:text-6xl drop-shadow-sm select-none"
            whileHover={{ scale: 1.12, rotate: -6 }}
            transition={spring.bouncy}
          >
            {card.emoji}
          </motion.span>

          {/* badge */}
          {badge && (
            <span
              className="absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-display font-extrabold shadow-sm"
              style={{ background: badge.bg, color: badge.fg }}
            >
              {badge.label}
            </span>
          )}

          {/* top-left marker — priority: soon › finished › premium hint */}
          {!ready ? (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-display font-extrabold text-inksoft shadow-sm">
              🔒 Soon
            </span>
          ) : finished ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-display font-extrabold text-white shadow-sm">
              ✓ Finished
            </span>
          ) : hasPremium ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-display font-extrabold text-sunny shadow-sm">
              👑 Premium
            </span>
          ) : null}
        </div>

        {/* body */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
              style={{ background: `${card.accent}1f`, color: card.accent }}
            >
              {card.tag}
            </span>
            <span className="text-[11px] font-bold text-inksoft">Ages {card.ageRange}</span>
          </div>

          <h3 className="mt-2 font-display font-extrabold text-ink text-[17px] leading-snug">
            {card.title}
          </h3>

          {card.peculiarity && (
            <p className="mt-0.5 text-[12px] font-semibold text-inksoft/90">✨ {card.peculiarity}</p>
          )}

          {/* progress bar for stories the reader has started */}
          {inProgress && (
            <div className="mt-2.5" aria-label={`${done} of ${total} chapters read`}>
              <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: card.accent }} />
              </div>
              <p className="mt-1 text-[11px] font-bold text-inksoft">
                {done}/{total} chapters
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-inksoft">
              📖 {card.chapters} {card.chapters === 1 ? 'chapter' : 'chapters'}
            </span>
            <span
              className="font-display font-extrabold text-[13px] transition-transform group-hover:translate-x-0.5"
              style={{ color: card.accent }}
            >
              {cta}
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}

export default function Stories() {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('All')

  // Unique tags, in first-seen order.
  const tags = useMemo(() => {
    const seen = []
    for (const c of STORIES_GRID) if (c.tag && !seen.includes(c.tag)) seen.push(c.tag)
    return ['All', ...seen]
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return STORIES_GRID.filter((c) => {
      if (tag !== 'All' && c.tag !== tag) return false
      if (!needle) return true
      return (
        c.title.toLowerCase().includes(needle) ||
        (c.tag || '').toLowerCase().includes(needle) ||
        (c.peculiarity || '').toLowerCase().includes(needle)
      )
    })
  }, [q, tag])

  return (
    <div className="space-y-6">
      {/* header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight">
              Magic Stories 📚
            </h1>
            <p className="mt-1 text-inksoft font-semibold text-lg">
              {STORIES_GRID.length} read-along adventures — tap one to start.
            </p>
          </div>
        </div>
      </Reveal>

      {/* search + tag filters */}
      <Reveal delay={60}>
        <div className="space-y-3">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search stories…"
              aria-label="Search stories"
              className="w-full rounded-2xl bg-white ring-1 ring-black/5 shadow-sm pl-11 pr-4 py-3 font-semibold text-ink placeholder:text-inksoft/60 focus:outline-none focus:ring-4 focus:ring-grape/25"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const active = t === tag
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={
                    'rounded-full px-3.5 py-1.5 text-[13px] font-display font-extrabold transition-colors ' +
                    (active
                      ? 'bg-grape text-white shadow-[0_4px_0_0_#5435C4]'
                      : 'bg-white text-inksoft ring-1 ring-black/5 hover:text-grape hover:bg-lilac/40')
                  }
                  aria-pressed={active}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      {/* grid */}
      {filtered.length > 0 ? (
        <Stagger
          key={tag + q}
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          stagger={0.05}
          amount={0.05}
        >
          {filtered.map((card) => (
            <RevealItem key={card.id} variants={fadeUp}>
              <StoryCard card={card} />
            </RevealItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="text-center py-16">
          <div className="text-5xl mb-3">🫧</div>
          <p className="font-display font-extrabold text-xl text-ink">No stories match that.</p>
          <p className="mt-1 text-inksoft font-semibold">Try another word or tag.</p>
        </Reveal>
      )}
    </div>
  )
}

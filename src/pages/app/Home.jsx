import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../auth/AuthContext.jsx'
import { levelById } from '../../data.app.js'
import { Reveal, Stagger, RevealItem } from '../../components/ui.jsx'
import { SectionHead, StatTile, WeekBars, PathTile } from '../../components/app/widgets.jsx'
import { fadeUp, spring } from '../../motion.js'
import { COURSE_BY_ID } from '../../data.path.js'
import { TILE_TO_COURSE } from '../../access.js'
import { readerMetrics, courseProgress, pickResume } from '../../progress.js'

const QUICK = [
  { to: '/app/stories', emoji: '📖', label: 'Read a story', bg: '#DFF6E8' },
  { to: '/app/path', emoji: '🧭', label: 'Learning path', bg: '#E7E0FF' },
  { to: '/app/games', emoji: '🎮', label: 'Play a game', bg: '#FFE3EC' },
]

// Resolve a tile name → a valid /app/path/:courseId target (or null).
function coursePathFor(name) {
  const id = TILE_TO_COURSE[name]
  return id && COURSE_BY_ID[id] ? `/app/path/${id}` : null
}

export default function Home() {
  const { activeReader } = useAuth()

  // No reader yet → gentle empty state nudging profile creation.
  if (!activeReader) {
    return (
      <Reveal className="mt-10 text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🦉</div>
        <h1 className="font-display font-extrabold text-3xl text-ink">Let's add a reader</h1>
        <p className="mt-2 text-inksoft font-semibold">
          Create a profile for your child to start their reading adventure.
        </p>
        <Link to="/app/profile" state={{ add: true }} className="btn3d b-pink px-6 py-3.5 mt-6 inline-flex">
          ＋ Add a reader
        </Link>
      </Reveal>
    )
  }

  const lvl = levelById(activeReader.level)
  const m = readerMetrics(activeReader) // real progress, computed live
  const resume = pickResume(activeReader)

  return (
    <div className="space-y-8">
      {/* greeting */}
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight">
              Hi, <span className="text-grape">{activeReader.name}</span> 👋
            </h1>
            <p className="mt-1 text-inksoft font-semibold text-lg">
              Let's learn something cool today ✨
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-black/5 px-4 py-2 shadow-sm">
            <span className="text-xl">{lvl.emoji}</span>
            <span className="font-display font-extrabold text-ink text-sm">{lvl.label}</span>
          </div>
        </div>
      </Reveal>

      {/* jump back in — only when there's something in progress */}
      {resume && (
        <Reveal>
          <Link to={resume.to} className="block rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30">
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              transition={spring.press}
              className="flex items-center gap-4 rounded-3xl bg-white p-4 sm:p-5 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)]"
            >
              <span
                className="grid place-items-center w-14 h-14 rounded-2xl text-3xl shrink-0"
                style={{ background: `${resume.accent}1f` }}
              >
                {resume.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: resume.accent }}>
                  Jump back in
                </div>
                <div className="font-display font-extrabold text-ink text-lg leading-tight truncate">
                  {resume.title}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-cream overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round((resume.done / resume.total) * 100)}%`, background: resume.accent }}
                  />
                </div>
              </div>
              <span className="font-display font-extrabold text-sm shrink-0" style={{ color: resume.accent }}>
                Continue →
              </span>
            </motion.div>
          </Link>
        </Reveal>
      )}

      {/* hero banner */}
      <Reveal>
        <motion.div
          whileHover={{ y: -3 }}
          transition={spring.press}
          className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-white"
          style={{ background: 'linear-gradient(140deg,#6D4BE0,#5435C4)' }}
        >
          <div className="relative z-10 max-w-md">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              Magic World of Stories
            </h2>
            <p className="mt-2 text-white/85 font-semibold">
              50+ read-along adventures, from rocket rides to magic forests.
            </p>
            <Link to="/app/stories" className="btn3d b-sun px-5 py-3 mt-4 inline-flex">
              🔍 Explore now
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-4 -bottom-6 text-[8rem] opacity-90 select-none">🪐</div>
          <div className="pointer-events-none absolute right-24 top-6 text-3xl opacity-80 select-none">⭐</div>
        </motion.div>
      </Reveal>

      {/* quick actions */}
      <Stagger className="grid grid-cols-3 gap-3" stagger={0.08}>
        {QUICK.map((q) => (
          <RevealItem key={q.to} variants={fadeUp}>
            <Link to={q.to}>
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={spring.press}
                className="rounded-3xl bg-white p-4 ring-1 ring-black/5 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)] text-center"
              >
                <span className="grid place-items-center w-12 h-12 mx-auto rounded-2xl text-2xl" style={{ background: q.bg }}>
                  {q.emoji}
                </span>
                <div className="mt-2 font-display font-extrabold text-ink text-[13px] sm:text-[15px] leading-tight">
                  {q.label}
                </div>
              </motion.div>
            </Link>
          </RevealItem>
        ))}
      </Stagger>

      {/* stats — all derived from real activity */}
      <section>
        <SectionHead title="Your progress" emoji="🌟" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile emoji="🔥" value={m.streak} label="Day streak" color="tangerine" delay={0} />
          <StatTile emoji="📖" value={m.storiesRead} label="Stories read" color="grape" delay={60} />
          <StatTile emoji="⏱️" value={m.minutesThisWeek} label="Minutes this week" color="mint" delay={120} />
          <StatTile emoji="🔤" value={m.lettersLearned} label="Letters learned" color="sunny" delay={180} />
        </div>
      </section>

      {/* week chart + path */}
      <section className="grid lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <Reveal>
          <WeekBars week={m.week} color={activeReader.color} />
        </Reveal>
        <div>
          <SectionHead
            title="Continue your path"
            emoji="🧭"
            action={
              <Link to="/app/path" className="font-display font-extrabold text-grape text-sm hover:underline">
                View all
              </Link>
            }
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {(activeReader.stats?.path || []).map((p, i) => {
              const to = coursePathFor(p.name)
              const courseId = TILE_TO_COURSE[p.name]
              // Real per-course completion (done + total) for the active reader.
              const { done, total } = courseId
                ? courseProgress(activeReader, courseId)
                : { done: 0, total: p.total }
              const tile = <PathTile name={p.name} emoji={p.emoji} color={p.color} done={done} total={total || p.total} delay={i * 60} />
              return to ? (
                <Link
                  key={p.name}
                  to={to}
                  aria-label={`Open ${p.name} course`}
                  className="block rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30"
                >
                  {tile}
                </Link>
              ) : (
                <div key={p.name}>{tile}</div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

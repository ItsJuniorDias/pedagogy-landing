import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../ui.jsx'
import { spring } from '../../motion.js'

// -----------------------------------------------------------------------------
// Reader — shared reading surface for BOTH story chapters and learning-path
// lessons. They share the same item shape ({ title, subtitle, emoji, locked,
// pages[], + ONE peculiarity }), so one component serves both. The route
// wrappers (StoryReader / LessonReader) resolve the data and pass it in.
//
// Peculiarity keys vary per item and field names drift between siblings
// (rune vs runeSymbol, verse vs poem, name vs title), so every renderer reads
// defensively with `a || b`.
// -----------------------------------------------------------------------------

const LABELS = {
  chapter: {
    backTo: '/app/stories',
    backLabel: 'All stories',
    cta: '← Back to stories',
    list: 'Chapters',
    item: 'Chapter',
    short: 'ch',
    notFoundTitle: 'Story not found',
    notFoundBlurb: "We couldn't find that one. Let's head back to the library.",
    soonBlurb: "We're still writing this adventure. Check back soon — it'll be worth the wait! ✨",
  },
  lesson: {
    backTo: '/app/path',
    backLabel: 'Learning path',
    cta: '← Back to path',
    list: 'Lessons',
    item: 'Lesson',
    short: 'lesson',
    notFoundTitle: 'Course not found',
    notFoundBlurb: "We couldn't find that one. Let's head back to the path.",
    soonBlurb: "We're still preparing this lesson. Check back soon — it'll be worth the wait! ✨",
  },
}

function detectPeculiarity(ch) {
  if (!ch) return null
  const pairs = [
    ['letterFriend', 'letterFriend'],
    ['riddle', 'riddle'],
    ['mission', 'mission'],
    ['missionBrief', 'missionBrief'],
    ['feelingCard', 'feelingCard'],
    ['diary', 'diary'],
    ['diaryDate', 'diaryDate'],
    ['rune', 'rune'],
    ['runeSymbol', 'rune'],
    ['wordEntry', 'wordEntry'],
    ['dictionaryEntry', 'wordEntry'],
    ['verse', 'verse'],
    ['poem', 'verse'],
    ['recipe', 'recipe'],
    ['creatureCard', 'creatureCard'],
    ['scienceFact', 'scienceFact'],
    ['weatherReport', 'weatherReport'],
    // learning-path peculiarities
    ['factFile', 'factFile'],
    ['activityCard', 'activityCard'],
    ['deepDiveCard', 'deepDiveCard'],
    ['artistEyeCard', 'artistEyeCard'],
    ['labNotebook', 'labNotebook'],
  ]
  for (const [field, type] of pairs) {
    if (ch[field] != null) return { type, data: ch[field] }
  }
  return null
}

// A small reusable "feature card" shell, tinted with the accent colour.
function Feature({ accent, label, emoji, children }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 ring-1"
      style={{ background: `${accent}12`, borderColor: `${accent}26` }}
    >
      {label && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-display font-extrabold mb-3"
          style={{ background: `${accent}1f`, color: accent }}
        >
          {emoji} {label}
        </div>
      )}
      {children}
    </div>
  )
}

// A numbered list row used by fact-file / lab steps.
function NumberRow({ n, accent, children }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-0.5 grid place-items-center w-5 h-5 rounded-md text-[11px] font-extrabold shrink-0"
        style={{ background: `${accent}26`, color: accent }}
      >
        {n}
      </span>
      <span className="text-[14px] font-semibold text-ink leading-relaxed">{children}</span>
    </li>
  )
}

function PeculiarityBlock({ pec, accent }) {
  if (!pec) return null
  const { type, data: d } = pec

  switch (type) {
    case 'letterFriend':
      return (
        <Feature accent={accent} label="Letter Friend" emoji="🔤">
          <div className="flex items-center gap-4">
            <span
              className="grid place-items-center w-16 h-16 rounded-2xl font-display font-extrabold text-4xl text-white shrink-0"
              style={{ background: accent }}
            >
              {d.letter}
            </span>
            <div className="min-w-0">
              <div className="font-display font-extrabold text-ink text-lg">
                {d.character || d.name}
              </div>
              {(d.word || d.sound) && (
                <p className="text-inksoft font-semibold text-[14px] mt-0.5">
                  {d.word && <span className="text-ink">“{d.word}”</span>}
                  {d.word && d.sound ? ' — ' : ''}
                  {d.sound}
                </p>
              )}
            </div>
          </div>
        </Feature>
      )

    case 'riddle':
      return (
        <Feature accent={accent} label="Riddle" emoji="🧩">
          <p className="font-semibold text-ink text-[15px] leading-relaxed">{d.question}</p>
          {d.hint && <p className="mt-2 text-[13px] font-semibold text-inksoft">💡 Hint: {d.hint}</p>}
          {d.answer && (
            <details className="mt-3 group">
              <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 font-display font-extrabold text-[13px]" style={{ color: accent }}>
                <span className="transition-transform group-open:rotate-90">▶</span> Reveal answer
              </summary>
              <p className="mt-2 font-display font-extrabold text-ink">{d.answer}</p>
            </details>
          )}
        </Feature>
      )

    case 'mission':
      return (
        <Feature accent={accent} label={d.code ? `Mission ${d.code}` : 'Mission'} emoji="🎯">
          <div className="font-display font-extrabold text-ink text-lg">{d.title || d.objective}</div>
          {Array.isArray(d.objectives) && (
            <ul className="mt-3 space-y-2">
              {d.objectives.map((o, i) => {
                const label = typeof o === 'string' ? o : o.label || o.objective
                const done = typeof o === 'object' && o.done
                return (
                  <li key={(o && o.id) || i} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 grid place-items-center w-5 h-5 rounded-md text-[12px] font-extrabold shrink-0"
                      style={{ background: done ? accent : `${accent}26`, color: done ? '#fff' : accent }}
                    >
                      {done ? '✓' : ''}
                    </span>
                    <span className={'text-[14px] font-semibold ' + (done ? 'text-inksoft line-through' : 'text-ink')}>
                      {label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Feature>
      )

    case 'missionBrief':
      return (
        <Feature accent={accent} label="Mission Brief" emoji="🎯">
          <div className="font-display font-extrabold text-ink text-lg">{d.missionTitle || d.title}</div>
          {(d.objective || d.objectives) && (
            <p className="mt-1 text-[14px] font-semibold text-ink">{d.objective}</p>
          )}
          {Array.isArray(d.tools) && d.tools.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-display font-extrabold uppercase tracking-wide text-inksoft mb-1.5">Tools</div>
              <div className="flex flex-wrap gap-1.5">
                {d.tools.map((t, i) => (
                  <span key={i} className="rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-bold text-ink ring-1 ring-black/5">{t}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold text-inksoft">
            {d.difficulty && <span>⚡ {d.difficulty}</span>}
            {d.timeLimit && <span>⏳ {d.timeLimit}</span>}
          </div>
        </Feature>
      )

    case 'feelingCard':
      return (
        <Feature accent={accent} label="Feelings Card" emoji="💗">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{d.emoji}</span>
            <div className="font-display font-extrabold text-ink text-xl">{d.emotion}</div>
          </div>
          {d.prompt && <p className="mt-3 text-[14px] font-semibold text-ink leading-relaxed">{d.prompt}</p>}
          {d.affirmation && (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2.5 text-[14px] font-semibold italic text-ink ring-1 ring-black/5">
              “{d.affirmation}”
            </p>
          )}
        </Feature>
      )

    case 'diary':
      return (
        <Feature accent={accent} label="Diary Entry" emoji="📔">
          {d.date && <div className="font-display font-extrabold text-ink">{d.date}</div>}
          {d.entry && <p className="mt-1.5 text-[14px] font-semibold text-ink leading-relaxed">{d.entry}</p>}
        </Feature>
      )

    case 'diaryDate':
      return (
        <Feature accent={accent} label="Log" emoji="📔">
          <div className="font-display font-extrabold text-ink text-lg">{String(d)}</div>
        </Feature>
      )

    case 'rune':
      return (
        <Feature accent={accent} label="Ancient Rune" emoji="🪶">
          <div className="flex items-start gap-4">
            <span
              className="grid place-items-center w-16 h-16 rounded-2xl text-4xl shrink-0 text-white"
              style={{ background: accent }}
            >
              {d.symbol}
            </span>
            <div className="min-w-0">
              {d.name && <div className="font-display font-extrabold text-ink text-lg">{d.name}</div>}
              {d.meaning && <p className="text-[14px] font-semibold text-ink leading-relaxed mt-0.5">{d.meaning}</p>}
              {d.instruction && <p className="mt-2 text-[13px] font-semibold text-inksoft">🧭 {d.instruction}</p>}
            </div>
          </div>
        </Feature>
      )

    case 'wordEntry':
      return (
        <Feature accent={accent} label="Word Entry" emoji="📖">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-extrabold text-ink text-xl">{d.word}</span>
            {(d.phonetic || d.pronunciation) && (
              <span className="text-inksoft font-semibold text-[14px]">{d.phonetic || d.pronunciation}</span>
            )}
            {d.partOfSpeech && (
              <span className="italic text-inksoft text-[13px]">{d.partOfSpeech}</span>
            )}
          </div>
          {d.definition && <p className="mt-2 text-[14px] font-semibold text-ink leading-relaxed">{d.definition}</p>}
          {d.example && <p className="mt-2 text-[13px] font-semibold italic text-inksoft">“{d.example}”</p>}
        </Feature>
      )

    case 'verse':
      return (
        <Feature accent={accent} label={d.title ? d.title : 'Verse'} emoji="🎵">
          {Array.isArray(d.lines) && (
            <div className="space-y-0.5">
              {d.lines.map((ln, i) =>
                ln === '' ? (
                  <div key={i} className="h-2" />
                ) : (
                  <p key={i} className="font-semibold text-ink text-[15px] leading-relaxed italic">{ln}</p>
                )
              )}
            </div>
          )}
          {d.author && <p className="mt-2 text-[12px] font-semibold text-inksoft">— {d.author}</p>}
        </Feature>
      )

    case 'recipe':
      return (
        <Feature accent={accent} label="Recipe" emoji="🍲">
          <div className="font-display font-extrabold text-ink text-lg">{d.name || d.title}</div>
          {Array.isArray(d.ingredients) && d.ingredients.length > 0 && (
            <ul className="mt-3 space-y-1">
              {d.ingredients.map((it, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] font-semibold text-ink">
                  <span style={{ color: accent }}>•</span> {it}
                </li>
              ))}
            </ul>
          )}
          {(d.instructions || d.method) && (
            <p className="mt-3 text-[14px] font-semibold text-ink leading-relaxed">{d.instructions || d.method}</p>
          )}
          {d.note && <p className="mt-2 text-[13px] font-semibold italic text-inksoft">📝 {d.note}</p>}
        </Feature>
      )

    case 'creatureCard':
      return (
        <Feature accent={accent} label="Field Guide" emoji="🔬">
          <div className="font-display font-extrabold text-ink text-lg">{d.name}</div>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            {(d.classification || d.species) && (
              <div><dt className="font-extrabold text-inksoft">Type</dt><dd className="font-semibold text-ink">{d.classification || d.species}</dd></div>
            )}
            {d.size && (
              <div><dt className="font-extrabold text-inksoft">Size</dt><dd className="font-semibold text-ink">{d.size}</dd></div>
            )}
            {d.habitat && (
              <div className="sm:col-span-2"><dt className="font-extrabold text-inksoft">Habitat</dt><dd className="font-semibold text-ink">{d.habitat}</dd></div>
            )}
            {(d.diet || Array.isArray(d.abilities)) && (
              <div className="sm:col-span-2">
                <dt className="font-extrabold text-inksoft">{d.diet ? 'Diet' : 'Abilities'}</dt>
                <dd className="font-semibold text-ink">{d.diet || (d.abilities || []).join(', ')}</dd>
              </div>
            )}
          </dl>
          {(d.notes || d.rarity) && (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[13px] font-semibold text-ink ring-1 ring-black/5">
              {d.notes || `Rarity: ${d.rarity}`}
            </p>
          )}
        </Feature>
      )

    case 'scienceFact':
      return (
        <Feature accent={accent} label="Small Wonder" emoji="🔬">
          {d.title && <div className="font-display font-extrabold text-ink text-lg">{d.title}</div>}
          {d.fact && <p className="mt-1.5 text-[14px] font-semibold text-ink leading-relaxed">{d.fact}</p>}
          {(d.wonderScore || d.category) && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-display font-extrabold" style={{ background: `${accent}1f`, color: accent }}>
              {d.wonderScore ? `✨ Wonder ${d.wonderScore}` : d.category}
            </div>
          )}
        </Feature>
      )

    case 'weatherReport':
      return (
        <Feature accent={accent} label="Weather Report" emoji="☁️">
          {d.date && <div className="font-display font-extrabold text-ink">{d.date}</div>}
          {d.conditions && <p className="mt-1 text-[14px] font-semibold text-ink">{d.conditions}</p>}
          {d.cloudType && <p className="mt-2 text-[13px] font-semibold text-inksoft">☁️ {d.cloudType}</p>}
          {d.outlook && <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-[13px] font-semibold italic text-ink ring-1 ring-black/5">{d.outlook}</p>}
        </Feature>
      )

    // ---- learning-path peculiarities ----------------------------------------
    case 'factFile':
      return (
        <Feature accent={accent} label="Fact File" emoji="🛰️">
          {d.topic && <div className="font-display font-extrabold text-ink text-lg">{d.topic}</div>}
          {Array.isArray(d.facts) && (
            <ol className="mt-3 space-y-2">
              {d.facts.map((f, i) => (
                <NumberRow key={i} n={i + 1} accent={accent}>{f}</NumberRow>
              ))}
            </ol>
          )}
        </Feature>
      )

    case 'activityCard':
      return (
        <Feature accent={accent} label="Activity" emoji="🧪">
          {d.title && <div className="font-display font-extrabold text-ink text-lg">{d.title}</div>}
          {d.instructions && (
            <p className="mt-2 text-[14px] font-semibold text-ink leading-relaxed">{d.instructions}</p>
          )}
        </Feature>
      )

    case 'deepDiveCard':
      return (
        <Feature accent={accent} label="Deep Dive" emoji="🤿">
          {d.creature && <div className="font-display font-extrabold text-ink text-lg">{d.creature}</div>}
          {Array.isArray(d.facts) && (
            <ul className="mt-3 space-y-2">
              {d.facts.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] font-semibold text-ink leading-relaxed">
                  <span style={{ color: accent }}>•</span> {f}
                </li>
              ))}
            </ul>
          )}
        </Feature>
      )

    case 'artistEyeCard':
      return (
        <Feature accent={accent} label="Artist's Eye" emoji="🖼️">
          {d.artwork && <div className="font-display font-extrabold text-ink text-lg">{d.artwork}</div>}
          {d.childDescription && (
            <p className="mt-2 text-[14px] font-semibold text-ink leading-relaxed">{d.childDescription}</p>
          )}
          {d.prompt && (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-black/5">
              🎨 Make it yours: {d.prompt}
            </p>
          )}
        </Feature>
      )

    case 'labNotebook':
      return (
        <Feature accent={accent} label="Lab Notebook" emoji="🔬">
          {d.experiment && <div className="font-display font-extrabold text-ink text-lg">{d.experiment}</div>}
          {d.hypothesis && (
            <p className="mt-2 text-[14px] font-semibold text-ink leading-relaxed">
              <span className="font-extrabold">Hypothesis: </span>
              {d.hypothesis}
            </p>
          )}
          {Array.isArray(d.materials) && d.materials.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-display font-extrabold uppercase tracking-wide text-inksoft mb-1.5">Materials</div>
              <div className="flex flex-wrap gap-1.5">
                {d.materials.map((m, i) => (
                  <span key={i} className="rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-bold text-ink ring-1 ring-black/5">{m}</span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(d.steps) && d.steps.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {d.steps.map((s, i) => (
                <NumberRow key={i} n={i + 1} accent={accent}>{s}</NumberRow>
              ))}
            </ol>
          )}
          {d.observe && (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-black/5">
              🔎 What happens: {d.observe}
            </p>
          )}
        </Feature>
      )

    default:
      return null
  }
}

// Page body: split real \n\n into paragraphs; keep single \n as <br/> (line art).
function PageText({ text }) {
  const paras = useMemo(() => String(text ?? '').split(/\n\n+/), [text])
  return (
    <div className="space-y-4">
      {paras.map((para, i) => {
        const lines = para.split('\n')
        return (
          <p key={i} className="font-body text-ink/90 text-[17px] sm:text-[18px] leading-relaxed">
            {lines.map((ln, j) => (
              <Fragment key={j}>
                {ln}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function ReaderShell({ children }) {
  return <div className="space-y-6 max-w-3xl mx-auto">{children}</div>
}

export default function Reader({
  card,
  chapters = [],
  status = 'playable',
  kind = 'chapter',
  initialChapterIndex = null,
}) {
  const L = LABELS[kind] || LABELS.chapter

  // Open directly to a specific item only if it exists and isn't locked.
  const validInitial =
    initialChapterIndex != null &&
    initialChapterIndex >= 0 &&
    initialChapterIndex < chapters.length &&
    !chapters[initialChapterIndex]?.locked
      ? initialChapterIndex
      : null

  const [chapterIdx, setChapterIdx] = useState(validInitial) // null = list view
  const [pageIdx, setPageIdx] = useState(0)
  const [dir, setDir] = useState(1)

  const chapter = chapterIdx != null ? chapters[chapterIdx] : null
  const pages = chapter?.pages || []
  const pec = useMemo(() => detectPeculiarity(chapter), [chapter])

  const openChapter = useCallback((i) => {
    setChapterIdx(i)
    setPageIdx(0)
    setDir(1)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const closeChapter = useCallback(() => {
    setChapterIdx(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const go = useCallback(
    (delta) => {
      setPageIdx((p) => {
        const next = p + delta
        if (next < 0 || next >= pages.length) return p
        setDir(delta)
        return next
      })
    },
    [pages.length]
  )

  // Keyboard navigation while reading.
  useEffect(() => {
    if (chapterIdx == null) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') closeChapter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chapterIdx, go, closeChapter])

  // --- guards ---------------------------------------------------------------
  if (!card) {
    return (
      <ReaderShell>
        <Reveal className="text-center mt-10">
          <div className="text-7xl mb-4">🧭</div>
          <h1 className="font-display font-extrabold text-3xl text-ink">{L.notFoundTitle}</h1>
          <p className="mt-3 text-inksoft font-semibold text-lg">{L.notFoundBlurb}</p>
          <Link to={L.backTo} className="btn3d b-pink px-6 py-3.5 mt-7 inline-flex">
            {L.cta}
          </Link>
        </Reveal>
      </ReaderShell>
    )
  }

  if (status !== 'playable' || chapters.length === 0) {
    return (
      <ReaderShell>
        <Reveal className="text-center mt-8">
          <div className="text-7xl mb-4">{card.emoji || '📖'}</div>
          <h1 className="font-display font-extrabold text-3xl text-ink">{card.title || L.notFoundTitle}</h1>
          <p className="mt-3 text-inksoft font-semibold text-lg">{L.soonBlurb}</p>
          <Link to={L.backTo} className="btn3d b-pink px-6 py-3.5 mt-7 inline-flex">
            {L.cta}
          </Link>
        </Reveal>
      </ReaderShell>
    )
  }

  // --- list view ------------------------------------------------------------
  if (chapterIdx == null) {
    return (
      <ReaderShell>
        <Reveal>
          <Link to={L.backTo} className="inline-flex items-center gap-1.5 font-display font-extrabold text-inksoft hover:text-grape text-sm">
            ← {L.backLabel}
          </Link>
        </Reveal>

        <Reveal delay={40}>
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-7"
            style={{ background: `linear-gradient(150deg, ${card.bg}, ${card.bg}bb)` }}
          >
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-20 h-20 rounded-3xl bg-white/70 text-5xl shadow-sm shrink-0">
                {card.emoji}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full px-2.5 py-0.5 text-[12px] font-extrabold" style={{ background: card.accent, color: '#fff' }}>
                    {card.tag}
                  </span>
                  <span className="text-[12px] font-bold text-ink/70">Ages {card.ageRange}</span>
                </div>
                <h1 className="mt-1.5 font-display font-extrabold text-2xl sm:text-3xl text-ink leading-tight">
                  {card.title}
                </h1>
                {card.peculiarity && (
                  <p className="text-[13px] font-semibold text-ink/70 mt-0.5">✨ Features: {card.peculiarity}</p>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <div>
          <h2 className="font-display font-extrabold text-xl text-ink mb-3">{L.list}</h2>
          <div className="space-y-2.5">
            {chapters.map((ch, i) => {
              const locked = !!ch.locked
              const inner = (
                <div className="flex items-center gap-3.5">
                  <span
                    className="grid place-items-center w-11 h-11 rounded-2xl text-xl shrink-0"
                    style={{ background: locked ? '#EEE9F2' : `${card.accent}1f` }}
                  >
                    {locked ? '🔒' : ch.emoji || '📖'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: locked ? '#9A93A6' : card.accent }}>
                      {ch.title || `${L.item} ${i + 1}`}
                    </div>
                    <div className={'font-display font-extrabold leading-tight truncate ' + (locked ? 'text-inksoft/60' : 'text-ink')}>
                      {ch.subtitle || ch.title || `${L.item} ${i + 1}`}
                    </div>
                  </div>
                  {!locked && (
                    <span className="font-display font-extrabold text-sm" style={{ color: card.accent }}>
                      Read →
                    </span>
                  )}
                </div>
              )

              if (locked) {
                return (
                  <div
                    key={ch.id || i}
                    className="rounded-2xl bg-white/60 p-3.5 ring-1 ring-black/5 opacity-70 cursor-not-allowed"
                    aria-disabled="true"
                    title="Locked — keep going to unlock"
                  >
                    {inner}
                  </div>
                )
              }
              return (
                <motion.button
                  key={ch.id || i}
                  type="button"
                  onClick={() => openChapter(i)}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring.press}
                  className="w-full text-left rounded-2xl bg-white p-3.5 ring-1 ring-black/5 shadow-[0_10px_28px_-24px_rgba(58,49,66,.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30"
                >
                  {inner}
                </motion.button>
              )
            })}
          </div>
        </div>
      </ReaderShell>
    )
  }

  // --- reading view ---------------------------------------------------------
  const atStart = pageIdx === 0
  const atEnd = pageIdx === pages.length - 1

  return (
    <ReaderShell>
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={closeChapter}
          className="inline-flex items-center gap-1.5 font-display font-extrabold text-inksoft hover:text-grape text-sm"
        >
          ← {L.list}
        </button>
        <div className="text-[13px] font-bold text-inksoft">
          {chapter.title || `${L.item} ${chapterIdx + 1}`} · {chapterIdx + 1}/{chapters.length}
        </div>
      </div>

      {/* heading */}
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-12 h-12 rounded-2xl text-2xl shrink-0" style={{ background: `${card.accent}1f` }}>
          {chapter.emoji || card.emoji}
        </span>
        <h1 className="font-display font-extrabold text-2xl text-ink leading-tight">
          {chapter.subtitle || chapter.title}
        </h1>
      </div>

      {/* signature peculiarity block (pinned for the chapter/lesson) */}
      {pec && <PeculiarityBlock pec={pec} accent={card.accent} />}

      {/* page text */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-black/5 shadow-[0_14px_34px_-30px_rgba(58,49,66,.6)] min-h-[200px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pageIdx}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <PageText text={pages[pageIdx]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={atStart}
          className={'btn3d b-white px-5 py-3 ' + (atStart ? 'opacity-40 pointer-events-none' : '')}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {/* page dots */}
        <div className="flex items-center gap-1.5" aria-label={`Page ${pageIdx + 1} of ${pages.length}`}>
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDir(i >= pageIdx ? 1 : -1)
                setPageIdx(i)
              }}
              className="rounded-full transition-all"
              style={{
                width: i === pageIdx ? 22 : 8,
                height: 8,
                background: i === pageIdx ? card.accent : `${card.accent}3a`,
              }}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === pageIdx ? 'true' : undefined}
            />
          ))}
        </div>

        {atEnd ? (
          chapterIdx < chapters.length - 1 && !chapters[chapterIdx + 1]?.locked ? (
            <button
              type="button"
              onClick={() => openChapter(chapterIdx + 1)}
              className="btn3d b-grape px-5 py-3"
              aria-label={`Next ${L.item.toLowerCase()}`}
            >
              Next {L.short} →
            </button>
          ) : (
            <button
              type="button"
              onClick={closeChapter}
              className="btn3d b-sun px-5 py-3"
              aria-label="Finish"
            >
              Done 🎉
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => go(1)}
            className="btn3d b-grape px-5 py-3"
            aria-label="Next page"
          >
            Next →
          </button>
        )}
      </div>
    </ReaderShell>
  )
}

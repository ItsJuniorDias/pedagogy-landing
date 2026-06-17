import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../../components/ui.jsx'
import { spring } from '../../motion.js'
import { PATH_COURSES, resolveCourse } from '../../data.path.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import {
  isChapterAccessible,
  isChapterComplete,
  isPremiumPlan,
  completedCount,
  accessibleCount,
  hasLockedChapters,
  lockedCount,
  getProgress,
} from '../../access.js'

// A single lesson "node" on the unit trail.
//   premium (locked) lesson on Free → tap routes to the paywall
//   complete / accessible           → links into the reader
function LessonNode({ courseId, accent, lesson, index, accessible, complete, onPremium }) {
  const premiumRow = !accessible

  const node = (
    <span
      className="relative z-10 grid place-items-center w-12 h-12 rounded-full shrink-0 text-2xl"
      style={
        complete
          ? { background: '#DFF6E8', boxShadow: '0 0 0 3px #16BFA6' }
          : premiumRow
          ? { background: '#FBEFD2', boxShadow: '0 0 0 3px #E9B400' }
          : { background: '#fff', boxShadow: `0 0 0 3px ${accent}, 0 8px 18px -10px ${accent}aa` }
      }
    >
      {complete ? '✅' : premiumRow ? '👑' : lesson.emoji || '📖'}
    </span>
  )

  const body = (
    <div className="min-w-0 flex-1">
      <div
        className="text-[12px] font-extrabold uppercase tracking-wide"
        style={{ color: premiumRow ? '#B07A12' : accent }}
      >
        {lesson.title || `Lesson ${index + 1}`}
        {complete && <span className="ml-2 text-mintd">· Done</span>}
        {premiumRow && <span className="ml-2 text-sunnyd">· Premium</span>}
      </div>
      <div
        className={'font-display font-extrabold leading-tight ' + (premiumRow ? 'text-inksoft/70' : 'text-ink')}
      >
        {lesson.subtitle || lesson.title || `Lesson ${index + 1}`}
      </div>
    </div>
  )

  if (premiumRow) {
    return (
      <motion.button
        type="button"
        onClick={onPremium}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.985 }}
        transition={spring.press}
        className="w-full text-left relative flex items-center gap-4 rounded-2xl bg-butter/70 px-3 py-2.5 ring-1 ring-sunnyd/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30"
      >
        {node}
        {body}
        <span className="font-display font-extrabold text-sm shrink-0" style={{ color: '#B07A12' }}>
          Unlock →
        </span>
      </motion.button>
    )
  }

  return (
    <Link
      to={`/app/path/${courseId}/${lesson.id}`}
      className="block rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-grape/30"
    >
      <motion.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.985 }}
        transition={spring.press}
        className="relative flex items-center gap-4 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-black/5 shadow-[0_10px_28px_-24px_rgba(58,49,66,.6)]"
      >
        {node}
        {body}
        <span className="font-display font-extrabold text-sm shrink-0" style={{ color: accent }}>
          {complete ? 'Re-read →' : 'Start →'}
        </span>
      </motion.div>
    </Link>
  )
}

// One course = one "unit": a tinted header followed by its lessons as a
// vertical trail (a spine connects the nodes).
function CourseUnit({ course }) {
  const navigate = useNavigate()
  const { user, activeReader } = useAuth()
  const plan = user?.plan
  const { lessons } = resolveCourse(course.id)

  const prog = getProgress(activeReader, 'lesson', course.id)
  const done = completedCount(lessons, prog)
  const unlocked = accessibleCount(lessons, plan)
  const premiumCount = lockedCount(lessons)
  const hasPremium = hasLockedChapters(lessons) && !isPremiumPlan(plan)

  const openPaywall = () =>
    navigate('/app/paywall', {
      state: { kind: 'course', title: course.title, emoji: course.emoji, from: `/app/path/${course.id}` },
    })

  return (
    <Reveal className="space-y-3">
      {/* unit header */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 sm:p-6 ring-1 ring-black/5"
        style={{ background: `linear-gradient(150deg, ${course.bg}, ${course.bg}cc)` }}
      >
        <div className="flex items-center gap-4">
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-white/70 text-4xl shadow-sm shrink-0">
            {course.emoji}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-full px-2.5 py-0.5 text-[12px] font-extrabold"
                style={{ background: course.accent, color: '#fff' }}
              >
                {course.tag}
              </span>
              <span className="text-[12px] font-bold text-ink/70">Ages {course.ageRange}</span>
              {hasPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-0.5 text-[12px] font-extrabold text-sunny">
                  👑 Premium
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display font-extrabold text-xl sm:text-2xl text-ink leading-tight">
              {course.title}
            </h2>
            <p className="text-[13px] font-semibold text-ink/70 truncate">{course.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-ink/70">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: `${course.accent}1f`, color: course.accent }}
          >
            ✨ {course.peculiarity}
          </span>
          <span aria-hidden>·</span>
          <span>
            {done} of {lessons.length} done
          </span>
          {hasPremium && (
            <>
              <span aria-hidden>·</span>
              <button type="button" onClick={openPaywall} className="font-extrabold text-grape hover:underline">
                👑 Unlock {premiumCount} premium
              </button>
            </>
          )}
        </div>
      </div>

      {/* lesson trail */}
      {lessons.length > 0 && (
        <div className="relative pl-1">
          <div
            aria-hidden
            className="absolute top-6 bottom-6 w-[2px] rounded-full"
            style={{ left: 28, background: `${course.accent}33` }}
          />
          <div className="space-y-3">
            {lessons.map((lesson, i) => (
              <LessonNode
                key={lesson.id || i}
                courseId={course.id}
                accent={course.accent}
                lesson={lesson}
                index={i}
                accessible={isChapterAccessible(lesson, plan)}
                complete={isChapterComplete(prog, lesson, i)}
                onPremium={openPaywall}
              />
            ))}
          </div>
        </div>
      )}
    </Reveal>
  )
}

export default function Path() {
  const totalLessons = PATH_COURSES.reduce((n, c) => n + (c.chapters || 0), 0)

  return (
    <div className="space-y-8">
      <Reveal>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
          Learning Path <span className="align-middle">🧭</span>
        </h1>
        <p className="mt-1.5 text-inksoft font-semibold">
          {PATH_COURSES.length} guided courses · {totalLessons} lessons to explore. Read the free
          lessons and unlock the rest with Premium.
        </p>
      </Reveal>

      <div className="space-y-10">
        {PATH_COURSES.map((course) => (
          <CourseUnit key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}

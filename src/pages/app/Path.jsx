import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../../components/ui.jsx'
import { spring } from '../../motion.js'
import { PATH_COURSES, resolveCourse } from '../../data.path.js'

// A single lesson "node" on the unit trail. Unlocked → links into the reader;
// locked → dimmed and non-interactive.
function LessonNode({ courseId, accent, lesson, index }) {
  const locked = !!lesson.locked

  const node = (
    <span
      className="relative z-10 grid place-items-center w-12 h-12 rounded-full shrink-0 text-2xl"
      style={
        locked
          ? { background: '#EEE9F2', color: '#9A93A6' }
          : {
              background: '#fff',
              boxShadow: `0 0 0 3px ${accent}, 0 8px 18px -10px ${accent}aa`,
            }
      }
    >
      {locked ? '🔒' : lesson.emoji || '📖'}
    </span>
  )

  const body = (
    <div className="min-w-0 flex-1">
      <div
        className="text-[12px] font-extrabold uppercase tracking-wide"
        style={{ color: locked ? '#9A93A6' : accent }}
      >
        {lesson.title || `Lesson ${index + 1}`}
      </div>
      <div
        className={
          'font-display font-extrabold leading-tight ' +
          (locked ? 'text-inksoft/60' : 'text-ink')
        }
      >
        {lesson.subtitle || lesson.title || `Lesson ${index + 1}`}
      </div>
    </div>
  )

  if (locked) {
    return (
      <div
        className="relative flex items-center gap-4 rounded-2xl bg-white/55 px-3 py-2.5 ring-1 ring-black/5 opacity-70 cursor-not-allowed"
        aria-disabled="true"
        title="Locked — keep going to unlock"
      >
        {node}
        {body}
      </div>
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
          Start →
        </span>
      </motion.div>
    </Link>
  )
}

// One course = one "unit": a tinted header followed by its lessons as a
// vertical trail (a spine connects the nodes).
function CourseUnit({ course }) {
  const { lessons } = resolveCourse(course.id)
  const unlocked = lessons.filter((l) => !l.locked).length

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
          <span>{unlocked} of {lessons.length} unlocked</span>
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
          {PATH_COURSES.length} guided courses · {totalLessons} lessons to explore. Follow the
          trail and unlock each step as you go.
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

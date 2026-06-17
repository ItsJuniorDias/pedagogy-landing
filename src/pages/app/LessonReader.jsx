import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Reader from '../../components/app/Reader.jsx'
import { resolveCourse } from '../../data.path.js'

// Thin route wrapper for the Learning Path:
//   /app/path/:courseId            → open the lesson list
//   /app/path/:courseId/:lessonId  → open straight to that lesson (if unlocked)
// The `key` (courseId + lessonId) remounts the reader on navigation so state
// resets cleanly when jumping between lessons.
export default function LessonReader() {
  const { courseId, lessonId } = useParams()
  const data = useMemo(() => resolveCourse(courseId), [courseId])

  const initialIndex = useMemo(() => {
    if (lessonId == null) return null
    const i = data.lessons.findIndex((l) => String(l.id) === String(lessonId))
    return i >= 0 ? i : null
  }, [data, lessonId])

  return (
    <Reader
      key={`${courseId}:${lessonId || ''}`}
      card={data.course}
      chapters={data.lessons}
      status={data.status}
      kind="lesson"
      initialChapterIndex={initialIndex}
    />
  )
}

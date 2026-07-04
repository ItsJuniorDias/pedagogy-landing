import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Reader from '../../components/app/Reader.jsx'
import { resolveCourse } from '../../data.path.js'
import { trackViewLesson } from '../../lib/pixel.js'

// Thin route wrapper for the Learning Path:
//   /app/path/:courseId            → open the lesson list
//   /app/path/:courseId/:lessonId  → open straight to that lesson (if free)
// Premium (locked) lessons route to the paywall from inside the reader.
export default function LessonReader() {
  const { courseId, lessonId } = useParams()
  const data = useMemo(() => resolveCourse(courseId), [courseId])

  const initialIndex = useMemo(() => {
    if (lessonId == null) return null
    const i = data.lessons.findIndex((l) => String(l.id) === String(lessonId))
    return i >= 0 ? i : null
  }, [data, lessonId])

  // ViewContent when a course/lesson is opened.
  useEffect(() => {
    trackViewLesson({ id: courseId, title: data?.course?.title })
  }, [courseId, data])

  return (
    <Reader
      key={`${courseId}:${lessonId || ''}`}
      contentId={courseId}
      card={data.course}
      chapters={data.lessons}
      status={data.status}
      kind="lesson"
      initialChapterIndex={initialIndex}
    />
  )
}

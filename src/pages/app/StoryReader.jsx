import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Reader from '../../components/app/Reader.jsx'
import { resolveStory } from '../../stories.index.js'
import { trackViewStory } from '../../lib/pixel.js'

// Thin route wrapper: resolve the story for :storyId and hand it to the shared
// <Reader>. The story always opens — free chapters are readable and premium
// (locked) chapters route to the paywall from inside the reader. The `key`
// forces a fresh reader (state reset) when the route param changes.
export default function StoryReader() {
  const { storyId } = useParams()
  const data = useMemo(() => resolveStory(storyId), [storyId])

  // ViewContent when a story is opened (audience + engagement signal).
  useEffect(() => {
    trackViewStory({ id: storyId, title: data?.card?.title })
  }, [storyId, data])

  return (
    <Reader
      key={storyId}
      contentId={storyId}
      card={data.card}
      chapters={data.chapters}
      status={data.status}
      kind="chapter"
    />
  )
}

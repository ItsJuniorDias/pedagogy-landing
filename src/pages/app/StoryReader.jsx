import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Reader from '../../components/app/Reader.jsx'
import { resolveStory } from '../../stories.index.js'

// Thin route wrapper: resolve the story for :storyId and hand it to the shared
// <Reader>. The `key` forces a fresh reader (state reset) when the route param
// changes, so navigating story → story starts clean.
export default function StoryReader() {
  const { storyId } = useParams()
  const data = useMemo(() => resolveStory(storyId), [storyId])
  return (
    <Reader
      key={storyId}
      card={data.card}
      chapters={data.chapters}
      status={data.status}
      kind="chapter"
    />
  )
}

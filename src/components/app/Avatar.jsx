import { resolveColor } from '../../data.app.js'

/**
 * Avatar — an emoji on a soft tile with an optional colored ring.
 * Mirrors the friendly profile avatars in the app mockups.
 *
 * size: pixel diameter. ring: show the colored outline. selected: thicker ring.
 */
export default function Avatar({
  emoji = '🐻',
  color = 'grape',
  size = 48,
  ring = true,
  selected = false,
  className = '',
  style = {},
}) {
  const c = resolveColor(color)
  return (
    <span
      className={'inline-grid place-items-center rounded-full shrink-0 ' + className}
      style={{
        width: size,
        height: size,
        background: c.bg,
        boxShadow: ring
          ? `0 0 0 ${selected ? 4 : 3}px ${c.ring}, 0 6px 14px -8px rgba(58,49,66,.4)`
          : '0 6px 14px -8px rgba(58,49,66,.4)',
        ...style,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{emoji}</span>
    </span>
  )
}

import { Reveal } from '../../components/ui.jsx'
import NeonPong from '../../components/app/NeonPong.jsx'

export default function Games() {
  return (
    <div className="space-y-6">
      <Reveal>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
          Games <span className="align-middle">🎮</span>
        </h1>
        <p className="mt-1.5 text-inksoft font-semibold">
          Practice-as-play. First up: <span className="text-grape font-extrabold">Neon Pong</span> — beat the CPU. Drag to
          move your paddle, and swipe sideways to curve the ball.
        </p>
      </Reveal>

      <Reveal delay={60}>
        {/* The game owns a dark, neon look — frame it in a rounded card and give
            it a fixed height (NeonPong fills its parent). */}
        <div
          className="rounded-[28px] overflow-hidden ring-1 ring-black/5 shadow-[0_18px_44px_-28px_rgba(58,49,66,.7)]"
          style={{ height: 'min(78vh, 680px)' }}
        >
          <NeonPong />
        </div>
      </Reveal>
    </div>
  )
}

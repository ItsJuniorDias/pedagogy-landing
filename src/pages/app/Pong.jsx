import { Link } from 'react-router-dom'
import { Reveal } from '../../components/ui.jsx'
import NeonPong from '../../components/app/NeonPong.jsx'

export default function Pong() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              Neon Pong <span className="align-middle">🏓</span>
            </h1>
            <p className="mt-1 text-inksoft font-semibold text-sm">
              Beat the CPU. Drag to move your paddle, swipe sideways to curve the ball.
            </p>
          </div>
          <Link to="/app/games" className="btn3d b-white px-4 py-2.5 text-sm shrink-0">
            ← Games
          </Link>
        </div>
      </Reveal>

      <Reveal delay={60}>
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

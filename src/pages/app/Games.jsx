import { Reveal } from '../../components/ui.jsx'
import PongGame from '../../components/app/PongGame.jsx'

export default function Games() {
  return (
    <div className="space-y-6">
      <Reveal>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
          Games <span className="align-middle">🎮</span>
        </h1>
        <p className="mt-1.5 text-inksoft font-semibold">
          Practice-as-play. First up: a 3D ping pong match — beat the CPU or challenge a friend.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <PongGame />
      </Reveal>
    </div>
  )
}

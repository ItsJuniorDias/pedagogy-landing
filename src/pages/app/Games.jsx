import { Link } from 'react-router-dom'
import { Reveal } from '../../components/ui.jsx'

const GAMES = [
  {
    to: '/app/games/farm',
    emoji: '🌾',
    title: 'Happy Farm',
    blurb: 'A cozy 3D farm. Till, plant, water and harvest 15 crops, level up, and unlock a doghouse, barn & beehive.',
    tag: 'New · 3D',
    grad: 'from-mint to-mintd',
    shadow: '#0E9B86',
  },
  {
    to: '/app/games/pong',
    emoji: '🏓',
    title: 'Neon Pong',
    blurb: 'Fast reflex practice — beat the CPU. Drag your paddle and curve the ball with a sideways swipe.',
    tag: 'Arcade',
    grad: 'from-grape to-graped',
    shadow: '#5435C4',
  },
]

export default function Games() {
  return (
    <div className="space-y-6">
      <Reveal>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
          Games <span className="align-middle">🎮</span>
        </h1>
        <p className="mt-1.5 text-inksoft font-semibold">
          Practice-as-play. Pick a game to jump in — progress is saved as you go.
        </p>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-4">
        {GAMES.map((g, i) => (
          <Reveal key={g.to} delay={i * 70}>
            <Link
              to={g.to}
              className={`group block rounded-[26px] p-6 text-white bg-gradient-to-br ${g.grad} transition-transform hover:-translate-y-0.5`}
              style={{ boxShadow: `0 10px 0 0 ${g.shadow}` }}
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl drop-shadow-sm">{g.emoji}</span>
                <span className="text-[11px] font-display font-extrabold bg-white/20 rounded-full px-2.5 py-1">
                  {g.tag}
                </span>
              </div>
              <h2 className="mt-4 font-display font-extrabold text-2xl leading-tight">{g.title}</h2>
              <p className="mt-1.5 text-white/90 font-semibold text-sm">{g.blurb}</p>
              <span className="inline-flex items-center gap-1 mt-4 font-display font-extrabold">
                Play
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

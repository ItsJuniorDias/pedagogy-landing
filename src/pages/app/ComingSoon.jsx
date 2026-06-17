import { Link } from 'react-router-dom'
import { Reveal } from '../../components/ui.jsx'
import { Bubble } from '../../components/ui.jsx'

/**
 * ComingSoon — friendly placeholder for in-app sections that aren't built yet.
 * Swap these routes for the real screens once the mocks land.
 */
export default function ComingSoon({ emoji = '🚧', title = 'Coming soon', blurb }) {
  return (
    <div className="relative">
      <Bubble emoji="⭐" bg="#FFF3D6" className="w-11 h-11 left-[6%] top-[14%] hidden sm:flex" rotate={-10} anim="float" delay={200} />
      <Bubble emoji="🪐" bg="#DDEFFF" className="w-11 h-11 right-[8%] top-[8%]" anim="float2" delay={320} />

      <Reveal className="mt-12 sm:mt-20 text-center max-w-md mx-auto">
        <div className="text-7xl mb-5">{emoji}</div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">{title}</h1>
        <p className="mt-3 text-inksoft font-semibold text-lg">
          {blurb || "We're putting the finishing touches on this. Check back soon!"}
        </p>
        <Link to="/app" className="btn3d b-pink px-6 py-3.5 mt-7 inline-flex">
          ← Back to home
        </Link>
      </Reveal>
    </div>
  )
}

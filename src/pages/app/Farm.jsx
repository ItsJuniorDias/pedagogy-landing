import { Link } from 'react-router-dom'
import FarmGameScreen from '../../games/farm-game/index.ts'

// Happy Farm — the React-Native/Expo 3D game ported to the web (react-native-web
// + plain three.js). It owns its own HUD and fills a fixed-height frame.
export default function Farm() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
            Happy Farm <span className="align-middle">🌾</span>
          </h1>
          <p className="mt-1 text-inksoft font-semibold text-sm">
            Tap tiles to till, plant, water &amp; harvest. Drag the field to find the
            house, barn &amp; beehive. Progress saves automatically.
          </p>
        </div>
        <Link to="/app/games" className="btn3d b-white px-4 py-2.5 text-sm shrink-0">
          ← Games
        </Link>
      </div>

      {/* The game uses flex:1 internally, so the frame must be a flex column
          with an explicit height. */}
      <div
        className="rounded-[28px] overflow-hidden ring-1 ring-black/5 shadow-[0_18px_44px_-28px_rgba(58,49,66,.7)] flex flex-col"
        style={{ height: 'min(82vh, 760px)' }}
      >
        <FarmGameScreen />
      </div>
    </div>
  )
}

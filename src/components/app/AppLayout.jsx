import { NavLink, Link, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IMG } from '../../assets.js'
import ReaderSwitcher from './ReaderSwitcher.jsx'
import { spring } from '../../motion.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { isPremiumPlan } from '../../access.js'

// --- inline icons -----------------------------------------------------------
const Icon = ({ d, fill }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)
const HomeIcon = () => <Icon d={['M3 11.5 12 4l9 7.5', 'M5 10v10h14V10']} />
const BookIcon = () => <Icon d={['M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z', 'M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z']} />
const PathIcon = () => <Icon d={['M6 4v8a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4', 'M6 4 4 6m2-2 2 2']} />
const GameIcon = () => <Icon d={['M7 12h4m-2-2v4', 'M3 9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z', 'M16 11h.01M18 14h.01']} />
const UserIcon = () => <Icon d={['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M5 20a7 7 0 0 1 14 0']} />

const NAV = [
  { to: '/app', label: 'Home', Icon: HomeIcon, end: true, mobile: true },
  { to: '/app/stories', label: 'Stories', Icon: BookIcon, mobile: true },
  { to: '/app/path', label: 'Path', Icon: PathIcon, mobile: true },
  { to: '/app/games', label: 'Games', Icon: GameIcon, mobile: false },
  { to: '/app/profile', label: 'Profile', Icon: UserIcon, mobile: true },
]

function SideLink({ to, label, Icon, end }) {
  return (
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: isActive ? 0 : 3 }}
          whileTap={{ scale: 0.98 }}
          transition={spring.press}
          className={
            'flex items-center gap-3 rounded-2xl px-3.5 py-3 font-display font-extrabold transition-colors ' +
            (isActive
              ? 'bg-grape text-white shadow-[0_8px_0_0_#5435C4]'
              : 'text-inksoft hover:bg-lilac/50 hover:text-grape')
          }
        >
          <Icon />
          <span>{label}</span>
        </motion.div>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user } = useAuth()
  const premium = isPremiumPlan(user?.plan)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4E8] via-[#FFF6F0] to-[#FBEFF6] text-ink">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 p-5 bg-cream/70 backdrop-blur-sm border-r border-black/5">
        <Link to="/app" className="flex items-center gap-2.5 px-2 py-2 mb-4">
          <img src={IMG.logo} alt="" className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-black/5" />
          <span className="font-display font-extrabold text-xl text-ink tracking-tight">Pedagogy</span>
        </Link>

        <nav className="space-y-1.5">
          {NAV.map((n) => (
            <SideLink key={n.to} {...n} />
          ))}
        </nav>

        {premium ? (
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-mint to-mintd p-4 text-white">
            <p className="font-display font-extrabold text-lg leading-tight">Premium ✨</p>
            <p className="text-white/85 text-sm font-semibold mt-1">
              Every story and the full path are unlocked. Happy reading!
            </p>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-grape to-graped p-4 text-white">
            <p className="font-display font-extrabold text-lg leading-tight">Unlock every story ✨</p>
            <p className="text-white/85 text-sm font-semibold mt-1">Go Premium for the full path & offline reading.</p>
            <Link to="/app/paywall" className="btn3d b-sun w-full mt-3 px-4 py-2.5 text-sm">
              See plans
            </Link>
          </div>
        )}
      </aside>

      {/* ---------- top bar ---------- */}
      <header className="lg:pl-64 sticky top-0 z-30">
        <div className="bg-cream/80 backdrop-blur-md border-b border-black/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link to="/app" className="flex items-center gap-2 lg:hidden">
              <img src={IMG.logo} alt="" className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-black/5" />
              <span className="font-display font-extrabold text-lg text-ink">Pedagogy</span>
            </Link>
            <div className="hidden lg:block text-inksoft font-bold text-sm">
              {/* breathing room — page titles live in the content */}
            </div>
            <ReaderSwitcher />
          </div>
        </div>
      </header>

      {/* ---------- page content ---------- */}
      <main className="lg:pl-64 pb-28 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <Outlet />
        </div>
      </main>

      {/* ---------- mobile bottom tab bar ---------- */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40">
        <div className="mx-3 mb-3 rounded-[24px] bg-white shadow-[0_-6px_30px_-12px_rgba(58,49,66,.45)] ring-1 ring-black/5 px-2 py-2 flex items-center justify-around">
          {NAV.filter((n) => n.mobile).map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex-1">
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5 py-1.5">
                  <span
                    className={
                      'grid place-items-center w-12 h-9 rounded-full transition-colors ' +
                      (isActive ? 'bg-lilac text-grape' : 'text-inksoft')
                    }
                  >
                    <Icon />
                  </span>
                  <span
                    className={
                      'text-[11px] font-display font-extrabold transition-colors ' +
                      (isActive ? 'text-grape' : 'text-inksoft')
                    }
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

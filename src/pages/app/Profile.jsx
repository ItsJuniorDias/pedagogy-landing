import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../auth/AuthContext.jsx'
import { levelById } from '../../data.app.js'
import Avatar from '../../components/app/Avatar.jsx'
import AvatarPicker from '../../components/app/AvatarPicker.jsx'
import { Field } from '../../components/app/Field.jsx'
import Modal from '../../components/app/Modal.jsx'
import ReaderForm from '../../components/app/ReaderForm.jsx'
import { Reveal, Stagger, RevealItem } from '../../components/ui.jsx'
import { SectionHead } from '../../components/app/widgets.jsx'
import { fadeUp, spring } from '../../motion.js'

// --- account edit form (name / email / avatar) ------------------------------
function AccountForm({ user, onSave, onCancel }) {
  const [draft, setDraft] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar || '🦉',
    color: user.color || 'grape',
  })
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-cream/60 p-4 ring-1 ring-black/5">
        <Avatar emoji={draft.avatar} color={draft.color} size={64} />
        <div className="min-w-0">
          <p className="font-display font-extrabold text-lg text-ink truncate">{draft.name || 'You'}</p>
          <p className="text-sm font-bold text-inksoft truncate">{draft.email}</p>
        </div>
      </div>

      <Field
        label="Your name"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <Field
        label="Email"
        type="email"
        value={draft.email}
        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
      />

      <AvatarPicker
        emoji={draft.avatar}
        color={draft.color}
        onEmoji={(avatar) => setDraft({ ...draft, avatar })}
        onColor={(color) => setDraft({ ...draft, color })}
      />

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <button onClick={onCancel} className="btn3d b-white ring-1 ring-black/5 px-5 py-3 flex-1">
          Cancel
        </button>
        <motion.button
          onClick={() => onSave(draft)}
          whileTap={{ scale: 0.98 }}
          transition={spring.press}
          className="btn3d b-grape px-5 py-3 flex-1"
        >
          Save changes
        </motion.button>
      </div>
    </div>
  )
}

// --- a single reader card ---------------------------------------------------
function ReaderCard({ reader, active, onSelect, onEdit }) {
  const lvl = levelById(reader.level)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={spring.press}
      className={
        'relative rounded-3xl bg-white p-5 ring-1 shadow-[0_14px_34px_-26px_rgba(58,49,66,.6)] ' +
        (active ? 'ring-2 ring-grape' : 'ring-black/5')
      }
    >
      {active && (
        <span className="absolute top-4 right-4 rounded-full bg-grape text-white text-[11px] font-extrabold px-2.5 py-1">
          Active
        </span>
      )}

      <button onClick={onSelect} className="flex items-center gap-4 text-left w-full">
        <Avatar emoji={reader.emoji} color={reader.color} size={64} selected={active} />
        <div className="min-w-0">
          <div className="font-display font-extrabold text-lg text-ink truncate">{reader.name}</div>
          <div className="text-[13px] font-bold text-inksoft">
            {reader.age} yrs · {lvl.label}
          </div>
        </div>
      </button>

      <div className="mt-4 flex items-center gap-2 text-[13px] font-bold text-inksoft">
        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1">
          🔥 {reader.stats.streak}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1">
          📖 {reader.stats.storiesRead}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1">
          🔤 {reader.stats.lettersLearned}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {!active && (
          <button onClick={onSelect} className="btn3d b-white ring-1 ring-black/5 px-4 py-2.5 text-sm flex-1">
            Set active
          </button>
        )}
        <button onClick={onEdit} className={'btn3d b-white ring-1 ring-black/5 px-4 py-2.5 text-sm ' + (active ? 'flex-1' : '')}>
          ✏️ Edit
        </button>
      </div>
    </motion.div>
  )
}

export default function Profile() {
  const {
    user,
    readers,
    activeReader,
    setActiveReader,
    updateAccount,
    addReader,
    updateReader,
    removeReader,
    logout,
  } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [accountOpen, setAccountOpen] = useState(false)
  const [editing, setEditing] = useState(null) // reader being edited
  const [adding, setAdding] = useState(false)

  // Open the add-reader modal when arriving from the "Add a reader" shortcut.
  useEffect(() => {
    if (location.state?.add) {
      setAdding(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  return (
    <div className="space-y-9">
      {/* ---------- account header ---------- */}
      <Reveal>
        <div className="rounded-[28px] bg-white p-6 sm:p-7 ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)]">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar emoji={user.avatar || '🦉'} color={user.color || 'grape'} size={84} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">{user.name}</h1>
                <span className="rounded-full bg-sage text-mintd text-[12px] font-extrabold px-2.5 py-1">
                  {user.plan} plan
                </span>
              </div>
              <p className="text-inksoft font-semibold">{user.email}</p>
              <p className="text-sm font-bold text-inksoft mt-1">
                Managing {readers.length} reader{readers.length === 1 ? '' : 's'}
              </p>
            </div>
            <button onClick={() => setAccountOpen(true)} className="btn3d b-white ring-1 ring-black/5 px-5 py-3">
              Edit account
            </button>
          </div>
        </div>
      </Reveal>

      {/* ---------- reader profiles ---------- */}
      <section>
        <SectionHead title="Reader profiles" emoji="👧" />
        <Stagger className="grid sm:grid-cols-2 gap-4" stagger={0.08}>
          {readers.map((r) => (
            <RevealItem key={r.id} variants={fadeUp}>
              <ReaderCard
                reader={r}
                active={activeReader?.id === r.id}
                onSelect={() => setActiveReader(r.id)}
                onEdit={() => setEditing(r)}
              />
            </RevealItem>
          ))}

          {/* add card */}
          <RevealItem variants={fadeUp}>
            <button
              onClick={() => setAdding(true)}
              className="group w-full h-full min-h-[164px] rounded-3xl border-2 border-dashed border-grape/30 bg-lilac/20 hover:bg-lilac/40 transition grid place-items-center p-5"
            >
              <span className="text-center">
                <span className="grid place-items-center w-14 h-14 mx-auto rounded-full bg-white text-grape text-2xl font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                  ＋
                </span>
                <span className="mt-3 block font-display font-extrabold text-grape">Add a reader</span>
              </span>
            </button>
          </RevealItem>
        </Stagger>
      </section>

      {/* ---------- subscription ---------- */}
      <section>
        <SectionHead title="Subscription" emoji="✨" />
        <Reveal>
          <div className="rounded-[28px] overflow-hidden ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)]">
            <div className="bg-gradient-to-br from-grape to-graped p-6 sm:p-7 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-white/80 font-bold text-sm uppercase tracking-wide">Current plan</p>
                  <p className="font-display font-extrabold text-3xl mt-0.5">{user.plan}</p>
                  <p className="text-white/85 font-semibold mt-1">
                    {user.plan === 'Free'
                      ? 'A taste of the magic. Upgrade for the whole world of stories.'
                      : 'Thanks for supporting your reader. Everything is unlocked.'}
                  </p>
                </div>
                {user.plan === 'Free' && (
                  <Link to="/#pricing" className="btn3d b-sun px-6 py-3.5 text-lg">
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
            <div className="bg-white p-6 sm:p-7">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['📚', '50+ interactive stories'],
                  ['🧭', 'Full phonics learning path'],
                  ['🎮', 'Mini-games & rewards'],
                  ['📥', 'Offline reading anywhere'],
                ].map(([e, t]) => (
                  <div key={t} className="flex items-center gap-3 font-bold text-ink">
                    <span className="text-xl">{e}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- sign out ---------- */}
      <section>
        <Reveal>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="btn3d b-white ring-1 ring-black/5 px-6 py-3.5 text-bubbled"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Log out
          </button>
        </Reveal>
      </section>

      {/* ---------- modals ---------- */}
      <Modal open={accountOpen} onClose={() => setAccountOpen(false)} title="Edit account">
        <AccountForm
          user={user}
          onSave={(patch) => {
            updateAccount(patch)
            setAccountOpen(false)
          }}
          onCancel={() => setAccountOpen(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit reader">
        {editing && (
          <ReaderForm
            reader={editing}
            onSave={(patch) => {
              updateReader(editing.id, patch)
              setEditing(null)
            }}
            onDelete={() => {
              removeReader(editing.id)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a reader">
        <ReaderForm
          onSave={(reader) => {
            const id = addReader(reader)
            if (id) setActiveReader(id)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      </Modal>
    </div>
  )
}

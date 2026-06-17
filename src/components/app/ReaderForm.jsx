import { useState } from 'react'
import { motion } from 'framer-motion'
import { Field } from './Field.jsx'
import AvatarPicker from './AvatarPicker.jsx'
import Avatar from './Avatar.jsx'
import { LEVELS } from '../../data.app.js'
import { spring } from '../../motion.js'

/**
 * ReaderForm — create or edit a reader profile.
 * `reader` undefined → create mode. Provided → edit mode (shows Delete).
 */
export default function ReaderForm({ reader, onSave, onDelete, onCancel }) {
  const editing = !!reader
  const [draft, setDraft] = useState(
    reader || { name: '', age: 5, emoji: '🐻', color: 'grape', level: 'explorer' }
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState('')

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const save = () => {
    if (!draft.name.trim()) {
      setErr("Please add the reader's name.")
      return
    }
    onSave({ ...draft, name: draft.name.trim() })
  }

  return (
    <div className="space-y-5">
      {/* live preview */}
      <div className="flex items-center gap-4 rounded-2xl bg-cream/60 p-4 ring-1 ring-black/5">
        <Avatar emoji={draft.emoji} color={draft.color} size={64} selected />
        <div className="min-w-0">
          <p className="font-display font-extrabold text-lg text-ink truncate">
            {draft.name.trim() || 'New reader'}
          </p>
          <p className="text-sm font-bold text-inksoft">{draft.age} years old</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Name"
          placeholder="Mia"
          value={draft.name}
          onChange={(e) => {
            set({ name: e.target.value })
            setErr('')
          }}
        />
        <Field label="Age">
          <select
            className="w-full rounded-2xl border-2 border-black/5 bg-cream/40 px-4 py-3 font-bold text-ink focus:outline-none focus:border-grape focus:bg-white"
            value={draft.age}
            onChange={(e) => set({ age: Number(e.target.value) })}
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map((a) => (
              <option key={a} value={a}>
                {a} years
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Reading level">
        <select
          className="w-full rounded-2xl border-2 border-black/5 bg-cream/40 px-4 py-3 font-bold text-ink focus:outline-none focus:border-grape focus:bg-white"
          value={draft.level}
          onChange={(e) => set({ level: e.target.value })}
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.emoji} {l.label} — {l.sub}
            </option>
          ))}
        </select>
      </Field>

      <AvatarPicker
        emoji={draft.emoji}
        color={draft.color}
        onEmoji={(emoji) => set({ emoji })}
        onColor={(color) => set({ color })}
      />

      {err && <p className="text-sm font-bold text-bubbled">{err}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <button onClick={onCancel} className="btn3d b-white ring-1 ring-black/5 px-5 py-3 flex-1">
          Cancel
        </button>
        <motion.button
          onClick={save}
          whileTap={{ scale: 0.98 }}
          transition={spring.press}
          className="btn3d b-grape px-5 py-3 flex-1"
        >
          {editing ? 'Save changes' : 'Add reader'}
        </motion.button>
      </div>

      {editing && onDelete && (
        <div className="pt-4 mt-1 border-t border-black/5">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-extrabold text-bubbled hover:underline"
            >
              Delete this profile
            </button>
          ) : (
            <div className="rounded-2xl bg-blush/60 p-4">
              <p className="font-bold text-ink text-sm">
                Delete <span className="font-extrabold">{draft.name}</span>'s profile? Their progress
                will be lost.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn3d b-white ring-1 ring-black/5 px-4 py-2.5 text-sm flex-1"
                >
                  Keep
                </button>
                <button
                  onClick={onDelete}
                  className="btn3d b-pink px-4 py-2.5 text-sm flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

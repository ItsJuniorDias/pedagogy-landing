// -----------------------------------------------------------------------------
// access.js — content gating + progress math (pure helpers, no React).
//
//   PREMIUM gate (per chapter/lesson)
//     Each chapter/lesson carries a `locked` flag in the mocks. A locked item
//     is PREMIUM: it opens only for a paid plan. Free (unlocked) items are a
//     preview anyone can read. Tapping a locked item on the Free plan sends the
//     user to /app/paywall; subscribing unlocks every locked item.
//
//   PROGRESS (per reader, persisted by AuthContext)
//     reader.progress tracks completed chapters/lessons, the resume position,
//     and an activity log (minutes + active days) used to compute the dashboard
//     for real instead of seeded mock numbers.
// -----------------------------------------------------------------------------

// --- premium plan ------------------------------------------------------------
export const isPremiumPlan = (plan) => !!plan && plan !== 'Free'

// --- per-chapter access ------------------------------------------------------
/** A locked chapter/lesson is premium; everything else is a free preview. */
export const isChapterAccessible = (ch, plan) => !ch?.locked || isPremiumPlan(plan)

/** Does this story/course contain any premium (locked) chapters? */
export const hasLockedChapters = (chapters = []) => chapters.some((c) => !!c?.locked)

/** How many chapters/lessons the given plan can actually open. */
export const accessibleCount = (chapters = [], plan) =>
  chapters.reduce((n, ch) => n + (isChapterAccessible(ch, plan) ? 1 : 0), 0)

/** How many premium (locked) chapters/lessons there are. */
export const lockedCount = (chapters = []) => chapters.reduce((n, ch) => n + (ch?.locked ? 1 : 0), 0)

// --- progress lookups --------------------------------------------------------
const emptyEntry = { completed: {}, page: {} }

/** Progress record for one story/course (safe default if missing). */
export function getProgress(reader, kind, contentId) {
  const bucket = kind === 'lesson' ? 'courses' : 'stories'
  return reader?.progress?.[bucket]?.[contentId] || emptyEntry
}

export const chapterKey = (ch, i) => String(ch?.id ?? i)

/** True if the active reader has finished this chapter/lesson. */
export function isChapterComplete(progress, ch, i) {
  return !!progress?.completed?.[chapterKey(ch, i)]
}

/** How many of these chapters/lessons the reader has completed. */
export function completedCount(chapters = [], progress) {
  return chapters.reduce((n, ch, i) => n + (isChapterComplete(progress, ch, i) ? 1 : 0), 0)
}

/** True when every chapter/lesson is complete. */
export function isAllComplete(chapters = [], progress) {
  return chapters.length > 0 && completedCount(chapters, progress) === chapters.length
}

/**
 * Index to resume at: the last opened item if it's still accessible & unfinished,
 * else the first accessible+unfinished item, else 0.
 */
export function resumeIndex(chapters = [], progress, plan) {
  const accessibleUnfinished = (ch, i) =>
    isChapterAccessible(ch, plan) && !isChapterComplete(progress, ch, i)

  const lastId = progress?.lastChapterId
  if (lastId != null) {
    const i = chapters.findIndex((ch, idx) => chapterKey(ch, idx) === String(lastId))
    if (i >= 0 && accessibleUnfinished(chapters[i], i)) return i
  }
  const first = chapters.findIndex(accessibleUnfinished)
  return first >= 0 ? first : 0
}

// --- activity / date math (drives streak, minutes, week chart) ---------------
const pad = (n) => String(n).padStart(2, '0')

/** Local YYYY-MM-DD key for a date. */
export function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayKey = () => isoDate(new Date())

/** The 7 date keys (Mon→Sun) for the week containing `ref`. */
export function weekDates(ref = new Date()) {
  const mondayOffset = (ref.getDay() + 6) % 7 // Mon = 0 … Sun = 6
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return isoDate(d)
  })
}

const minutesMap = (reader) => reader?.progress?.activity?.minutesByDate || {}
const activeDatesMap = (reader) => reader?.progress?.activity?.activeDates || {}

/** Raw (unrounded) reading minutes per day (Mon→Sun) for the current week. */
export function weekMinutesRaw(reader, ref = new Date()) {
  const m = minutesMap(reader)
  return weekDates(ref).map((k) => m[k] || 0)
}

/** Reading minutes per day (Mon→Sun) for the current week, rounded for display. */
export function weekMinutes(reader, ref = new Date()) {
  return weekMinutesRaw(reader, ref).map((v) => Math.round(v))
}

/**
 * Total reading minutes this week. Sums the RAW per-day minutes and rounds once,
 * so several short sessions (each under a minute) still add up instead of each
 * rounding down to zero.
 */
export function minutesThisWeek(reader, ref = new Date()) {
  return Math.round(weekMinutesRaw(reader, ref).reduce((a, b) => a + b, 0))
}

/**
 * Consecutive days with activity, ending today (a one-day grace lets the streak
 * survive until the user reads today: if today is blank but yesterday isn't, the
 * count starts at yesterday).
 */
export function dayStreak(reader, ref = new Date()) {
  const active = activeDatesMap(reader)
  const isActive = (d) => !!active[isoDate(d)]

  const cursor = new Date(ref)
  if (!isActive(cursor)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!isActive(cursor)) return 0
  }
  let streak = 0
  while (isActive(cursor)) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// --- dashboard tile <-> course mapping (shared by Home) ----------------------
export const TILE_TO_COURSE = {
  Letters: 'LETTERS',
  School: 'SCHOLL',
  Astronaut: 'ASTRONAUT',
  Space: 'SPACE',
  Dinos: 'DINOSAURS',
  Ocean: 'OCEAN_LIFE',
  Science: 'SCIENCE_LAB',
  Colours: 'COLORS_ART',
  Art: 'COLORS_ART',
}

// -----------------------------------------------------------------------------
// progress.js — turns a reader's persisted progress into the real dashboard
// numbers (stories read, letters learned, per-course completion, "jump back
// in"). Lives apart from access.js because it needs the story/course content to
// resolve totals and letter data.
// -----------------------------------------------------------------------------
import { resolveStory } from "./stories.index.js";
import { resolveCourse } from "./data.path.js";
import {
  completedCount,
  isChapterComplete,
  dayStreak,
  weekMinutes,
  minutesThisWeek,
} from "./access.js";

const storyEntries = (reader) =>
  Object.entries(reader?.progress?.stories || {});
const courseEntries = (reader) =>
  Object.entries(reader?.progress?.courses || {});

/** Stories where every chapter is complete. */
export function storiesReadCount(reader) {
  let n = 0;
  for (const [id, entry] of storyEntries(reader)) {
    const { chapters } = resolveStory(id);
    if (chapters.length && completedCount(chapters, entry) === chapters.length)
      n += 1;
  }
  return n;
}

/** Distinct letters from any completed item that introduces a "Letter Friend". */
export function lettersLearnedCount(reader) {
  const letters = new Set();
  const scan = (items, entry) => {
    items.forEach((it, i) => {
      const letter = it?.letterFriend?.letter;
      if (letter && isChapterComplete(entry, it, i))
        letters.add(String(letter).toUpperCase());
    });
  };
  for (const [id, entry] of storyEntries(reader))
    scan(resolveStory(id).chapters, entry);
  for (const [id, entry] of courseEntries(reader))
    scan(resolveCourse(id).lessons, entry);
  return letters.size;
}

/** Completed lessons / total lessons for one course (real progress). */
export function courseProgress(reader, courseId) {
  const { lessons } = resolveCourse(courseId);
  const entry = reader?.progress?.courses?.[courseId] || { completed: {} };
  return { done: completedCount(lessons, entry), total: lessons.length };
}

/** Everything the Home dashboard tiles need, computed from real activity. */
export function readerMetrics(reader, ref = new Date()) {
  return {
    streak: dayStreak(reader, ref),
    storiesRead: storiesReadCount(reader),
    minutesThisWeek: minutesThisWeek(reader, ref),
    lettersLearned: lettersLearnedCount(reader),
    week: weekMinutes(reader, ref),
  };
}

/** Most recently opened, unfinished story/course — powers "Jump back in". */
export function pickResume(reader) {
  const out = [];

  for (const [id, e] of storyEntries(reader)) {
    if (!e?.updatedAt) continue;
    const { card, chapters } = resolveStory(id);
    if (!card || !chapters.length) continue;
    const done = completedCount(chapters, e);
    if (done >= chapters.length) continue;
    out.push({
      title: card.title,
      emoji: card.emoji,
      accent: card.accent,
      to: `/app/stories/${id}`,
      done,
      total: chapters.length,
      ts: e.updatedAt,
    });
  }

  for (const [id, e] of courseEntries(reader)) {
    if (!e?.updatedAt) continue;
    const { course, lessons } = resolveCourse(id);
    if (!course || !lessons.length) continue;
    const done = completedCount(lessons, e);
    if (done >= lessons.length) continue;
    out.push({
      title: course.title,
      emoji: course.emoji,
      accent: course.accent,
      to: `/app/path/${id}`,
      done,
      total: lessons.length,
      ts: e.updatedAt,
    });
  }

  out.sort((a, b) => b.ts - a.ts);
  return out[0] || null;
}

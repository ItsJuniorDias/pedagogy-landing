// -----------------------------------------------------------------------------
// data.app.js — mock content for the logged-in app (readers, avatars, stats).
//
// This is placeholder data for the in-app experience (dashboard + profiles).
// Swap the seed readers / stats for real API data once the backend is wired up.
// Brand colors mirror tailwind.config.js so avatars stay on-palette.
// -----------------------------------------------------------------------------

// Friendly emoji avatars — matches the bear avatar in the app mockups.
export const AVATARS = [
  "🐻",
  "🦊",
  "🐰",
  "🦉",
  "🐯",
  "🐸",
  "🐨",
  "🦁",
  "🐼",
  "🐵",
  "🦕",
  "🐠",
  "🦄",
  "🐧",
  "🐙",
  "🐝",
];

// Avatar ring + tile colors, keyed so a reader stores just the key.
export const READER_COLORS = {
  grape: { bg: "#E7E0FF", ring: "#6D4BE0", soft: "#F1ECFF" },
  bubblegum: { bg: "#FFE3EC", ring: "#FF4D87", soft: "#FFEFF4" },
  mint: { bg: "#DFF6E8", ring: "#16BFA6", soft: "#ECFAF2" },
  tangerine: { bg: "#FFE9D6", ring: "#FF7A2F", soft: "#FFF1E6" },
  sky: { bg: "#DDEFFF", ring: "#4AA8FF", soft: "#EBF5FF" },
  sunny: { bg: "#FFF3D6", ring: "#E9B400", soft: "#FFF8E6" },
};

export const COLOR_KEYS = Object.keys(READER_COLORS);

export const resolveColor = (key) => READER_COLORS[key] || READER_COLORS.grape;

// Reading levels, written for parents of 2–10 year olds.
export const LEVELS = [
  {
    id: "sprout",
    label: "Little Sprout",
    sub: "Ages 2–3 · First sounds & songs",
    emoji: "🌱",
  },
  {
    id: "explorer",
    label: "Sound Explorer",
    sub: "Ages 4–5 · Letters & phonics",
    emoji: "🔤",
  },
  {
    id: "reader",
    label: "Early Reader",
    sub: "Ages 6–7 · First words & stories",
    emoji: "📖",
  },
  {
    id: "star",
    label: "Story Star",
    sub: "Ages 8–10 · Fluent reading",
    emoji: "⭐",
  },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[1];

// Per-reader dashboard stats. Mock numbers — replace with real progress data.
// `week` = reading minutes for the last 7 days (Mon→Sun), powers the mini chart.
// `path` = the learning-path tiles shown on the app home (mirrors the mockup).
const sampleStats = (overrides = {}) => ({
  streak: 5,
  storiesRead: 18,
  minutesThisWeek: 96,
  lettersLearned: 21,
  week: [12, 18, 9, 22, 14, 11, 10],
  path: [
    { name: "Letters", emoji: "🔤", done: 6, total: 6, color: "sunny" },
    { name: "School", emoji: "🏫", done: 6, total: 6, color: "mint" },
    { name: "Astronaut", emoji: "🧑‍🚀", done: 4, total: 6, color: "tangerine" },
    { name: "Space", emoji: "🪐", done: 2, total: 6, color: "sky" },
  ],
  ...overrides,
});

// Demo readers seeded for a fresh login so the dashboard isn't empty.
export const SEED_READERS = [];

// Default stats applied to any newly created reader.
export const freshStats = () => ({
  streak: 0,
  storiesRead: 0,
  minutesThisWeek: 0,
  lettersLearned: 0,
  week: [0, 0, 0, 0, 0, 0, 0],
  path: [
    { name: "Letters", emoji: "🔤", done: 0, total: 6, color: "sunny" },
    { name: "School", emoji: "🏫", done: 0, total: 6, color: "mint" },
    { name: "Astronaut", emoji: "🧑‍🚀", done: 0, total: 6, color: "tangerine" },
    { name: "Space", emoji: "🪐", done: 0, total: 6, color: "sky" },
  ],
});

export const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

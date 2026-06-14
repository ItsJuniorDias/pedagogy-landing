// -----------------------------------------------------------------------------
// All editable copy + content lives here so you can tweak text, prices, and
// social-proof numbers without touching the components.
// -----------------------------------------------------------------------------

// ⚠️ PLACEHOLDER SOCIAL PROOF — replace with your real numbers before launch.
export const STATS = [
  ['4.9★', 'App Store rating'],
  ['50k+', 'little readers'],
  ['50+', 'magic stories'],
  ['0', 'ads, ever'],
]

// The signature "story path" — milestones from first sound to first story.
export const STEPS = [
  {
    emoji: '🅰️',
    color: '#FF4D87',
    ring: '#FFE3EC',
    side: 'left',
    title: 'Start with sounds',
    body: 'Bite-sized phonics lessons make every letter stick. Meet Arlo the Ant and friends who turn the alphabet into a story.',
  },
  {
    emoji: '📖',
    color: '#6D4BE0',
    ring: '#E7E0FF',
    side: 'right',
    title: 'Read magic stories',
    body: '50+ interactive adventures read aloud, highlighting each word as your child follows along — from rocket rides to magic forests.',
  },
  {
    emoji: '🎮',
    color: '#16BFA6',
    ring: '#DFF6E8',
    side: 'left',
    title: 'Play to practice',
    body: 'Mini-games and rewards turn practice into play, so kids stay motivated and keep coming back for more.',
  },
  {
    emoji: '🚀',
    color: '#FF7A2F',
    ring: '#FFE9D6',
    side: 'right',
    title: 'Grow every day',
    body: 'A guided learning path adapts as they go, building real reading confidence one happy step at a time.',
  },
]

export const WORLDS = [
  { e: '🚀', n: 'Space', bg: '#E7E0FF' },
  { e: '🌳', n: 'Nature', bg: '#DFF6E8' },
  { e: '🦄', n: 'Fantasy', bg: '#FFE3EC' },
  { e: '🔬', n: 'Science', bg: '#DDEFFF' },
  { e: '🦕', n: 'Dinos', bg: '#FFE9D6' },
  { e: '🐠', n: 'Ocean', bg: '#D9F3FF' },
  { e: '🎨', n: 'Art', bg: '#FFF3D6' },
  { e: '🧸', n: 'Toys', bg: '#F1E7FF' },
]

export const LESSON_POINTS = [
  ['Read aloud, word by word', "Each word lights up as it's spoken, so kids connect sound to print."],
  ['Multi-sensory tracing', 'Drag, tap, and trace letters to build muscle memory that lasts.'],
  ['Friendly characters', 'Arlo the Ant and pals make every letter a tiny adventure to remember.'],
]

export const BENEFITS = [
  { e: '🎈', bg: '#FFE3EC', t: 'Made for ages 2–10', b: 'Content grows with your child, from first letters to confident reading.' },
  { e: '🛡️', bg: '#DFF6E8', t: 'Safe & ad-free', b: 'No ads, no pop-ups, no surprises. Just a calm place to learn and play.' },
  { e: '🎓', bg: '#E7E0FF', t: 'Designed with educators', b: 'Lessons follow how kids actually learn phonics, sight words, and fluency.' },
  { e: '⏳', bg: '#DDEFFF', t: 'Screen time that counts', b: "Short, focused sessions that build skills — time you'll feel good about." },
]

// ⚠️ PLACEHOLDER TESTIMONIAL — replace with a real review before launch.
export const TESTIMONIAL = {
  quote:
    "“My daughter asks to do her ‘owl reading’ before bed. She's learning her letters and doesn't even realize it.”",
  author: '— Maria, parent of a 4-year-old',
}

export const PRICING = {
  monthly: {
    price: '$9.99',
    note: 'Flexible — cancel anytime.',
    features: ['50+ interactive stories', 'Full phonics learning path', 'Mini-games & rewards', 'New content every month'],
  },
  annual: {
    price: '$79.99',
    subnote: 'Just $6.67/mo · Save 33%',
    features: ['Everything in Monthly', 'Save 33% vs paying monthly', 'Offline reading anywhere', 'Priority new releases'],
    promo: '🎉 20% off for the first 100 subscribers',
  },
}

export const FOOTER_COLS = [
  ['Product', ['How it works', 'Stories', 'Pricing', 'Download']],
  ['Company', ['About', 'Careers', 'Press', 'Blog']],
  ['Support', ['Help center', 'Contact', "Parents' guide", 'Status']],
  ['Legal', ['Privacy', 'Terms', 'Cookies', 'Child safety']],
]

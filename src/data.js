// -----------------------------------------------------------------------------
// All editable copy + content lives here so you can tweak text, prices, and
// social-proof numbers without touching the components.
// -----------------------------------------------------------------------------

// Preço vem de UMA fonte só (o valor do plano no MP). Ver payments/mercadopago.js.
import { MP_PLANS, formatBRL } from "./payments/mercadopago.js";

// Honest, verifiable product facts — no invented user counts or ratings.
// (A brand-new app has no real "50k users / 4.9★" to show yet; claiming them on
//  paid traffic erodes trust and risks App Store / ad-policy issues. These four
//  are all true of the product itself, so they convert without over-promising.)
export const STATS = [
  ["50+", "interactive stories"],
  ["7", "languages"],
  ["0", "ads — ever"],
  ["100%", "kid-safe"],
];

// The signature "story path" — milestones from first sound to first story.
export const STEPS = [
  {
    emoji: "🅰️",
    color: "#FF4D87",
    ring: "#FFE3EC",
    side: "left",
    title: "Start with sounds",
    body: "Bite-sized phonics lessons make every letter stick. Meet Arlo the Ant and friends who turn the alphabet into a story.",
  },
  {
    emoji: "📖",
    color: "#6D4BE0",
    ring: "#E7E0FF",
    side: "right",
    title: "Read magic stories",
    body: "50+ interactive adventures read aloud, highlighting each word as your child follows along — from rocket rides to magic forests.",
  },
  {
    emoji: "🎮",
    color: "#16BFA6",
    ring: "#DFF6E8",
    side: "left",
    title: "Play to practice",
    body: "Mini-games and rewards turn practice into play, so kids stay motivated and keep coming back for more.",
  },
  {
    emoji: "🚀",
    color: "#FF7A2F",
    ring: "#FFE9D6",
    side: "right",
    title: "Grow every day",
    body: "A guided learning path adapts as they go, building real reading confidence one happy step at a time.",
  },
];

export const WORLDS = [
  { e: "🚀", n: "Space", bg: "#E7E0FF" },
  { e: "🌳", n: "Nature", bg: "#DFF6E8" },
  { e: "🦄", n: "Fantasy", bg: "#FFE3EC" },
  { e: "🔬", n: "Science", bg: "#DDEFFF" },
  { e: "🦕", n: "Dinos", bg: "#FFE9D6" },
  { e: "🐠", n: "Ocean", bg: "#D9F3FF" },
  { e: "🎨", n: "Art", bg: "#FFF3D6" },
  { e: "🧸", n: "Toys", bg: "#F1E7FF" },
];

export const LESSON_POINTS = [
  [
    "Read aloud, word by word",
    "Each word lights up as it's spoken, so kids connect sound to print.",
  ],
  [
    "Multi-sensory tracing",
    "Drag, tap, and trace letters to build muscle memory that lasts.",
  ],
  [
    "Friendly characters",
    "Arlo the Ant and pals make every letter a tiny adventure to remember.",
  ],
];

export const BENEFITS = [
  {
    e: "🎈",
    bg: "#FFE3EC",
    t: "Made for ages 2–10",
    b: "Content grows with your child, from first letters to confident reading.",
  },
  {
    e: "🛡️",
    bg: "#DFF6E8",
    t: "Safe & ad-free",
    b: "No ads, no pop-ups, no surprises. Just a calm place to learn and play.",
  },
  {
    e: "🎓",
    bg: "#E7E0FF",
    t: "Designed with educators",
    b: "Lessons follow how kids actually learn phonics, sight words, and fluency.",
  },
  {
    e: "⏳",
    bg: "#DDEFFF",
    t: "Screen time that counts",
    b: "Short, focused sessions that build skills — time you'll feel good about.",
  },
];

// An honest founder note in place of an invented review. Alexandre ships these
// apps solo — leaning into that is both true and a genuine trust signal for
// parents wary of data-hungry "big studio" kids apps.
// ➜ Once you collect a REAL App Store review you're happy to show, you can add
//   it here as { quote, author } and render it alongside (or instead of) this.
export const FOUNDER = {
  quote:
    "Pedagogy is built by one independent developer — not a giant studio chasing ad revenue. That shapes every choice: no ads, no third-party tracking, no dark patterns. Just calm, joyful stories that quietly teach reading along the way.",
  author: "— From the developer behind Pedagogy",
};

// Objection-handling FAQ. Every answer is truthful for the current product
// (Kids Category, iOS-only for now, 7 languages, free to download + subscription).
export const FAQ = [
  [
    "Is Pedagogy safe for my child?",
    "Yes. It’s built for the App Store Kids Category: no ads, no third-party tracking, and no open web links or chat. A parental gate guards anything outside the play area, so your child can only reach the stories and lessons.",
  ],
  [
    "What ages is it for?",
    "Ages 2–10 — from first letter sounds and phonics all the way to reading full stories with confidence. The content grows with your child.",
  ],
  [
    "Is it free?",
    "The app is free to download and try. A subscription unlocks the full library of stories, the complete phonics path, and the games. You can cancel anytime.",
  ],
  [
    "Does it work offline?",
    "Yes. Downloaded stories play with no connection — perfect for car rides, flights, or anywhere Wi-Fi isn’t.",
  ],
  [
    "What languages does it support?",
    "The app and its stories read in 7 languages, so kids can learn in the language you speak at home.",
  ],
  [
    "Which devices can I use?",
    "Pedagogy is on iPhone and iPad through the App Store. There’s no Android app yet — but you can also start right now in your web browser.",
  ],
  [
    "How do I cancel?",
    "Manage or cancel anytime from your App Store subscription settings. No emails to send, no hoops to jump through.",
  ],
];

// Preços em BRL, derivados de MP_PLANS.amountBRL — o mesmo número cobrado no
// Mercado Pago e enviado ao Meta. Mude o valor UMA vez lá e tudo aqui acompanha.
const _mAmount = MP_PLANS.monthly.amountBRL;
const _aAmount = MP_PLANS.annual.amountBRL;
const _aMonthly = _aAmount / 12;
const _savingPct = Math.max(0, Math.round((1 - _aAmount / (_mAmount * 12)) * 100));
const _monthsFree = Math.round((_mAmount * 12 - _aAmount) / _mAmount);

export const PRICING = {
  monthly: {
    price: formatBRL(_mAmount),
    note: "Flexible — cancel anytime.",
    features: [
      "50+ interactive stories",
      "Full phonics learning path",
      "Mini-games & rewards",
      "New content every month",
    ],
  },
  annual: {
    price: formatBRL(_aAmount),
    subnote: `Just ${formatBRL(_aMonthly)}/mo · Save ${_savingPct}%`,
    features: [
      "Everything in Monthly",
      `Save ${_savingPct}% vs paying monthly`,
      "Offline reading anywhere",
      "Priority new releases",
    ],
    // Honest, concrete reframe of the saving (no invented "first 100" scarcity).
    promo: `💛 That’s like getting ${_monthsFree} months free vs paying monthly`,
  },
};

// [label, href] — real, working destinations only. In-page anchors scroll the
// visitor to the matching section; external ones open the store / chat. Legal
// links point to '#' until you publish real policy pages — swap those in.
export const FOOTER_COLS = [
  [
    "Product",
    [
      ["How it works", "#how"],
      ["Stories", "#stories"],
      ["Pricing", "#pricing"],
      ["FAQ", "#faq"],
    ],
  ],
  [
    "Get the app",
    [
      [
        "Download on the App Store",
        "https://apps.apple.com/us/app/pedagogy-kids-books/id6776011454",
      ],
      ["Play in your browser", "/signup"],
    ],
  ],
  [
    "Support",
    [
      ["Chat on WhatsApp", "https://wa.me/5517991115745"],
      ["Common questions", "#faq"],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy", "#"],
      ["Terms", "#"],
      ["Child safety", "#"],
    ],
  ],
];

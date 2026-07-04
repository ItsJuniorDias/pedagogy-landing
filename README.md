# Pedagogy — Landing Page

A conversion-focused landing page for **Pedagogy**, a children's story & early-reading app for ages 2–10. Built with **React + Vite + Tailwind CSS**. The goal of the page is to get parents to download the app.

## Quick start

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

Requires Node.js 18+.

## 🌾 Happy Farm (jogo integrado)

O jogo 3D **Happy Farm** (originalmente um app Expo/React Native) foi portado para
rodar dentro desta landing, sem build separado. Após `npm install && npm run dev`:

- Acesse a área do app → aba **Games** (`/app/games`)
- Escolha **Happy Farm 🌾** → abre em `/app/games/farm`
- **Neon Pong 🏓** continua disponível em `/app/games/pong`

Como o port funciona (sem alterar o site original):
- `react-native-web` resolve as primitivas RN (View, Text, Animated, etc.) via
  alias no `vite.config.js`.
- Shims locais em `src/games/_shims/` substituem os módulos Expo:
  `expo-gl` (canvas WebGL2), `expo-three` (renderer), `expo-asset`, `expo-blur`,
  fontes Fredoka e `@react-native-async-storage/async-storage` (→ `localStorage`,
  o progresso é salvo automaticamente).
- O código do jogo fica em `src/games/farm-game/` praticamente intacto; a única
  edição foi adaptar o loop de render ao redimensionamento da janela (web).
- A loja de moedas roda em modo simulado (`src/hooks/UseCoinStore.js`) — sem
  pagamentos reais — e usa o portão parental em `src/shared/ParentalGate.jsx`.

Créditos dos modelos 3D: Fox.glb — CC BY 4.0 (PixelMannen / tomkranis / Asobo
Studio / scurest); Cow "Spot" — domínio público (Keenan Crane).


## Deploying

`npm run build` outputs a static site to `dist/`. Drag that folder into Netlify, or deploy with Vercel / Cloudflare Pages / GitHub Pages — no server needed.

> If you deploy to a **sub-path** (e.g. a GitHub Pages project site at `user.github.io/repo/`), set `base: '/repo/'` in `vite.config.js`. The default `base: './'` works for root domains and most static hosts.

## Project structure

```
pedagogy-landing/
├── index.html              # HTML shell (title, meta tags, Google Fonts)
├── vite.config.js
├── tailwind.config.js      # brand colors + fonts (Baloo 2 / Nunito)
├── postcss.config.js
├── public/
│   └── favicon.jpg
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # composes all sections in order
    ├── index.css           # Tailwind directives + custom CSS (buttons, animations, phone mockups)
    ├── data.js             # ← ALL editable copy, prices, stats, links
    ├── assets.js           # image registry (import/rename in one place)
    ├── assets/             # owl, app icon, logo, 4 app screenshots
    └── components/
        ├── ui.jsx          # shared primitives: Reveal, Stars, Check, Bubble, AppleBadge, GoogleBadge
        ├── Nav.jsx
        ├── Hero.jsx
        ├── TrustStrip.jsx
        ├── StoryPath.jsx   # the signature winding "story path" with milestones
        ├── Worlds.jsx
        ├── LessonPeek.jsx
        ├── ParentsLove.jsx
        ├── Pricing.jsx
        ├── Faq.jsx          # objection-handling accordion (safety, price, devices, cancel)
        ├── FinalCTA.jsx
        ├── Footer.jsx
        ├── StickyCTA.jsx    # mobile-only sticky "get it free" bar (appears on scroll)
        └── WhatsAppButton.jsx
```

## Customizing

- **Text, prices, stats, testimonials** → edit `src/data.js`. Everything user-facing is centralized there.
- **Brand colors / fonts** → `tailwind.config.js` (`theme.extend.colors` and `fontFamily`). The fonts are loaded in `index.html`.
- **Images** → drop replacements in `src/assets/` and update the imports in `src/assets.js`. Vite hashes and optimizes them automatically.
- **Buttons / animations / phone mockups** → custom CSS lives in `src/index.css`.

## ✅ Conversion pass — what changed & what's left

This build was reworked for a **paid-traffic landing** (ads → App Store). Key
changes, all centralised in `src/data.js` unless noted:

- **Removed invented social proof.** The old "4.9★ / 50,000+ families" and the
  fictional "Maria" testimonial are gone (running ads on fake numbers erodes
  trust and risks App Store / ad-policy trouble). In their place:
  - `STATS` now show honest product facts (50+ stories · 7 languages · 0 ads · 100% kid-safe).
  - The testimonial slot is an honest **founder note** (`FOUNDER`) — a real
    differentiator vs data-hungry kids apps.
- **Fixed the phantom Google Play badge.** There's no Android app, so the badge
  (which used to dead-end at the *Apple* store) is replaced by `WebAppBadge` →
  **"Play in browser"**, which opens the web app. Honest and actually useful to
  Android/desktop visitors.
- **Added an FAQ** (`FAQ`) that answers the real objections before the ask:
  safety, ages, price, offline, languages, devices, cancellation.
- **Added a mobile sticky CTA bar** (`StickyCTA.jsx`) — the single biggest lever
  for mobile ad traffic. Slides in past the hero, one tap to the store.
- **Tighter hero**: risk-reversal line ("Free · No ads · Cancel anytime") and
  honest trust badges.
- **Honest footer links** and refreshed `index.html` meta (title, OG/Twitter).

### Still worth doing before / during the campaign

1. **A real App Store review.** Once you have one you're happy to show, add it in
   `src/data.js` as `{ quote, author }` and render it next to the founder note.
2. **A proper share image.** `og:image` currently points at the square favicon —
   a 1200×630 image makes WhatsApp/social link previews far more clickable.
3. **Real Privacy / Terms / Child-safety pages.** The footer links point at `#`
   until you publish them (App Store also expects a privacy URL).
4. **Attribution reality check (Kids Category).** The Meta Pixel fires on the
   *site* fine, but iOS install/subscribe attribution is limited for kids apps.
   Optimise the campaign on `DownloadClick` (site) and treat store conversions as
   directional. See `TRACKING.md`.

## Accessibility & polish

- Sections fade in on scroll via an `IntersectionObserver`, and all motion is disabled for users with **`prefers-reduced-motion`**.
- Buttons have visible focus rings and the page is keyboard-navigable.
- Decorative emoji are marked `aria-hidden`; images carry descriptive `alt` text.

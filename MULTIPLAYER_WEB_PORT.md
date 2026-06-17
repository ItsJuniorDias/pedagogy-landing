# Neon Pong — Multiplayer on the Web 🏓

This documents how the **mobile** Neon Pong (React Native / Expo) multiplayer was
brought to the **web** project, using the exact same approach already used for the
Happy Farm game (`react-native-web` + small Expo shims). Nothing about the game
logic, the network protocol, or the server was changed — the mobile module runs
as‑is on the web.

## What changed

1. **Ported the whole mobile module** into `src/games/pong-game/`
   (copied verbatim from the mobile `ping-pong/` folder, **minus** the `server/`
   backend, which is already deployed). This brings the full experience:
   - Start menu → **Solo vs CPU** *or* **Online multiplayer**
   - Online: lobby + matchmaking + a live match against a real human
   - Persistent ranking (points + ranked MMR/Elo), saved in `localStorage`

2. **`src/pages/app/Pong.jsx`** now renders `PongHub` (the mobile root component)
   inside a responsive frame with an optional fullscreen toggle — same pattern as
   `Farm.jsx`. The previous single‑player `NeonPong.jsx` is left in the repo but
   is no longer referenced.

3. **`vite.config.js`** — added one `define` entry so the network config works in
   the browser. The mobile net layer reads `process.env.EXPO_PUBLIC_PONG_SERVER`
   (an Expo convention); `process` doesn't exist in the browser, so its value is
   now inlined at build time. With nothing set it falls back to the hosted server.

No new dependencies and **no new shims** were needed — every Expo/React‑Native
import the game uses (`expo-gl`, `expo-three`, `expo-blur`, `expo-asset`,
`@expo-google-fonts/fredoka-one`, `@react-native-async-storage/async-storage`,
`react-native-safe-area-context`, and `react-native` itself) was already aliased
in `vite.config.js` for the farm game. `Vibration` and `Easing` are provided by
`react-native-web`.

## The server

The web client talks to the **same** server the mobile app uses — your already
deployed Render service:

```
wss://pedagogy-923f.onrender.com
```

The backend (`server.js`) is unchanged: it's a lobby + matchmaking + relay, and
the host is authoritative (simulates physics). The web speaks the identical
message protocol (`src/games/pong-game/net/protocol.ts`), so a web player and a
phone player can even be matched against each other.

### Pointing at a different server (optional, e.g. local dev)

Set an env var before building/serving — either works:

```bash
EXPO_PUBLIC_PONG_SERVER="ws://localhost:8080" npm run dev
# or
VITE_PONG_SERVER="ws://localhost:8080" npm run build
```

With nothing set, it uses the Render URL above.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 → /app/games/pong
npm run build    # production build (validated)
```

Open the Pong page in two browser tabs/devices, pick **Online** in both, and the
lobby will match them into a live game.

## Notes

- `bun.lock` was removed; the project installs with **npm** (`package-lock.json`).
- `node_modules/`, `dist/`, and `.git/` are not included in this archive — run
  `npm install` to restore dependencies. Your original Git history is untouched
  in your own copy.

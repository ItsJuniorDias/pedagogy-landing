/**
 * NeonPong.jsx — NEON PONG 🏓 recreated for React web with
 * three + @react-three/fiber + @react-three/drei.
 *
 * Faithful port of the original Expo (expo-three) game: a 3D table-tennis
 * played flat in the XZ plane (no gravity). You drag (mouse / touch) or use the
 * arrow keys to slide your cyan paddle; swiping sideways on impact applies a
 * curving sidespin ("EFFECT") that the spin-blind CPU mis-reads. The ball
 * accelerates every rally, the CPU tires within a point, first to 7 wins.
 *
 *   npm i three @react-three/fiber@^8.17 @react-three/drei@^9.114
 *   (React 18 → add  "overrides": { "react-reconciler": "0.29.0" }  to package.json)
 *
 *   import NeonPong from './NeonPong.jsx'
 *   <NeonPong />   // fills its parent — give the parent a height
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";

const clamp = THREE.MathUtils.clamp;

// ─── Palette ────────────────────────────────────────────────────────────────
const NEON = {
  bg: "#0B1026",
  panel: "rgba(13,20,45,0.55)",
  edge: "rgba(96,165,250,0.35)",
  cyan: "#22D3EE",
  magenta: "#F472B6",
  yellow: "#FDE047",
  mint: "#34D399",
  amber: "#FBBF24",
  rose: "#FB7185",
  text: "#E2E8F0",
  dim: "#7C8DB5",
};
const C3D = {
  fog: 0x0b1026,
  tableTop: 0x111a3a,
  tableSide: 0x0a1128,
  lines: 0x22d3ee,
  net: 0x93c5fd,
  glassWall: 0x60a5fa,
  legs: 0x1e293b,
  floor: 0x0d1330,
  gridA: 0x2563eb,
  gridB: 0x16275f,
  player: 0x22d3ee,
  ai: 0xf472b6,
  rubberPlayer: 0x0e7490,
  rubberAi: 0x9d2f63,
  rubberBack: 0x1f2937,
  wood: 0xd6a35c,
  ball: 0xfde047,
  orbs: [0x22d3ee, 0xf472b6, 0x818cf8, 0xfde047],
};

// ─── Tuning (ported 1:1) ──────────────────────────────────────────────────────
const WIN_SCORE = 7;
const TABLE = { w: 5, l: 8, halfW: 2.5, halfL: 4, topY: 0.09 };
const RACKET = { r: 0.55, thick: 0.07 };
const PADDLE = { halfW: RACKET.r, d: 0.3, z: 3.55 };
const BALL_R = 0.13;
const BALL_Y = TABLE.topY + BALL_R + 0.02;
const CATCH_ASSIST = 0.62;
const SPIN = { gain: 0.08, max: 2.0, kick: 0.12, tau: 0.55, labelAt: 0.4 };
const FATIGUE = {
  graceSec: 75,
  rampSec: 150,
  slowFrac: 0.34,
  errorAdd: 0.5,
  catchShrink: 0.2,
  tiredAt: 0.5,
};
const AI = { spinBlind: 0.35, errBase: 0.65, errBySpeed: 0.5 };
const RALLY = {
  baseBoost: 1.06,
  cutBoost: 0.02,
  cutBoostMax: 0.14,
  maxMul: 2.3,
};
const DIFFS = {
  easy: {
    id: "easy",
    label: "EASY",
    emoji: "🐢",
    color: NEON.mint,
    aiSpeed: 2.2,
    ballSpeed: 3.2,
    aiError: 0.6,
    aiCatch: 0.18,
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    emoji: "⚡",
    color: NEON.amber,
    aiSpeed: 3.2,
    ballSpeed: 4.2,
    aiError: 0.34,
    aiCatch: 0.28,
  },
  hard: {
    id: "hard",
    label: "HARD",
    emoji: "🔥",
    color: NEON.rose,
    aiSpeed: 4.3,
    ballSpeed: 5.2,
    aiError: 0.18,
    aiCatch: 0.4,
  },
};
const DIFF_LIST = [DIFFS.easy, DIFFS.normal, DIFFS.hard];

const limX = TABLE.halfW - PADDLE.halfW;

// =============================================================================
// Racket — blade + neon rim + wooden handle (matches buildRacket)
// =============================================================================
function Racket({ rubber, edge, innerRef }) {
  const R = RACKET.r;
  const bladeY = TABLE.topY + R + 0.06;
  return (
    <group ref={innerRef}>
      <mesh rotation-x={Math.PI / 2} position-y={bladeY} castShadow>
        <cylinderGeometry args={[R, R, RACKET.thick, 28]} />
        <meshLambertMaterial attach="material-0" color={0x111827} />
        <meshLambertMaterial attach="material-1" color={C3D.rubberBack} />
        <meshLambertMaterial attach="material-2" color={rubber} />
      </mesh>
      <mesh position-y={bladeY}>
        <torusGeometry args={[R, 0.03, 8, 36]} />
        <meshBasicMaterial color={edge} />
      </mesh>
      <mesh position={[0, bladeY - R - 0.13, 0.11]} rotation-x={0.5} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 0.42, 10]} />
        <meshLambertMaterial color={C3D.wood} />
      </mesh>
      <mesh
        position={[0, bladeY - R - 0.02, 0.06]}
        rotation-x={Math.PI / 2 - 0.5}
      >
        <torusGeometry args={[0.072, 0.018, 6, 14]} />
        <meshBasicMaterial color={edge} />
      </mesh>
    </group>
  );
}

// =============================================================================
// Table — top, neon lines, net, glass walls, legs (matches buildTable)
// =============================================================================
function Table() {
  const line = (w, l, x, z, key) => (
    <mesh key={key} position={[x, TABLE.topY + 0.007, z]}>
      <boxGeometry args={[w, 0.012, l]} />
      <meshBasicMaterial color={C3D.lines} />
    </mesh>
  );
  return (
    <group>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[TABLE.w, 0.18, TABLE.l]} />
        <meshLambertMaterial attach="material-0" color={C3D.tableSide} />
        <meshLambertMaterial attach="material-1" color={C3D.tableSide} />
        <meshLambertMaterial attach="material-2" color={C3D.tableTop} />
        <meshLambertMaterial attach="material-3" color={C3D.tableSide} />
        <meshLambertMaterial attach="material-4" color={C3D.tableSide} />
        <meshLambertMaterial attach="material-5" color={C3D.tableSide} />
      </mesh>

      {line(TABLE.w, 0.06, 0, TABLE.halfL - 0.03, "a")}
      {line(TABLE.w, 0.06, 0, -(TABLE.halfL - 0.03), "b")}
      {line(0.06, TABLE.l, TABLE.halfW - 0.03, 0, "c")}
      {line(0.06, TABLE.l, -(TABLE.halfW - 0.03), 0, "d")}
      {line(0.05, TABLE.l, 0, 0, "e")}

      {/* net + posts */}
      <mesh position={[0, TABLE.topY + 0.15, 0]}>
        <boxGeometry args={[TABLE.w + 0.3, 0.3, 0.035]} />
        <meshBasicMaterial color={C3D.net} transparent opacity={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (TABLE.halfW + 0.15), TABLE.topY + 0.17, 0]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.34, 8]} />
          <meshLambertMaterial color={C3D.legs} />
        </mesh>
      ))}

      {/* glass side walls */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (TABLE.halfW + 0.04), TABLE.topY + 0.21, 0]}
        >
          <boxGeometry args={[0.07, 0.42, TABLE.l]} />
          <meshBasicMaterial color={C3D.glassWall} transparent opacity={0.16} />
        </mesh>
      ))}

      {/* legs */}
      {[
        [TABLE.halfW - 0.4, TABLE.halfL - 0.5],
        [-(TABLE.halfW - 0.4), TABLE.halfL - 0.5],
        [TABLE.halfW - 0.4, -(TABLE.halfL - 0.5)],
        [-(TABLE.halfW - 0.4), -(TABLE.halfL - 0.5)],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.72, z]}>
          <cylinderGeometry args={[0.07, 0.07, 1.3, 8]} />
          <meshLambertMaterial color={C3D.legs} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// Arena — dark floor, Tron grid, floating neon orbs (matches buildArena)
// =============================================================================
function Arena({ orbsRef }) {
  const floorY = -1.35;
  const orbs = useMemo(() => {
    const out = [];
    for (let i = 0; i < 14; i++) {
      let x = 0;
      let z = 0;
      do {
        x = (Math.random() * 2 - 1) * 11;
        z = (Math.random() * 2 - 1) * 11;
      } while (
        Math.abs(x) < TABLE.halfW + 1.2 &&
        Math.abs(z) < TABLE.halfL + 1.2
      );
      out.push({
        x,
        z,
        baseY: -0.4 + Math.random() * 1.6,
        spd: 0.6 + Math.random() * 1.4,
        off: Math.random() * Math.PI * 2,
        color: C3D.orbs[i % C3D.orbs.length],
      });
    }
    return out;
  }, []);

  return (
    <group>
      <mesh position={[0, floorY, 0]} receiveShadow>
        <boxGeometry args={[30, 0.16, 30]} />
        <meshLambertMaterial color={C3D.floor} />
      </mesh>
      <gridHelper
        args={[28, 28, C3D.gridA, C3D.gridB]}
        position={[0, floorY + 0.09, 0]}
      />
      {orbs.map((o, i) => (
        <mesh
          key={i}
          position={[o.x, o.baseY, o.z]}
          userData={{ baseY: o.baseY, spd: o.spd, off: o.off }}
          ref={(el) => {
            if (el) orbsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={o.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// Scene — meshes + the full physics/AI loop (was the animate() in usePongGame)
// =============================================================================
function Scene({
  g,
  diffRef,
  setPhase,
  setSpeedMul,
  spawnLabel,
  onPointRef,
  onHitRef,
}) {
  const { camera } = useThree();
  const ballRef = useRef();
  const playerRef = useRef();
  const aiRef = useRef();
  const orbsRef = useRef([]);

  useEffect(() => {
    camera.position.set(0, 5.6, 9.0);
    camera.lookAt(0, -0.4, -1.0);
  }, [camera]);

  // expose meshes on the shared ref so parent handlers can reach them
  useEffect(() => {
    g.current.ball = ballRef.current;
    g.current.player = playerRef.current;
    g.current.ai = aiRef.current;
    g.current.orbs = orbsRef.current;
  });

  useFrame((_, delta) => {
    const r = g.current;
    const ball = ballRef.current;
    const player = playerRef.current;
    const ai = aiRef.current;
    if (!ball || !player || !ai) return;

    const dt = Math.min(0.034, delta);
    r.t += dt;
    const now = performance.now();
    const v = r.vel;
    const diffCfg = DIFFS[diffRef.current];

    // ambient orbs bob
    orbsRef.current.forEach((orb) => {
      if (orb)
        orb.position.y =
          orb.userData.baseY +
          0.18 * Math.sin(r.t * orb.userData.spd + orb.userData.off);
    });

    // keyboard nudges the target before smoothing
    if (r.keys.has("arrowleft") || r.keys.has("a")) r.targetX -= 4.2 * dt;
    if (r.keys.has("arrowright") || r.keys.has("d")) r.targetX += 4.2 * dt;

    // player paddle chases the pointer and leans into the slide
    const tx = clamp(r.targetX, -limX, limX);
    r.targetX = clamp(r.targetX, -limX * 1.12, limX * 1.12);
    const playerPrevX = player.position.x;
    player.position.x += (tx - player.position.x) * Math.min(1, dt * 24);
    player.userData.vx = (player.position.x - playerPrevX) / Math.max(dt, 1e-4);
    const lean = clamp((player.position.x - tx) * 0.55, -0.38, 0.38);
    player.rotation.z += (lean - player.rotation.z) * Math.min(1, dt * 14);

    // serve
    if (r.phase === "serving" && now >= r.serveAt) {
      const base = diffCfg.ballSpeed;
      v.z = r.serveDir * base * 0.95;
      v.x = (Math.random() * 2 - 1) * base * 0.32;
      r.phase = "play";
      setPhase("play");
    }

    if (r.phase === "play") {
      // CPU fatigue (per-point)
      r.playTime += dt;
      const fatigue = clamp(
        (r.playTime - FATIGUE.graceSec) / FATIGUE.rampSec,
        0,
        1,
      );
      const effAiSpeed = diffCfg.aiSpeed * (1 - fatigue * FATIGUE.slowFrac);
      const effAiCatch = Math.max(
        0,
        diffCfg.aiCatch - fatigue * FATIGUE.catchShrink,
      );
      const errFloor = diffCfg.aiError + fatigue * FATIGUE.errorAdd;
      if (!r.tiredShown && fatigue >= FATIGUE.tiredAt) {
        r.tiredShown = true;
        spawnLabel("😮‍💨 CPU GETTING TIRED", NEON.amber);
      }

      // new approach → roll a fresh read error (bigger when ball is faster)
      const vzSign = Math.sign(v.z);
      if (vzSign < 0 && r.prevVZSign >= 0) {
        const mag = errFloor * (AI.errBase + AI.errBySpeed * r.speedMul);
        r.aiAimErr = (Math.random() * 2 - 1) * mag;
      }
      r.prevVZSign = vzSign;

      // CPU aims where the straight line lands — it ignores the curve
      let aiTarget = 0;
      if (v.z < 0) {
        const aiPlaneZ = -(PADDLE.z - BALL_R - PADDLE.d / 2);
        const tReach = (aiPlaneZ - ball.position.z) / (v.z || -1e-6);
        const predX = ball.position.x + v.x * Math.max(0, tReach);
        const mX = TABLE.halfW - BALL_R;
        const period = 4 * mX;
        const p = (((predX + mX) % period) + period) % period;
        aiTarget = (p <= 2 * mX ? p : period - p) - mX;
        aiTarget += r.aiAimErr - r.spin * AI.spinBlind;
      }
      const dx = aiTarget - ai.position.x;
      const maxMove = effAiSpeed * dt;
      const aiPrevX = ai.position.x;
      ai.position.x = clamp(
        ai.position.x + clamp(dx, -maxMove, maxMove),
        -limX,
        limX,
      );
      ai.userData.vx = (ai.position.x - aiPrevX) / Math.max(dt, 1e-4);
      const aiLean = clamp(dx * 0.4, -0.35, 0.35);
      ai.rotation.z += (aiLean - ai.rotation.z) * Math.min(1, dt * 10);

      // sidespin curves the velocity vector and decays
      if (r.spin !== 0) {
        const ang = r.spin * dt;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const rvx = v.x * cs - v.z * sn;
        const rvz = v.x * sn + v.z * cs;
        v.x = rvx;
        v.z = rvz;
        r.spin *= Math.exp(-dt / SPIN.tau);
        if (Math.abs(r.spin) < 0.02) r.spin = 0;
      }

      // ball physics
      const prevZ = ball.position.z;
      let nx = ball.position.x + v.x * dt;
      let nz = ball.position.z + v.z * dt;

      const maxX = TABLE.halfW - BALL_R;
      if (nx > maxX) {
        nx = maxX - (nx - maxX);
        v.x = -Math.abs(v.x);
        r.spin *= 0.5;
      } else if (nx < -maxX) {
        nx = -maxX + (-maxX - nx);
        v.x = Math.abs(v.x);
        r.spin *= 0.5;
      }

      const tryPaddle = (paddle, dirSign, catchAssist) => {
        if (Math.sign(v.z) !== dirSign) return;
        const plane = dirSign * (PADDLE.z - BALL_R - PADDLE.d / 2);
        const crossed =
          dirSign === 1
            ? prevZ <= plane && nz >= plane
            : prevZ >= plane && nz <= plane;
        if (!crossed) return;
        const tFrac = (plane - prevZ) / (nz - prevZ || 1e-6);
        const hitX = ball.position.x + v.x * dt * tFrac;
        if (
          Math.abs(hitX - paddle.position.x) >
          PADDLE.halfW + BALL_R + catchAssist
        )
          return;

        const paddleVX = paddle.userData.vx ?? 0;
        const boost =
          RALLY.baseBoost +
          Math.min(RALLY.cutBoostMax, Math.abs(paddleVX) * RALLY.cutBoost);
        r.speedMul = Math.min(RALLY.maxMul, r.speedMul * boost);
        const base = diffCfg.ballSpeed * r.speedMul;
        let vx = v.x + (hitX - paddle.position.x) * 3.1 + paddleVX * SPIN.kick;
        vx = clamp(vx, -base * 0.8, base * 0.8);
        const minVz = base * 0.62;
        const vz = Math.max(
          minVz,
          Math.sqrt(Math.max(base * base - vx * vx, minVz * minVz)),
        );
        v.x = vx;
        v.z = -dirSign * vz;
        r.spin = clamp(paddleVX * SPIN.gain * -dirSign, -SPIN.max, SPIN.max);
        nz = plane;
        if (dirSign === 1) r.hitPlayer = now;
        else r.hitAi = now;
        onHitRef.current(Math.abs(r.spin), dirSign === 1);
      };

      tryPaddle(player, 1, CATCH_ASSIST);
      tryPaddle(ai, -1, effAiCatch);

      ball.position.x = nx;
      ball.position.z = nz;

      if (nz > TABLE.halfL + 1.1) onPointRef.current("cpu");
      else if (nz < -(TABLE.halfL + 1.1)) onPointRef.current("player");
    }

    // racket "twang" on hit
    const twang = (p, hitAt) => {
      const k = Math.max(0, 1 - (now - hitAt) / 160);
      const sw = 1 + 0.18 * k;
      p.scale.set(sw, sw, 1 - 0.2 * k);
    };
    twang(player, r.hitPlayer);
    twang(ai, r.hitAi);

    // ball breathes while waiting; rolls while moving
    if (r.phase === "serving" || r.phase === "idle") {
      const sBall = 1 + 0.12 * Math.sin(r.t * 6);
      ball.scale.set(sBall, sBall, sBall);
    } else {
      ball.scale.set(1, 1, 1);
    }
    ball.rotation.x += v.z * dt * 2;
    ball.rotation.z -= v.x * dt * 2;
    ball.rotation.y += r.spin * dt * 3;
  });

  return (
    <>
      <color attach="background" args={[C3D.fog]} />
      <fog attach="fog" args={[C3D.fog, 14, 30]} />

      <ambientLight color={0x8899ff} intensity={0.7} />
      <directionalLight
        color={0xbcd0ff}
        intensity={1.6}
        position={[5, 10, 6]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
      />
      <pointLight
        color={C3D.player}
        intensity={9}
        distance={16}
        position={[-4, 3, 5]}
      />
      <pointLight
        color={C3D.ai}
        intensity={9}
        distance={16}
        position={[4, 3, -5]}
      />

      <Arena orbsRef={orbsRef} />
      <Table />

      <group position={[0, 0, PADDLE.z]}>
        <Racket
          rubber={C3D.rubberPlayer}
          edge={C3D.player}
          innerRef={playerRef}
        />
      </group>
      <group position={[0, 0, -PADDLE.z]} rotation-y={Math.PI}>
        <Racket rubber={C3D.rubberAi} edge={C3D.ai} innerRef={aiRef} />
      </group>

      <Trail
        width={0.5}
        length={4}
        color={NEON.yellow}
        attenuation={(t) => t * t}
        decay={1}
        local
      >
        <mesh ref={ballRef} position={[0, BALL_Y, 0]} castShadow>
          <sphereGeometry args={[BALL_R, 16, 16]} />
          <meshBasicMaterial color={C3D.ball} />
        </mesh>
      </Trail>
    </>
  );
}

// =============================================================================
// HUD bits (DOM) — dark-glass neon, matching the RN components
// =============================================================================
const glass = {
  background: NEON.panel,
  border: `1px solid ${NEON.edge}`,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
};
const FONT = "'Fredoka One', system-ui, sans-serif";

function Scoreboard({ score, rally, bestRally, speedMul }) {
  const progress = Math.min(1, (speedMul - 1) / 1);
  const Side = ({ name, value, color }) => (
    <div style={{ width: 96, textAlign: "center" }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: color,
          margin: "0 auto 3px",
        }}
      />
      <div
        style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 1.4, color }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 40,
          lineHeight: "44px",
          color,
          textShadow: `0 0 16px ${color}88`,
        }}
      >
        {value}
      </div>
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          ...glass,
          borderRadius: 22,
          padding: "10px 18px 9px",
          width: "min(440px, 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Side name="YOU" value={score.p} color={NEON.cyan} />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                letterSpacing: 3,
                color: NEON.dim,
              }}
            >
              VS
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, color: NEON.text }}>
              🔥 {rally}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 9,
                letterSpacing: 1.5,
                color: NEON.dim,
              }}
            >
              BEST {bestRally}
            </div>
          </div>
          <Side name="CPU" value={score.c} color={NEON.magenta} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 9,
              letterSpacing: 2,
              color: NEON.dim,
            }}
          >
            SPD
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: "rgba(125,140,180,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${3 + progress * 97}%`,
                background: NEON.yellow,
                borderRadius: 2,
                transition: "width .35s ease-out",
                boxShadow: `0 0 8px ${NEON.yellow}`,
              }}
            />
          </div>
          <span style={{ fontFamily: FONT, fontSize: 10, color: NEON.yellow }}>
            {speedMul.toFixed(2)}x
          </span>
        </div>
      </div>
    </div>
  );
}

function ControlBar({ phase, diff, onTogglePause, onReset, onSelectDiff }) {
  const pauseDisabled = phase === "idle" || phase === "over";
  const Btn = ({ children, onClick, disabled, w = 44 }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: w,
        height: 44,
        borderRadius: 22,
        border: "none",
        background: "transparent",
        color: NEON.text,
        fontSize: 19,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
  const divider = (
    <div
      style={{ width: 1, height: 28, background: "rgba(125,140,180,0.25)" }}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...glass,
          borderRadius: 26,
          padding: "7px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "min(440px, 100%)",
        }}
      >
        <Btn onClick={onTogglePause} disabled={pauseDisabled}>
          {phase === "paused" ? "▶️" : "⏸"}
        </Btn>
        {divider}
        <div style={{ flex: 1, display: "flex", gap: 5 }}>
          {DIFF_LIST.map((d) => {
            const active = diff === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onSelectDiff(d.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                  padding: "6px 0",
                  borderRadius: 16,
                  cursor: "pointer",
                  background: active ? d.color + "33" : "transparent",
                  border: `1px solid ${active ? d.color : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 15 }}>{d.emoji}</span>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 9,
                    letterSpacing: 1.2,
                    color: active ? d.color : NEON.dim,
                  }}
                >
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
        {divider}
        <Btn onClick={onReset}>↺</Btn>
      </div>
    </div>
  );
}

// =============================================================================
// NeonPong — owns game state + HUD + input, mounts the Canvas
// =============================================================================
export default function NeonPong() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Erro ao alternar fullscreen:", err);
    }
  };

  const wrapRef = useRef(null);

  const g = useRef({
    ball: null,
    player: null,
    ai: null,
    orbs: [],
    vel: { x: 0, z: 0 },
    spin: 0,
    targetX: 0,
    phase: "idle",
    serveAt: 0,
    serveDir: -1,
    speedMul: 1,
    rally: 0,
    t: 0,
    playTime: 0,
    prevVZSign: 0,
    aiAimErr: 0,
    tiredShown: false,
    hitPlayer: 0,
    hitAi: 0,
    keys: new Set(),
  });

  const [score, setScore] = useState({ p: 0, c: 0 });
  const [phase, setPhaseState] = useState("idle");
  const [rally, setRally] = useState(0);
  const [bestRally, setBestRally] = useState(0);
  const [speedMul, setSpeedMul] = useState(1);
  const [diff, setDiffState] = useState("normal");
  const [overVisible, setOverVisible] = useState(false);
  const [labels, setLabels] = useState([]);

  const scoreRef = useRef(score);
  const bestRef = useRef(0);
  const diffRef = useRef("normal");

  const setPhase = useCallback((p) => {
    g.current.phase = p;
    setPhaseState(p);
  }, []);

  const setDiff = useCallback((id) => {
    diffRef.current = id;
    setDiffState(id);
  }, []);

  const spawnLabel = useCallback((text, color) => {
    const id = `${Date.now()}_${Math.random()}`;
    setLabels((p) => [...p, { id, text, color }]);
    setTimeout(() => setLabels((p) => p.filter((l) => l.id !== id)), 1300);
  }, []);

  const resetBall = useCallback(() => {
    const r = g.current;
    if (r.ball) r.ball.position.set(0, BALL_Y, 0);
    r.vel.x = 0;
    r.vel.z = 0;
    r.spin = 0;
    r.speedMul = 1;
    setSpeedMul(1);
  }, []);

  const scheduleServe = useCallback(
    (dir, delay = 900) => {
      const r = g.current;
      resetBall();
      r.serveDir = dir;
      r.serveAt = performance.now() + delay;
      setPhase("serving");
    },
    [resetBall, setPhase],
  );

  const startGame = useCallback(() => {
    const r = g.current;
    scoreRef.current = { p: 0, c: 0 };
    setScore({ p: 0, c: 0 });
    r.rally = 0;
    setRally(0);
    r.playTime = 0;
    r.prevVZSign = 0;
    r.aiAimErr = 0;
    r.tiredShown = false;
    setOverVisible(false);
    scheduleServe(-1, 650);
  }, [scheduleServe]);

  const togglePause = useCallback(() => {
    const r = g.current;
    if (r.phase === "play" || r.phase === "serving") setPhase("paused");
    else if (r.phase === "paused") scheduleServe(r.serveDir, 600);
  }, [scheduleServe, setPhase]);

  const resetGame = useCallback(() => {
    scoreRef.current = { p: 0, c: 0 };
    setScore({ p: 0, c: 0 });
    g.current.rally = 0;
    setRally(0);
    bestRef.current = 0;
    setBestRally(0);
    g.current.playTime = 0;
    g.current.prevVZSign = 0;
    g.current.aiAimErr = 0;
    g.current.tiredShown = false;
    resetBall();
    setOverVisible(false);
    setPhase("idle");
  }, [resetBall, setPhase]);

  const onPoint = useCallback(
    (who) => {
      const isPlayer = who === "player";
      const prev = scoreRef.current;
      const ns = {
        p: prev.p + (isPlayer ? 1 : 0),
        c: prev.c + (isPlayer ? 0 : 1),
      };
      scoreRef.current = ns;
      setScore(ns);
      g.current.rally = 0;
      setRally(0);
      g.current.playTime = 0;
      g.current.prevVZSign = 0;
      g.current.aiAimErr = 0;
      g.current.tiredShown = false;
      spawnLabel(
        isPlayer ? "🎉 POINT!" : "🤖 CPU POINT",
        isPlayer ? NEON.cyan : NEON.magenta,
      );
      if (ns.p >= WIN_SCORE || ns.c >= WIN_SCORE) {
        setPhase("over");
        resetBall();
        setOverVisible(true);
      } else {
        scheduleServe(isPlayer ? -1 : 1);
      }
    },
    [resetBall, scheduleServe, setPhase, spawnLabel],
  );

  const onHit = useCallback(
    (spinMag, isPlayer) => {
      const r = g.current;
      r.rally += 1;
      setRally(r.rally);
      if (r.rally > bestRef.current) {
        bestRef.current = r.rally;
        setBestRally(r.rally);
      }
      setSpeedMul(r.speedMul);
      if (isPlayer && spinMag >= SPIN.labelAt)
        spawnLabel("🌀 EFFECT!", NEON.cyan);
    },
    [spawnLabel],
  );

  const onPointRef = useRef(onPoint);
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onPointRef.current = onPoint;
  }, [onPoint]);
  useEffect(() => {
    onHitRef.current = onHit;
  }, [onHit]);

  // pointer → paddle target
  const movePointer = useCallback((clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 1) return;
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    g.current.targetX = nx * limX * 1.12;
  }, []);
  const onPointerMove = (e) => movePointer(e.clientX);
  const onPointerDown = (e) => movePointer(e.clientX);

  // keyboard
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " "].includes(k))
        e.preventDefault();
      if (k === "p" || k === "escape") {
        togglePause();
        return;
      }
      if ((k === " " || k === "enter") && g.current.phase === "idle") {
        startGame();
        return;
      }
      g.current.keys.add(k);

      if (e.key.toLowerCase() === "f") {
        e.preventDefault();

        if (!document.fullscreenElement) {
          wrapRef.current?.requestFullscreen();
        } else {
          document.exitFullscreen();
        }

        return;
      }
    };
    const up = (e) => g.current.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [togglePause, startGame]);

  const HINT = {
    idle: "FIRST TO 7 POINTS",
    serving: "GET READY…",
    play: "DRAG TO MOVE YOUR PADDLE",
    paused: "PAUSED",
    over: "MATCH OVER",
  };
  const playerWon = score.p >= WIN_SCORE;

  return (
    <div
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: NEON.bg,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        @keyframes npPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes npFloat { 0%{transform:translateY(0);opacity:1} 70%{opacity:1} 100%{transform:translateY(-64px);opacity:0} }
        @keyframes npPop { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5.6, 9.0], fov: 56, near: 0.1, far: 100 }}
      >
        <Scene
          g={g}
          diffRef={diffRef}
          setPhase={setPhase}
          setSpeedMul={setSpeedMul}
          spawnLabel={spawnLabel}
          onPointRef={onPointRef}
          onHitRef={onHitRef}
        />
      </Canvas>

      <Scoreboard
        score={score}
        rally={rally}
        bestRally={bestRally}
        speedMul={speedMul}
      />

      <button
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `1px solid ${NEON.edge}`,
          background: NEON.panel,
          color: NEON.text,
          fontSize: 22,
          cursor: "pointer",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all .2s ease",
        }}
        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isFullscreen ? "🗗" : "⛶"}
      </button>

      {/* floating labels */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {labels.map((l) => (
          <div
            key={l.id}
            style={{
              position: "absolute",
              fontFamily: FONT,
              fontSize: 22,
              letterSpacing: 1.5,
              color: l.color,
              textShadow: `0 0 12px ${l.color}aa, 0 1px 4px rgba(0,0,0,.6)`,
              animation: "npFloat 1.3s ease-out forwards",
              whiteSpace: "nowrap",
            }}
          >
            {l.text}
          </div>
        ))}
      </div>

      {/* start overlay */}
      {phase === "idle" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <button
            onClick={startGame}
            style={{
              ...glass,
              border: `1px solid ${NEON.cyan}88`,
              borderRadius: 28,
              padding: "22px 38px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              animation: "npPulse 1.4s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 36 }}>🏓</span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 22,
                letterSpacing: 3,
                color: NEON.cyan,
                textShadow: `0 0 16px ${NEON.cyan}`,
              }}
            >
              TAP TO PLAY
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 10,
                letterSpacing: 1.5,
                color: NEON.dim,
              }}
            >
              drag your paddle · first to 7
            </span>
          </button>
        </div>
      )}

      {/* hint */}
      <div
        style={{
          position: "absolute",
          bottom: 86,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
          fontFamily: FONT,
          fontSize: 11,
          letterSpacing: 2.5,
          color: NEON.dim,
          animation: "npPulse 1.4s ease-in-out infinite",
        }}
      >
        {HINT[phase]}
      </div>

      <ControlBar
        phase={phase}
        diff={diff}
        onTogglePause={togglePause}
        onReset={resetGame}
        onSelectDiff={setDiff}
      />

      {/* game over */}
      {overVisible && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(11,16,38,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              ...glass,
              borderRadius: 28,
              padding: "28px 34px",
              textAlign: "center",
              animation: "npPop .25s ease-out",
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 52 }}>{playerWon ? "🏆" : "🤖"}</div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 26,
                letterSpacing: 2,
                color: playerWon ? NEON.cyan : NEON.magenta,
                textShadow: `0 0 16px ${playerWon ? NEON.cyan : NEON.magenta}88`,
              }}
            >
              {playerWon ? "YOU WIN!" : "CPU WINS"}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 22, marginTop: 6 }}>
              <span style={{ color: NEON.cyan }}>{score.p}</span>
              <span style={{ color: NEON.dim }}> : </span>
              <span style={{ color: NEON.magenta }}>{score.c}</span>
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                letterSpacing: 1.5,
                color: NEON.dim,
                marginTop: 4,
              }}
            >
              🔥 BEST RALLY {bestRally}
            </div>
            <button
              onClick={startGame}
              style={{
                marginTop: 18,
                ...glass,
                border: `1px solid ${NEON.cyan}88`,
                borderRadius: 18,
                padding: "12px 28px",
                fontFamily: FONT,
                fontSize: 15,
                letterSpacing: 2,
                color: NEON.cyan,
                cursor: "pointer",
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

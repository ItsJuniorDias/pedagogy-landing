// -----------------------------------------------------------------------------
// PongGame.jsx — a 3D table-tennis arena built with three / @react-three/fiber /
// @react-three/drei.
//
// You control the near paddle (move it in X/Y with mouse, touch, or WASD/arrows);
// the ball is a sphere with a comet Trail that bounces off the four walls and
// flies down the court. Score when it gets past a paddle. Single-player vs a
// tunable CPU, or local 2-player. Simulation lives in refs and runs inside
// useFrame; React state only drives the (DOM) scoreboard + overlays.
// -----------------------------------------------------------------------------
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Trail, Grid, Edges, ContactShadows } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '../../motion.js'

// --- court dimensions (world units) -----------------------------------------
const W = 10 // x span
const H = 6 // y span
const D = 15 // z span (depth)
const NEAR_Z = D / 2 // player paddle plane (toward camera)
const FAR_Z = -D / 2 // CPU paddle plane
const PW = 2.4 // paddle width
const PH = 2.0 // paddle height
const PD = 0.4 // paddle depth
const R = 0.34 // ball radius
const WALL_X = W / 2 - R
const WALL_Y = H / 2 - R
const RANGE_X = W / 2 - PW / 2
const RANGE_Y = H / 2 - PH / 2

const START_VZ = 9
const MAX_VZ = 24
const SPEEDUP = 1.05

const CAMERA = { position: [0, 3.9, 15.5], fov: 42 }
const DPR = [1, 2]
const STORE_KEY = 'pedagogy.pong.v1'

const DIFF = {
  easy: { label: 'Easy', speed: 5.5, err: 3.0, refresh: 0.55 },
  normal: { label: 'Normal', speed: 8.5, err: 1.3, refresh: 0.7 },
  hard: { label: 'Hard', speed: 13.0, err: 0.45, refresh: 0.95 },
}
const WIN_OPTIONS = [5, 7, 11]

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

// Fold a value into [0, span] via reflection (triangle wave) — used to predict
// where a bouncing ball lands.
function foldRange(v, span) {
  if (span <= 0) return 0
  const p = 2 * span
  let t = ((v % p) + p) % p
  return t > span ? p - t : t
}
const foldReflect = (v, min, max) => min + foldRange(v - min, max - min)

// =============================================================================
// Scene — all the three.js objects + the per-frame game loop. Memoized so the
// loop never restarts when the parent re-renders for the scoreboard/overlays.
// =============================================================================
const Scene = React.memo(function Scene({
  statusRef,
  modeRef,
  diffRef,
  scoreRef,
  pointerRef,
  keysRef,
  resetRef,
  onPoint,
  onCountdown,
  setStatus,
  playSound,
}) {
  const ballRef = useRef()
  const plRef = useRef()
  const prRef = useRef()

  const sim = useRef({
    ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 },
    pl: { x: 0, y: 0 },
    pr: { x: 0, y: 0 },
    prevZ: 0,
    rally: 0,
    countdownT: 0,
    shownCount: 99,
    pendingDir: -1,
    lastConceded: null,
    aiTimer: 0,
    aiErrX: 0,
    aiErrY: 0,
    hitPL: 0,
    hitPR: 0,
    ballPulse: 0,
    prevStatus: 'menu',
    seenReset: 0,
  }).current

  const centerBall = () => {
    sim.ball.x = 0
    sim.ball.y = 0
    sim.ball.z = 0
    sim.ball.vx = 0
    sim.ball.vy = 0
    sim.ball.vz = 0
    sim.prevZ = 0
  }

  const launch = () => {
    sim.ball.vz = sim.pendingDir * START_VZ
    sim.ball.vx = (Math.random() * 2 - 1) * 3
    sim.ball.vy = (Math.random() * 2 - 1) * 2
  }

  const initServe = () => {
    centerBall()
    sim.rally = 0
    sim.countdownT = 3
    sim.shownCount = 99
    sim.pendingDir =
      sim.lastConceded == null ? (Math.random() < 0.5 ? -1 : 1) : sim.lastConceded === 'r' ? -1 : 1
  }

  const bounce = (p, near) => {
    const ox = clamp((sim.ball.x - p.x) / (PW / 2), -1, 1)
    const oy = clamp((sim.ball.y - p.y) / (PH / 2), -1, 1)
    const vz = clamp(Math.abs(sim.ball.vz) * SPEEDUP, 0, MAX_VZ)
    sim.ball.vz = near ? -vz : vz
    sim.ball.vx = clamp(sim.ball.vx + ox * 4.2, -10, 10)
    sim.ball.vy = clamp(sim.ball.vy + oy * 4.0, -8, 8)
    sim.ball.z = near ? NEAR_Z - R : FAR_Z + R
    sim.rally += 1
    if (near) sim.hitPL = 1
    else sim.hitPR = 1
    sim.ballPulse = 1
    playSound('hit')
  }

  const score = (gain) => {
    sim.lastConceded = gain === 'l' ? 'r' : 'l'
    const rally = sim.rally
    centerBall()
    playSound('score')
    onPoint(gain, rally)
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = statusRef.current
    const mode = modeRef.current

    // fresh game requested → reset everything
    if (resetRef.current !== sim.seenReset) {
      sim.seenReset = resetRef.current
      sim.lastConceded = null
      sim.pl.x = 0
      sim.pl.y = 0
      sim.pr.x = 0
      sim.pr.y = 0
      centerBall()
    }

    // entering countdown → set up the serve
    if (st === 'countdown' && sim.prevStatus !== 'countdown') {
      initServe()
      onCountdown(3)
    }

    if (st === 'countdown') {
      sim.countdownT -= dt
      const n = Math.ceil(sim.countdownT)
      if (n !== sim.shownCount && n > 0) {
        sim.shownCount = n
        onCountdown(n)
        playSound('count')
      }
      if (sim.countdownT <= 0) {
        launch()
        onCountdown(0)
        setStatus('playing')
      }
    }

    let scored = false
    if (st === 'playing') {
      // --- paddles -----------------------------------------------------------
      const keys = keysRef.current
      const KSP = 9 * dt
      const move = (p, up, down, left, right) => {
        if (keys.has(up)) p.y += KSP
        if (keys.has(down)) p.y -= KSP
        if (keys.has(left)) p.x -= KSP
        if (keys.has(right)) p.x += KSP
      }

      if (mode === '2p') {
        move(sim.pl, 'w', 's', 'a', 'd')
        move(sim.pr, 'arrowup', 'arrowdown', 'arrowleft', 'arrowright')
      } else {
        const ptr = pointerRef.current
        if (ptr.active) {
          sim.pl.x = ptr.x * RANGE_X
          sim.pl.y = ptr.y * RANGE_Y
        }
        move(sim.pl, 'w', 's', 'a', 'd')
        move(sim.pl, 'arrowup', 'arrowdown', 'arrowleft', 'arrowright')

        // --- CPU paddle ------------------------------------------------------
        const d = DIFF[diffRef.current] || DIFF.normal
        sim.aiTimer -= dt
        if (sim.aiTimer <= 0) {
          sim.aiTimer = d.refresh
          sim.aiErrX = (Math.random() * 2 - 1) * d.err
          sim.aiErrY = (Math.random() * 2 - 1) * d.err * 0.6
        }
        let tx = 0
        let ty = 0
        if (sim.ball.vz < 0) {
          const t = (FAR_Z - sim.ball.z) / sim.ball.vz
          tx = foldReflect(sim.ball.x + sim.ball.vx * t, -WALL_X, WALL_X) + sim.aiErrX
          ty = foldReflect(sim.ball.y + sim.ball.vy * t, -WALL_Y, WALL_Y) + sim.aiErrY
        }
        tx = clamp(tx, -RANGE_X, RANGE_X)
        ty = clamp(ty, -RANGE_Y, RANGE_Y)
        const step = d.speed * dt
        sim.pr.x += clamp(tx - sim.pr.x, -step, step)
        sim.pr.y += clamp(ty - sim.pr.y, -step, step)
      }

      sim.pl.x = clamp(sim.pl.x, -RANGE_X, RANGE_X)
      sim.pl.y = clamp(sim.pl.y, -RANGE_Y, RANGE_Y)
      sim.pr.x = clamp(sim.pr.x, -RANGE_X, RANGE_X)
      sim.pr.y = clamp(sim.pr.y, -RANGE_Y, RANGE_Y)

      // --- integrate ball ----------------------------------------------------
      sim.prevZ = sim.ball.z
      sim.ball.x += sim.ball.vx * dt
      sim.ball.y += sim.ball.vy * dt
      sim.ball.z += sim.ball.vz * dt

      // walls
      if (sim.ball.x > WALL_X) {
        sim.ball.x = WALL_X
        sim.ball.vx = -Math.abs(sim.ball.vx)
        playSound('wall')
      } else if (sim.ball.x < -WALL_X) {
        sim.ball.x = -WALL_X
        sim.ball.vx = Math.abs(sim.ball.vx)
        playSound('wall')
      }
      if (sim.ball.y > WALL_Y) {
        sim.ball.y = WALL_Y
        sim.ball.vy = -Math.abs(sim.ball.vy)
        playSound('wall')
      } else if (sim.ball.y < -WALL_Y) {
        sim.ball.y = -WALL_Y
        sim.ball.vy = Math.abs(sim.ball.vy)
        playSound('wall')
      }

      // near (player) paddle / CPU scores
      if (sim.ball.vz > 0) {
        if (sim.prevZ <= NEAR_Z && sim.ball.z >= NEAR_Z) {
          if (
            Math.abs(sim.ball.x - sim.pl.x) <= PW / 2 + R &&
            Math.abs(sim.ball.y - sim.pl.y) <= PH / 2 + R
          ) {
            bounce(sim.pl, true)
          }
        }
        if (sim.ball.z > NEAR_Z + R * 1.5) {
          score('r')
          scored = true
        }
      }
      // far (CPU) paddle / player scores
      if (!scored && sim.ball.vz < 0) {
        if (sim.prevZ >= FAR_Z && sim.ball.z <= FAR_Z) {
          if (
            Math.abs(sim.ball.x - sim.pr.x) <= PW / 2 + R &&
            Math.abs(sim.ball.y - sim.pr.y) <= PH / 2 + R
          ) {
            bounce(sim.pr, false)
          }
        }
        if (sim.ball.z < FAR_Z - R * 1.5) {
          score('l')
          scored = true
        }
      }
    }

    // --- decay juice ---------------------------------------------------------
    sim.hitPL = Math.max(0, sim.hitPL - dt * 4)
    sim.hitPR = Math.max(0, sim.hitPR - dt * 4)
    sim.ballPulse = Math.max(0, sim.ballPulse - dt * 5)

    // --- push state into meshes ---------------------------------------------
    if (ballRef.current) {
      ballRef.current.position.set(sim.ball.x, sim.ball.y, sim.ball.z)
      const s = 1 + 0.28 * sim.ballPulse
      ballRef.current.scale.setScalar(s)
      ballRef.current.rotation.x += dt * 2.2
      ballRef.current.rotation.y += dt * 1.6
    }
    if (plRef.current) {
      plRef.current.position.set(sim.pl.x, sim.pl.y, NEAR_Z)
      const s = 1 + 0.16 * sim.hitPL
      plRef.current.scale.set(s, s, 1)
    }
    if (prRef.current) {
      prRef.current.position.set(sim.pr.x, sim.pr.y, FAR_Z)
      const s = 1 + 0.16 * sim.hitPR
      prRef.current.scale.set(s, s, 1)
    }

    sim.prevStatus = st
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#e2d9ff', 1.0]} />
      <ambientLight intensity={0.85} />
      <directionalLight
        castShadow
        position={[6, 11, 7]}
        intensity={2.4}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />

      {/* floor + grid */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -H / 2, 0]} receiveShadow>
        <planeGeometry args={[W + 3, D + 3]} />
        <meshStandardMaterial color="#FBF7EC" roughness={1} />
      </mesh>
      <Grid
        position={[0, -H / 2 + 0.01, 0]}
        args={[W, D]}
        cellSize={1}
        cellThickness={1}
        cellColor="#d9ccff"
        sectionSize={5}
        sectionThickness={1.4}
        sectionColor="#b9a6ff"
        fadeDistance={34}
        fadeStrength={1}
        infiniteGrid={false}
      />
      {/* center ring */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -H / 2 + 0.02, 0]}>
        <ringGeometry args={[0.72, 0.86, 44]} />
        <meshBasicMaterial color="#FF4D87" />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 0, FAR_Z - 0.45]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#EFE9FF" roughness={1} />
      </mesh>

      {/* court cage */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges threshold={15} color="#C9BBFF" />
      </mesh>

      {/* paddles */}
      <RoundedBox ref={plRef} args={[PW, PH, PD]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color="#6D4BE0" metalness={0.25} roughness={0.35} emissive="#6D4BE0" emissiveIntensity={0.18} />
      </RoundedBox>
      <RoundedBox ref={prRef} args={[PW, PH, PD]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color="#FF4D87" metalness={0.25} roughness={0.35} emissive="#FF4D87" emissiveIntensity={0.18} />
      </RoundedBox>

      {/* ball with a comet trail */}
      <Trail local width={0.6} length={6} color="#FF7A2F" attenuation={(t) => t * t} decay={1}>
        <mesh ref={ballRef} castShadow>
          <sphereGeometry args={[R, 32, 32]} />
          <meshStandardMaterial color="#3A3142" metalness={0.35} roughness={0.4} emissive="#FF7A2F" emissiveIntensity={0.12} />
        </mesh>
      </Trail>

      <ContactShadows position={[0, -H / 2 + 0.015, 0]} scale={Math.max(W, D) + 6} blur={2.6} far={H} opacity={0.4} color="#3A3142" />
    </>
  )
})

// =============================================================================
// Small UI helpers
// =============================================================================
function Segmented({ options, value, onChange, color = '#6D4BE0' }) {
  return (
    <div className="inline-flex rounded-2xl bg-cream p-1 ring-1 ring-black/5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={
              'rounded-xl px-3.5 py-2 text-[13px] font-display font-extrabold transition-colors ' +
              (active ? 'text-white shadow-sm' : 'text-inksoft hover:text-ink')
            }
            style={active ? { background: color } : undefined}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// =============================================================================
// PongGame — the page-level component (DOM UI + the Canvas)
// =============================================================================
export default function PongGame() {
  const wrapperRef = useRef(null)

  // refs the loop reads
  const statusRef = useRef('menu')
  const modeRef = useRef('1p')
  const diffRef = useRef('normal')
  const targetRef = useRef(7)
  const mutedRef = useRef(false)
  const scoreRef = useRef({ l: 0, r: 0 })
  const pointerRef = useRef({ active: false, x: 0, y: 0 })
  const keysRef = useRef(new Set())
  const audioRef = useRef(null)
  const resetRef = useRef(0)

  // UI state
  const [status, setStatusState] = useState('menu')
  const [mode, setMode] = useState('1p')
  const [diff, setDiff] = useState('normal')
  const [target, setTarget] = useState(7)
  const [muted, setMuted] = useState(false)
  const [score, setScore] = useState({ l: 0, r: 0 })
  const [countdown, setCountdown] = useState(0)
  const [winner, setWinner] = useState(null)
  const [stats, setStats] = useState({ bestRally: 0, wins: 0 })

  // load saved stats
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        setStats({ bestRally: s.bestRally || 0, wins: s.wins || 0 })
      }
    } catch {
      /* ignore */
    }
  }, [])

  const persistStats = (updater) =>
    setStats((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })

  const setStatus = useCallback((s) => {
    statusRef.current = s
    setStatusState(s)
  }, [])

  // --- audio -----------------------------------------------------------------
  const ensureAudio = () => {
    if (audioRef.current) {
      if (audioRef.current.state === 'suspended') audioRef.current.resume()
      return
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) audioRef.current = new AC()
    } catch {
      /* ignore */
    }
  }

  const playSound = useCallback((type) => {
    if (mutedRef.current) return
    const ctx = audioRef.current
    if (!ctx) return
    const now = ctx.currentTime
    const tone = (freq, dur, t0 = 0, gain = 0.06, wave = 'triangle') => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = wave
      o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now + t0)
      g.gain.exponentialRampToValueAtTime(gain, now + t0 + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(now + t0)
      o.stop(now + t0 + dur + 0.03)
    }
    if (type === 'hit') tone(520, 0.08, 0, 0.07, 'square')
    else if (type === 'wall') tone(300, 0.06, 0, 0.045, 'sine')
    else if (type === 'score') {
      tone(380, 0.12, 0, 0.06)
      tone(240, 0.16, 0.08, 0.06)
    } else if (type === 'count') tone(660, 0.07, 0, 0.05, 'sine')
    else if (type === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, i * 0.1, 0.06))
    else if (type === 'lose') [392, 330, 262].forEach((f, i) => tone(f, 0.18, i * 0.1, 0.06))
  }, [])

  // --- loop → UI callbacks (stable) ------------------------------------------
  const onCountdown = useCallback((n) => setCountdown(n), [])

  const onPoint = useCallback(
    (gain, rally) => {
      scoreRef.current = { ...scoreRef.current, [gain]: scoreRef.current[gain] + 1 }
      setScore(scoreRef.current)
      persistStats((prev) => (rally > (prev.bestRally || 0) ? { ...prev, bestRally: rally } : prev))

      const s = scoreRef.current
      const tgt = targetRef.current
      if (s.l >= tgt || s.r >= tgt) {
        const w = s.l > s.r ? 'l' : 'r'
        setWinner(w)
        setStatus('gameover')
        playSound(w === 'l' ? 'win' : 'lose')
        if (w === 'l' && modeRef.current === '1p') {
          persistStats((prev) => ({ ...prev, wins: (prev.wins || 0) + 1 }))
        }
      } else {
        setStatus('countdown')
      }
    },
    [setStatus, playSound]
  )

  // --- controls --------------------------------------------------------------
  const start = () => {
    ensureAudio()
    scoreRef.current = { l: 0, r: 0 }
    setScore({ l: 0, r: 0 })
    setWinner(null)
    setCountdown(3)
    resetRef.current += 1
    setStatus('countdown')
  }

  const togglePause = useCallback(() => {
    if (statusRef.current === 'playing') setStatus('paused')
    else if (statusRef.current === 'paused') setStatus('playing')
  }, [setStatus])

  const goMenu = () => setStatus('menu')

  const toggleMute = () => {
    const v = !mutedRef.current
    mutedRef.current = v
    setMuted(v)
  }

  const chooseMode = (m) => {
    modeRef.current = m
    setMode(m)
  }
  const chooseDiff = (d) => {
    diffRef.current = d
    setDiff(d)
  }
  const chooseTarget = (t) => {
    targetRef.current = t
    setTarget(t)
  }

  // auto-pause when the tab is hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && statusRef.current === 'playing') setStatus('paused')
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [setStatus])

  // keyboard
  useEffect(() => {
    const blockKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd']
    const down = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'p' || k === 'escape') {
        e.preventDefault()
        togglePause()
        return
      }
      if (blockKeys.includes(k) && (statusRef.current === 'playing' || statusRef.current === 'countdown')) {
        e.preventDefault()
      }
      keysRef.current.add(k)
    }
    const up = (e) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [togglePause])

  // pointer (mouse + touch) → normalized paddle target
  const handlePointer = (e) => {
    const r = wrapperRef.current?.getBoundingClientRect()
    if (!r) return
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1)
    pointerRef.current = { active: true, x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) }
  }
  const releasePointer = () => {
    pointerRef.current = { ...pointerRef.current, active: false }
  }

  const playing = status === 'playing' || status === 'paused'
  const rightName = mode === '2p' ? 'P2' : 'CPU'
  const leftName = mode === '2p' ? 'P1' : 'You'

  return (
    <div className="rounded-[28px] bg-white ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)] p-3 sm:p-4">
      {/* top bar — scoreboard + controls */}
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl sm:text-4xl leading-none text-grape">{score.l}</div>
            <div className="text-[11px] font-bold text-inksoft mt-0.5">{leftName}</div>
          </div>
          <span className="font-display font-extrabold text-2xl text-inksoft/40">:</span>
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl sm:text-4xl leading-none text-bubblegum">{score.r}</div>
            <div className="text-[11px] font-bold text-inksoft mt-0.5">{rightName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {playing && (
            <button
              type="button"
              onClick={togglePause}
              className="btn3d b-white ring-1 ring-black/5 px-3.5 py-2 text-sm"
              aria-label={status === 'paused' ? 'Resume' : 'Pause'}
            >
              {status === 'paused' ? '▶' : '❚❚'}
            </button>
          )}
          <button
            type="button"
            onClick={toggleMute}
            className="btn3d b-white ring-1 ring-black/5 px-3.5 py-2 text-sm"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* court */}
      <div
        ref={wrapperRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={releasePointer}
        className="relative w-full overflow-hidden rounded-3xl ring-1 ring-black/5"
        style={{ aspectRatio: '16 / 10', touchAction: 'none', background: 'linear-gradient(160deg,#F3EFFF,#FFF6F0)' }}
      >
        <Canvas shadows dpr={DPR} camera={CAMERA} style={{ position: 'absolute', inset: 0 }}>
          <Scene
            statusRef={statusRef}
            modeRef={modeRef}
            diffRef={diffRef}
            scoreRef={scoreRef}
            pointerRef={pointerRef}
            keysRef={keysRef}
            resetRef={resetRef}
            onPoint={onPoint}
            onCountdown={onCountdown}
            setStatus={setStatus}
            playSound={playSound}
          />
        </Canvas>

        {/* overlays */}
        <AnimatePresence>
          {status === 'menu' && (
            <motion.div
              key="menu"
              {...overlayMotion}
              className="absolute inset-0 grid place-items-center bg-ink/35 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ y: 18, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                transition={spring.soft}
                className="w-full max-w-sm rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-2xl text-center"
              >
                <div className="text-5xl">🏓</div>
                <h2 className="mt-2 font-display font-extrabold text-2xl text-ink">3D Ping Pong</h2>
                <p className="mt-1 text-[13px] font-semibold text-inksoft">Move your paddle, rally, and score.</p>

                <div className="mt-5 space-y-4 text-left">
                  <div>
                    <div className="text-[12px] font-extrabold uppercase tracking-wide text-inksoft mb-1.5">Players</div>
                    <Segmented
                      options={[{ value: '1p', label: '1 Player' }, { value: '2p', label: '2 Players' }]}
                      value={mode}
                      onChange={chooseMode}
                    />
                  </div>

                  {mode === '1p' && (
                    <div>
                      <div className="text-[12px] font-extrabold uppercase tracking-wide text-inksoft mb-1.5">CPU difficulty</div>
                      <Segmented
                        options={Object.entries(DIFF).map(([value, d]) => ({ value, label: d.label }))}
                        value={diff}
                        onChange={chooseDiff}
                        color="#FF4D87"
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-[12px] font-extrabold uppercase tracking-wide text-inksoft mb-1.5">Points to win</div>
                    <Segmented
                      options={WIN_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
                      value={target}
                      onChange={chooseTarget}
                      color="#16BFA6"
                    />
                  </div>
                </div>

                <button type="button" onClick={start} className="btn3d b-grape w-full px-6 py-3.5 mt-6 text-lg">
                  ▶ Start game
                </button>

                <p className="mt-3 text-[12px] font-bold text-inksoft">
                  🔥 Best rally: {stats.bestRally} · 🏆 Wins: {stats.wins}
                </p>
              </motion.div>
            </motion.div>
          )}

          {status === 'countdown' && countdown > 0 && (
            <motion.div key="count" {...overlayMotion} className="absolute inset-0 grid place-items-center pointer-events-none">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={spring.bouncy}
                className="font-display font-extrabold text-white drop-shadow-[0_4px_12px_rgba(58,49,66,.5)]"
                style={{ fontSize: 'clamp(64px, 18vw, 140px)' }}
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}

          {status === 'paused' && (
            <motion.div key="paused" {...overlayMotion} className="absolute inset-0 grid place-items-center bg-ink/35 backdrop-blur-sm">
              <motion.div
                initial={{ y: 14, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                transition={spring.soft}
                className="rounded-3xl bg-white px-7 py-6 ring-1 ring-black/5 shadow-2xl text-center"
              >
                <div className="text-4xl">⏸️</div>
                <h2 className="mt-2 font-display font-extrabold text-xl text-ink">Paused</h2>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={togglePause} className="btn3d b-grape px-5 py-3">
                    Resume
                  </button>
                  <button type="button" onClick={goMenu} className="btn3d b-white ring-1 ring-black/5 px-5 py-3">
                    Menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {status === 'gameover' && (
            <motion.div key="over" {...overlayMotion} className="absolute inset-0 grid place-items-center bg-ink/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ y: 18, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                transition={spring.bouncy}
                className="w-full max-w-xs rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-2xl text-center"
              >
                <div className="text-5xl">
                  {mode === '1p' ? (winner === 'l' ? '🏆' : '🤖') : '🏆'}
                </div>
                <h2 className="mt-2 font-display font-extrabold text-2xl text-ink">
                  {mode === '1p'
                    ? winner === 'l'
                      ? 'You win!'
                      : 'CPU wins'
                    : `Player ${winner === 'l' ? '1' : '2'} wins`}
                </h2>
                <p className="mt-1 font-display font-extrabold text-lg">
                  <span className="text-grape">{score.l}</span>
                  <span className="text-inksoft/40"> : </span>
                  <span className="text-bubblegum">{score.r}</span>
                </p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={start} className="btn3d b-grape px-5 py-3 flex-1">
                    Play again
                  </button>
                  <button type="button" onClick={goMenu} className="btn3d b-white ring-1 ring-black/5 px-5 py-3 flex-1">
                    Menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* controls help */}
      <p className="mt-3 px-1 text-center text-[12px] font-semibold text-inksoft">
        {mode === '2p'
          ? 'P1: W A S D · P2: arrow keys · P or Esc to pause'
          : 'Move: mouse / touch / W A S D / arrows · P or Esc to pause'}
      </p>
    </div>
  )
}

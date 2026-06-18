// src/games/_audio/engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Motor de áudio leve, SEM dependências e SEM arquivos externos.
//
// Toda a "trilha sonora" e todos os efeitos são SINTETIZADOS em tempo real com a
// Web Audio API (osciladores + ruído + envelopes). Isso significa:
//   • zero assets binários no bundle (nada de .mp3/.ogg pesados);
//   • nada de licenças/direitos autorais — as melodias são originais;
//   • funciona offline e começa instantaneamente.
//
// Os navegadores bloqueiam áudio até um gesto do usuário (autoplay policy); por
// isso o AudioContext só "destrava" no primeiro toque/clique/tecla — o que é
// natural nos dois jogos (tocar num tile / apertar começar).
// ─────────────────────────────────────────────────────────────────────────────

type Maybe<T> = T | null;

const isBrowser =
  typeof window !== "undefined" && typeof window.AudioContext !== "undefined";

const LS_KEY = "pedagogy.audio.muted.v1";

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}
function writeMuted(m: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, m ? "1" : "0");
  } catch {
    /* private mode / disabled storage — ignore */
  }
}

export type Wave = OscillatorType;

/** Conversão MIDI → frequência (A4 = 69 = 440 Hz). */
export const midi = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

interface ToneOpts {
  freq: number;
  dur?: number;
  type?: Wave;
  gain?: number;
  attack?: number;
  release?: number;
  when?: number; // tempo absoluto do contexto; default = agora
  bus?: Maybe<GainNode>; // default = barramento de SFX
  glideTo?: number; // glissando de pitch até o fim da nota
  detune?: number; // cents
}

interface NoiseOpts {
  dur?: number;
  gain?: number;
  when?: number;
  bus?: Maybe<GainNode>;
  type?: BiquadFilterType;
  freq?: number; // corte inicial do filtro
  freqTo?: number; // corte final (varredura)
  q?: number;
  attack?: number;
  release?: number;
}

class AudioEngine {
  ctx: Maybe<AudioContext> = null;
  master: Maybe<GainNode> = null;
  musicBus: Maybe<GainNode> = null;
  sfxBus: Maybe<GainNode> = null;

  private noiseBuf: Maybe<AudioBuffer> = null;
  private muted = readMuted();
  private listeners = new Set<(m: boolean) => void>();
  private gestureInstalled = false;

  get isMuted(): boolean {
    return this.muted;
  }

  /** Inscreve-se nas mudanças de mudo (para sincronizar o botão da HUD). */
  subscribe(fn: (m: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit(): void {
    this.listeners.forEach((f) => f(this.muted));
  }

  /** Cria (uma vez) o AudioContext e o grafo de barramentos. */
  ensure(): Maybe<AudioContext> {
    if (!isBrowser) return null;
    if (this.ctx) return this.ctx;

    try {
      const AC: typeof AudioContext | undefined =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;

      const ctx = new AC();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(ctx.destination);

      const music = ctx.createGain();
      music.gain.value = 0.5; // trilha um pouco abaixo dos efeitos
      music.connect(master);

      const sfx = ctx.createGain();
      sfx.gain.value = 0.9;
      sfx.connect(master);

      this.master = master;
      this.musicBus = music;
      this.sfxBus = sfx;

      // Buffer de ruído branco (1s) reutilizado por toda a percussão.
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;

      this.installGesture();
      return ctx;
    } catch {
      // Sem áudio disponível — segue sem som, nunca derruba o jogo.
      this.ctx = null;
      return null;
    }
  }

  /** Destrava o contexto no primeiro gesto do usuário (autoplay policy). */
  private installGesture(): void {
    if (this.gestureInstalled || typeof window === "undefined") return;
    this.gestureInstalled = true;
    const unlock = () => this.unlock();
    ["pointerdown", "touchstart", "mousedown", "keydown"].forEach((e) =>
      window.addEventListener(e, unlock, { passive: true }),
    );
  }

  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  }

  setMuted(m: boolean): void {
    this.muted = m;
    writeMuted(m);
    const ctx = this.ctx;
    if (ctx && this.master) {
      const now = ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(m ? 0 : 1, now, 0.02);
    }
    if (!m) this.unlock();
    this.emit();
  }
  toggleMuted(): void {
    this.setMuted(!this.muted);
  }

  now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // ── Primitiva: nota tonal (oscilador + envelope) ──────────────────────────
  tone(o: ToneOpts): void {
    try {
      const ctx = this.ensure();
      if (!ctx) return;
      const bus = o.bus ?? this.sfxBus;
      if (!bus) return;

      const t0 = o.when ?? ctx.currentTime;
      const dur = o.dur ?? 0.2;
      const attack = Math.max(0.001, o.attack ?? 0.005);
      const release = Math.max(0.02, o.release ?? Math.min(0.25, dur));
      const peak = Math.max(0.0002, o.gain ?? 0.3);

      const osc = ctx.createOscillator();
      osc.type = o.type ?? "sine";
      osc.frequency.setValueAtTime(o.freq, t0);
      if (o.glideTo)
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, o.glideTo),
          t0 + dur,
        );
      if (o.detune) osc.detune.setValueAtTime(o.detune, t0);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

      osc.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + dur + release + 0.05);
    } catch {
      /* áudio nunca deve derrubar a lógica do jogo */
    }
  }

  // ── Primitiva: ruído filtrado (percussão / água / whoosh) ─────────────────
  noise(o: NoiseOpts = {}): void {
    try {
      const ctx = this.ensure();
      if (!ctx || !this.noiseBuf) return;
      const bus = o.bus ?? this.sfxBus;
      if (!bus) return;

      const t0 = o.when ?? ctx.currentTime;
      const dur = o.dur ?? 0.12;

      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;

      const filt = ctx.createBiquadFilter();
      filt.type = o.type ?? "bandpass";
      filt.frequency.setValueAtTime(o.freq ?? 1200, t0);
      if (o.freqTo)
        filt.frequency.exponentialRampToValueAtTime(
          Math.max(40, o.freqTo),
          t0 + dur,
        );
      filt.Q.value = o.q ?? 0.8;

      const g = ctx.createGain();
      const peak = Math.max(0.0002, o.gain ?? 0.3);
      const attack = Math.max(0.001, o.attack ?? 0.002);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + (o.release ?? 0.02));

      src.connect(filt);
      filt.connect(g);
      g.connect(bus);
      src.start(t0);
      src.stop(t0 + dur + 0.05);
    } catch {
      /* áudio nunca deve derrubar a lógica do jogo */
    }
  }
}

export const engine = new AudioEngine();

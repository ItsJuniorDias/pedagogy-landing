// src/games/_audio/music.ts
// ─────────────────────────────────────────────────────────────────────────────
// Trilha sonora generativa: um pequeno sequenciador que toca melodias ORIGINAIS
// em loop, sintetizadas em tempo real. Duas faixas:
//
//   • "farm" — pastoral, calma, em Dó maior (I–V–vi–IV): pad suave, arpejo
//              cristalino, baixo macio e percussão delicada. Vida de fazenda.
//   • "pong" — synthwave de arcade em Lá menor (i–VI–III–VII): baixo pulsante,
//              bumbo "four-on-the-floor", chimbal e um lead saw grudento.
//
// Usa um agendador com look-ahead (padrão Web Audio): a cada 25ms agenda as
// notas dos próximos 100ms com precisão de amostra, então não trava nem
// desafina mesmo se a aba perder o foco.
// ─────────────────────────────────────────────────────────────────────────────

import { engine, midi } from "./engine";

export type TrackId = "farm" | "pong";

// 4 compassos × 16 semicolcheias = 64 passos por loop.
const STEPS = 64;

// Acordes (raiz/terça/quinta em MIDI) por compasso.
const FARM_CHORDS: number[][] = [
  [48, 52, 55], // C
  [43, 47, 50], // G
  [45, 48, 52], // Am
  [41, 45, 48], // F
];
const PONG_ROOTS = [45, 41, 48, 43]; // Am, F, C, G (raízes)

// Riff do lead do Pong (passo → nota MIDI; ausência = silêncio).
const PONG_LEAD: Record<number, number> = {
  // compasso 1 (Am)
  0: 69, 4: 72, 8: 76, 11: 74, 14: 72,
  // compasso 2 (F)
  16: 65, 20: 69, 24: 72, 28: 69,
  // compasso 3 (C)
  32: 67, 36: 72, 40: 76, 43: 79, 46: 76,
  // compasso 4 (G)
  48: 74, 52: 71, 56: 67, 59: 71, 62: 74,
};

class MusicPlayer {
  private timer: ReturnType<typeof setInterval> | null = null;
  private current: TrackId | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private bpm = 100;
  private readonly stepsPerBeat = 4; // semicolcheias
  private readonly lookahead = 0.1; // s agendados à frente
  private readonly intervalMs = 25;

  get track(): TrackId | null {
    return this.current;
  }

  start(track: TrackId): void {
    const ctx = engine.ensure();
    if (!ctx) return;
    if (this.current === track && this.timer) return; // já tocando essa faixa

    this.stop();
    this.current = track;
    this.step = 0;
    this.bpm = track === "pong" ? 132 : 96;
    this.nextNoteTime = ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.scheduler(), this.intervalMs);
    engine.unlock();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.current = null;
  }

  private secPerStep(): number {
    return 60 / this.bpm / this.stepsPerBeat;
  }

  private scheduler(): void {
    try {
      const ctx = engine.ensure();
      if (!ctx || !this.current) return;

      // Se o contexto ainda não destravou (gesto) ou a aba perdeu foco, segura a
      // posição para a faixa retomar em fase quando voltar a tocar.
      if (ctx.state !== "running") {
        this.nextNoteTime = ctx.currentTime + 0.08;
        return;
      }

      while (this.nextNoteTime < ctx.currentTime + this.lookahead) {
        if (this.current === "farm") this.farmStep(this.step, this.nextNoteTime);
        else this.pongStep(this.step, this.nextNoteTime);
        this.nextNoteTime += this.secPerStep();
        this.step = (this.step + 1) % STEPS;
      }
    } catch {
      /* trilha nunca deve derrubar nada — apenas para de agendar este tick */
    }
  }

  // ── FARM ────────────────────────────────────────────────────────────────
  private farmStep(step: number, when: number): void {
    const bus = engine.musicBus;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const chord = FARM_CHORDS[bar];

    // Pad suave: acorde sustentado no início de cada compasso.
    if (inBar === 0) {
      chord.forEach((n) =>
        engine.tone({
          freq: midi(n),
          type: "triangle",
          dur: 1.7,
          gain: 0.05,
          attack: 0.4,
          release: 0.6,
          when,
          bus,
        }),
      );
    }

    // Baixo macio na 1ª e na 3ª batida.
    if (inBar === 0 || inBar === 8) {
      engine.tone({
        freq: midi(chord[0] - 12),
        type: "sine",
        dur: 0.5,
        gain: 0.12,
        attack: 0.01,
        when,
        bus,
      });
    }

    // Arpejo cristalino em colcheias (sobe o acorde uma oitava acima).
    if (inBar % 2 === 0) {
      const seq = [0, 1, 2, 1];
      const note = chord[seq[(inBar / 2) % 4]] + 12;
      engine.tone({
        freq: midi(note),
        type: "sine",
        dur: 0.22,
        gain: 0.055,
        attack: 0.005,
        when,
        bus,
      });
    }

    // Percussão delicada: bumbo macio (1 e 3) + chacoalho leve nos contratempos.
    if (inBar === 0 || inBar === 8) {
      engine.noise({
        type: "lowpass",
        freq: 220,
        freqTo: 70,
        dur: 0.14,
        gain: 0.1,
        when,
        bus,
      });
    }
    if (inBar % 4 === 2) {
      engine.noise({
        type: "highpass",
        freq: 5000,
        dur: 0.04,
        gain: 0.025,
        when,
        bus,
      });
    }
  }

  // ── PONG ────────────────────────────────────────────────────────────────
  private pongStep(step: number, when: number): void {
    const bus = engine.musicBus;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const root = PONG_ROOTS[bar];

    // Bumbo four-on-the-floor.
    if (inBar % 4 === 0) {
      engine.tone({
        freq: midi(36),
        glideTo: midi(24),
        type: "sine",
        dur: 0.14,
        gain: 0.18,
        attack: 0.002,
        when,
        bus,
      });
    }
    // Chimbal nos contratempos.
    if (inBar % 4 === 2) {
      engine.noise({
        type: "highpass",
        freq: 7000,
        dur: 0.03,
        gain: 0.05,
        when,
        bus,
      });
    }
    // Baixo pulsante em colcheias (raiz grave, com oitava sincopada).
    if (inBar % 2 === 0) {
      const oct = inBar % 8 === 6 ? 0 : -12; // pulinho de oitava p/ groove
      engine.tone({
        freq: midi(root - 12 + (oct === 0 ? 12 : 0)),
        type: "sawtooth",
        dur: 0.16,
        gain: 0.1,
        attack: 0.004,
        when,
        bus,
      });
    }
    // Lead saw grudento (com leve "voz dupla" desafinada para encorpar).
    const lead = PONG_LEAD[step];
    if (lead) {
      engine.tone({
        freq: midi(lead),
        type: "sawtooth",
        dur: 0.2,
        gain: 0.09,
        attack: 0.005,
        when,
        bus,
      });
      engine.tone({
        freq: midi(lead),
        type: "square",
        dur: 0.2,
        gain: 0.04,
        detune: 8,
        when,
        bus,
      });
    }
  }
}

export const music = new MusicPlayer();

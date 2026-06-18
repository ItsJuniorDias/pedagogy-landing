// src/games/_audio/sfx.ts
// ─────────────────────────────────────────────────────────────────────────────
// Efeitos sonoros sintetizados — um "blip" curto para cada ação dos jogos.
// Tudo construído com as primitivas tone()/noise() do engine. Nada de arquivos.
// ─────────────────────────────────────────────────────────────────────────────

import { engine, midi } from "./engine";

const SFX = engine.sfxBus; // resolvido em runtime via engine.ensure()

/** Pequena ajuda: agenda uma nota daqui a `delay` segundos. */
function at(delay: number): number {
  return engine.now() + delay;
}

export const sfx = {
  // ── UI / genéricos ────────────────────────────────────────────────────────
  tap() {
    engine.tone({ freq: midi(84), type: "triangle", dur: 0.05, gain: 0.14 });
  },
  blocked() {
    // "nope" suave e descendente
    engine.tone({
      freq: midi(58),
      glideTo: midi(52),
      type: "square",
      dur: 0.12,
      gain: 0.12,
    });
  },
  error() {
    engine.tone({ freq: midi(50), type: "sawtooth", dur: 0.18, gain: 0.14 });
    engine.tone({
      freq: midi(49),
      type: "sawtooth",
      dur: 0.18,
      gain: 0.1,
      when: at(0.02),
    });
  },

  // ── FARM ──────────────────────────────────────────────────────────────────
  /** Cavar/arar a terra: baque terroso. */
  till() {
    engine.tone({
      freq: midi(46),
      glideTo: midi(38),
      type: "sine",
      dur: 0.14,
      gain: 0.22,
    });
    engine.noise({ freq: 600, freqTo: 180, dur: 0.13, gain: 0.16, q: 0.6 });
  },
  /** Plantar a semente: "pop" curtinho subindo. */
  plant() {
    engine.tone({
      freq: midi(64),
      glideTo: midi(76),
      type: "triangle",
      dur: 0.1,
      gain: 0.18,
    });
  },
  /** Regar: gotinha de água (varredura de ruído + ploc). */
  water() {
    engine.noise({
      type: "lowpass",
      freq: 2600,
      freqTo: 600,
      dur: 0.16,
      gain: 0.14,
      q: 1.2,
    });
    engine.tone({
      freq: midi(79),
      glideTo: midi(70),
      type: "sine",
      dur: 0.12,
      gain: 0.12,
      when: at(0.02),
    });
  },
  /** Colher: carrilhão alegre (terça maior). */
  harvest() {
    engine.tone({ freq: midi(72), type: "triangle", dur: 0.16, gain: 0.2 });
    engine.tone({
      freq: midi(76),
      type: "triangle",
      dur: 0.18,
      gain: 0.18,
      when: at(0.06),
    });
    engine.tone({
      freq: midi(79),
      type: "sine",
      dur: 0.22,
      gain: 0.16,
      when: at(0.12),
    });
  },
  /** Moedas (clássico "blip-blip" ascendente). */
  coin() {
    engine.tone({ freq: midi(83), type: "square", dur: 0.07, gain: 0.16 });
    engine.tone({
      freq: midi(88),
      type: "square",
      dur: 0.12,
      gain: 0.16,
      when: at(0.07),
    });
  },
  /** Comprar estrutura: acorde de confirmação. */
  build() {
    [60, 64, 67, 72].forEach((n, i) =>
      engine.tone({
        freq: midi(n),
        type: "triangle",
        dur: 0.2,
        gain: 0.16,
        when: at(i * 0.05),
      }),
    );
  },
  /** Novo dia: nascer do sol — varredura quente subindo. */
  nextDay() {
    engine.tone({
      freq: midi(55),
      glideTo: midi(67),
      type: "sine",
      dur: 0.5,
      gain: 0.16,
      attack: 0.08,
    });
    engine.tone({
      freq: midi(67),
      glideTo: midi(74),
      type: "triangle",
      dur: 0.5,
      gain: 0.1,
      attack: 0.12,
      when: at(0.1),
    });
  },
  /** Subiu de nível: arpejo triunfante. */
  levelUp() {
    [60, 64, 67, 72, 76].forEach((n, i) =>
      engine.tone({
        freq: midi(n),
        type: "square",
        dur: 0.16,
        gain: 0.16,
        when: at(i * 0.08),
      }),
    );
  },

  // ── PONG ──────────────────────────────────────────────────────────────────
  /** Saque: bip curto de "atenção". */
  serve() {
    engine.tone({ freq: midi(81), type: "triangle", dur: 0.08, gain: 0.12 });
  },
  /**
   * Rebatida da raquete. `isPlayer` muda o timbre/altura (você é mais agudo);
   * `spin` (0..1) deixa o "pock" mais brilhante quando há corte forte.
   */
  paddle(isPlayer = false, spin = 0) {
    const base = isPlayer ? 79 : 67;
    const f = midi(base + Math.min(7, spin * 7));
    engine.tone({
      freq: f,
      glideTo: f * 0.78,
      type: "square",
      dur: 0.06,
      gain: 0.2,
    });
    engine.noise({ freq: 2200, freqTo: 800, dur: 0.04, gain: 0.1, q: 1.5 });
  },
  /** Bola na parede de vidro: tique seco. */
  wall() {
    engine.tone({
      freq: midi(72),
      glideTo: midi(60),
      type: "triangle",
      dur: 0.05,
      gain: 0.12,
    });
  },
  /** Corte com efeito: whoosh. */
  spin() {
    engine.noise({
      type: "bandpass",
      freq: 500,
      freqTo: 2400,
      dur: 0.22,
      gain: 0.12,
      q: 0.7,
    });
  },
  /** Ponto do jogador: dois tons subindo. */
  scorePlayer() {
    engine.tone({ freq: midi(72), type: "square", dur: 0.1, gain: 0.16 });
    engine.tone({
      freq: midi(79),
      type: "square",
      dur: 0.16,
      gain: 0.16,
      when: at(0.1),
    });
  },
  /** Ponto da CPU: dois tons descendo. */
  scoreCpu() {
    engine.tone({ freq: midi(64), type: "sawtooth", dur: 0.1, gain: 0.14 });
    engine.tone({
      freq: midi(57),
      type: "sawtooth",
      dur: 0.18,
      gain: 0.14,
      when: at(0.1),
    });
  },
  /** Vitória: fanfarra ascendente. */
  win() {
    [60, 64, 67, 72, 76, 79].forEach((n, i) =>
      engine.tone({
        freq: midi(n),
        type: "square",
        dur: 0.18,
        gain: 0.17,
        when: at(i * 0.09),
      }),
    );
  },
  /** Derrota: descida triste. */
  lose() {
    [67, 63, 60, 55].forEach((n, i) =>
      engine.tone({
        freq: midi(n),
        type: "sawtooth",
        dur: 0.24,
        gain: 0.15,
        when: at(i * 0.12),
      }),
    );
  },
};

// Evita "unused import" caso a tree-shaking remova SFX em algum build.
void SFX;

export type Sfx = typeof sfx;

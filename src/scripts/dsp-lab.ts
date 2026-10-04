// Bench-test lab: a playable Web Audio model of the nBase2 signal chain.
//
//   synth bus → 3-band EQ → stereo widening (mid/side matrix) ─┬─────────────────────────────→ out
//                                                              └→ [AA low-pass] → ÷N sample-hold → reconstruction LPF ┘
//
// Draws the combined frequency response over a live spectrum, plus a goniometer
// for the stereo field. Audio only starts on a user gesture.

import { BUTTERWORTH_4, coefficients, magnitudeDb, type Band, type Coefficients } from '../lib/biquad';

type SwitchId = 'eq' | 'widen' | 'src' | 'aa';

interface State {
  bands: Band[];
  eq: boolean;
  widen: boolean;
  src: boolean;
  aa: boolean;
  width: number; // 0 = mono, 1 = untouched, 2 = side doubled
  playing: boolean;
  focus: number;
}

interface Engine {
  ctx: AudioContext;
  bus: GainNode;
  eq: BiquadFilterNode[];
  lToL: GainNode;
  rToL: GainNode;
  lToR: GainNode;
  rToR: GainNode;
  direct: GainNode;
  viaSrc: GainNode;
  aaOn: GainNode;
  aaOff: GainNode;
  master: GainNode;
  spectrum: AnalyserNode;
  left: AnalyserNode;
  right: AnalyserNode;
  factor: number;
  nyquist: number;
  noise: AudioBuffer;
}

const F_MIN = 20;
const F_MAX = 20000;
const G_MAX = 12;
const SRC_TARGET = 16000; // Bluetooth wideband speech (mSBC) runs at 16 kHz
const DISPLAY_RATE = 48000;
const MASTER_LEVEL = 0.5;
const PAD = { l: 36, r: 12, t: 26, b: 22 };

const BAND_NAMES = ['Low shelf', 'Peak', 'High shelf'];
const BAND_LIMITS: [number, number][] = [
  [30, 600],
  [150, 8000],
  [1500, 16000],
];
const DEFAULT_BANDS: Band[] = [
  { type: 'lowshelf', freq: 120, gain: 4, q: Math.SQRT1_2 },
  { type: 'peaking', freq: 1000, gain: -2, q: 1 },
  { type: 'highshelf', freq: 5000, gain: 3, q: Math.SQRT1_2 },
];

// Sample-and-hold decimator: keeps every Nth sample. Without a low-pass in front
// of it, anything above the new Nyquist folds back as aliasing.
const DECIMATOR_SOURCE = `
class SampleHoldDecimator extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.factor = (options.processorOptions && options.processorOptions.factor) || 3;
    this.phase = 0;
    this.held = [0, 0];
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    const frames = output[0].length;
    for (let ch = 0; ch < output.length; ch++) {
      const src = input[ch] || input[0];
      const dst = output[ch];
      if (!src) { dst.fill(0); continue; }
      let held = this.held[ch] || 0;
      let phase = this.phase;
      for (let i = 0; i < frames; i++) {
        if (phase === 0) held = src[i];
        dst[i] = held;
        phase = phase + 1 === this.factor ? 0 : phase + 1;
      }
      this.held[ch] = held;
    }
    this.phase = (this.phase + frames) % this.factor;
    return true;
  }
}
registerProcessor('sample-hold-decimator', SampleHoldDecimator);
`;

const srcFactor = (rate: number) => Math.max(2, Math.round(rate / SRC_TARGET));

function lowpassPair(ctx: AudioContext, freq: number) {
  const [a, b] = BUTTERWORTH_4.map((q) => {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    f.Q.value = 20 * Math.log10(q); // Web Audio's low-pass Q is in dB
    return f;
  });
  a.connect(b);
  return { input: a, output: b };
}

async function buildEngine(ctx: AudioContext): Promise<Engine> {
  const factor = srcFactor(ctx.sampleRate);
  const nyquist = ctx.sampleRate / factor / 2;

  const bus = ctx.createGain();
  const eq = DEFAULT_BANDS.map((b) => {
    const f = ctx.createBiquadFilter();
    f.type = b.type;
    f.frequency.value = b.freq;
    f.Q.value = b.q;
    f.gain.value = b.gain;
    return f;
  });
  bus.connect(eq[0]).connect(eq[1]).connect(eq[2]);

  // Stereo width: L' = aL + bR, R' = bL + aR with a = (1 + w) / 2, b = (1 - w) / 2,
  // which is mid/side processing with the side signal scaled by w.
  const split = ctx.createChannelSplitter(2);
  const merge = ctx.createChannelMerger(2);
  const [lToL, rToL, lToR, rToR] = [0, 1, 2, 3].map(() => ctx.createGain());
  eq[2].connect(split);
  split.connect(lToL, 0);
  split.connect(lToR, 0);
  split.connect(rToL, 1);
  split.connect(rToR, 1);
  lToL.connect(merge, 0, 0);
  rToL.connect(merge, 0, 0);
  lToR.connect(merge, 0, 1);
  rToR.connect(merge, 0, 1);

  // Direct path, or sample-rate conversion with a switchable anti-aliasing filter.
  const direct = ctx.createGain();
  const viaSrc = ctx.createGain();
  const aaOn = ctx.createGain();
  const aaOff = ctx.createGain();
  viaSrc.gain.value = 0;
  aaOff.gain.value = 0;
  merge.connect(direct);
  const aa = lowpassPair(ctx, nyquist * 0.85);
  merge.connect(aa.input);
  aa.output.connect(aaOn);
  merge.connect(aaOff);

  let decimator: AudioNode;
  try {
    const url = URL.createObjectURL(new Blob([DECIMATOR_SOURCE], { type: 'application/javascript' }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    decimator = new AudioWorkletNode(ctx, 'sample-hold-decimator', {
      outputChannelCount: [2],
      processorOptions: { factor },
    });
  } catch {
    decimator = ctx.createGain(); // no AudioWorklet: the SRC switch only band-limits
  }
  aaOn.connect(decimator);
  aaOff.connect(decimator);
  const recon = lowpassPair(ctx, nyquist * 0.9);
  decimator.connect(recon.input);
  recon.output.connect(viaSrc);

  const master = ctx.createGain();
  master.gain.value = 0;
  direct.connect(master);
  viaSrc.connect(master);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(ctx.destination);

  const spectrum = ctx.createAnalyser();
  spectrum.fftSize = 4096;
  spectrum.smoothingTimeConstant = 0.8;
  spectrum.minDecibels = -100;
  spectrum.maxDecibels = -20;
  limiter.connect(spectrum);
  const tap = ctx.createChannelSplitter(2);
  limiter.connect(tap);
  const left = ctx.createAnalyser();
  const right = ctx.createAnalyser();
  left.fftSize = 1024;
  right.fftSize = 1024;
  tap.connect(left, 0);
  tap.connect(right, 1);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  return { ctx, bus, eq, lToL, rToL, lToR, rToR, direct, viaSrc, aaOn, aaOff, master, spectrum, left, right, factor, nyquist, noise };
}

// A four-bar loop (Am – F – C – G) with a wide pad, panned arpeggio, bass, kick,
// snare and hats: bright enough to hear the EQ and aliasing, wide enough to hear the widener.
const BPM = 96;
const STEP = 60 / BPM / 4;
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
const ARP = [0, 1, 2, 1, 2, 1, 0, 2];
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

interface ToneOptions {
  peak: number;
  attack: number;
  decay: number;
  cutoff?: number;
  detune?: number;
  pan?: number;
}

function createSequencer(e: Engine) {
  const { ctx, bus, noise } = e;
  let step = 0;
  let next = 0;
  let timer = 0;

  const out = (node: AudioNode, pan = 0) => {
    if (pan && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p).connect(bus);
    } else {
      node.connect(bus);
    }
  };

  const envelope = (t: number, peak: number, attack: number, decay: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  };

  const tone = (t: number, type: OscillatorType, freq: number, o: ToneOptions) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = o.detune ?? 0;
    const amp = envelope(t, o.peak, o.attack, o.decay);
    if (o.cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.cutoff;
      f.Q.value = 0;
      osc.connect(f).connect(amp);
    } else {
      osc.connect(amp);
    }
    out(amp, o.pan);
    osc.start(t);
    osc.stop(t + o.attack + o.decay + 0.05);
  };

  const kick = (t: number) => {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const amp = envelope(t, 0.65, 0.002, 0.3);
    osc.connect(amp);
    out(amp);
    osc.start(t);
    osc.stop(t + 0.36);
  };

  const burst = (t: number, type: BiquadFilterType, freq: number, q: number, peak: number, decay: number, pan = 0) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const amp = envelope(t, peak, 0.001, decay);
    src.connect(f).connect(amp);
    out(amp, pan);
    src.start(t, Math.random() * 0.8, decay + 0.05);
  };

  const schedule = (s: number, t: number) => {
    const pos = s % 16;
    const chord = CHORDS[Math.floor(s / 16) % CHORDS.length];
    if (pos === 0 || pos === 8) kick(t);
    if (pos === 4 || pos === 12) burst(t, 'bandpass', 1800, 0.9, 0.32, 0.16);
    if (pos % 2 === 0) burst(t, 'highpass', 7500, 0.7, pos % 4 === 2 ? 0.12 : 0.06, 0.045, pos % 4 === 2 ? 0.6 : -0.6);
    if (pos === 0) {
      // Detuned pair per note, hard-panned: most of the side (L−R) signal comes from here.
      for (const n of chord) {
        tone(t, 'sawtooth', mtof(n), { peak: 0.05, attack: 0.3, decay: STEP * 15, cutoff: 1800, detune: -12, pan: -0.95 });
        tone(t, 'sawtooth', mtof(n), { peak: 0.05, attack: 0.3, decay: STEP * 15, cutoff: 1800, detune: 12, pan: 0.95 });
      }
    }
    if (pos === 0 || pos === 6 || pos === 10) {
      tone(t, 'triangle', mtof(chord[0] - 12), { peak: 0.26, attack: 0.008, decay: STEP * (pos === 0 ? 5.5 : 3.5) });
    }
    tone(t, 'sawtooth', mtof(chord[ARP[pos % ARP.length]] + 12), {
      peak: 0.075,
      attack: 0.004,
      decay: 0.2,
      cutoff: 6500,
      pan: pos % 2 ? 0.8 : -0.8,
    });
  };

  const tick = () => {
    while (next < ctx.currentTime + 0.12) {
      schedule(step, next);
      next += STEP;
      step = (step + 1) % (16 * CHORDS.length);
    }
  };

  return {
    start() {
      step = 0;
      next = ctx.currentTime + 0.06;
      tick();
      timer = window.setInterval(tick, 25);
    },
    stop() {
      window.clearInterval(timer);
    },
  };
}

const fmtFreq = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)} kHz` : `${Math.round(f)} Hz`);
const fmtGain = (g: number) => `${g > 0.05 ? '+' : g < -0.05 ? '−' : '±'}${Math.abs(g).toFixed(1)} dB`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function line(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function fit(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const g = canvas.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w: rect.width, h: rect.height };
}

function initLab(root: HTMLElement) {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const scope = $<HTMLCanvasElement>('[data-lab-scope]');
  const gonio = $<HTMLCanvasElement>('[data-lab-gonio]');
  const handles = [...root.querySelectorAll<HTMLButtonElement>('[data-lab-handle]')];
  const playBtn = $<HTMLButtonElement>('[data-lab-play]');
  const playLabel = $<HTMLElement>('[data-lab-play-label]');
  const switches = [...root.querySelectorAll<HTMLButtonElement>('[data-lab-switch]')];
  const widthInput = $<HTMLInputElement>('[data-lab-width]');
  const widthOut = $<HTMLOutputElement>('[data-lab-width-out]');
  const readout = $<HTMLElement>('[data-lab-readout]');
  const corr = $<HTMLElement>('[data-lab-corr]');
  const statusEl = $<HTMLElement>('[data-lab-status]');
  const rateNote = $<HTMLElement>('[data-lab-rate]');
  const chainFigure = document.querySelector<HTMLElement>('[data-chain-figure]');

  const css = getComputedStyle(root);
  const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const C = {
    bg: color('--scr-bg', '#111114'),
    grid: color('--scr-grid', 'rgba(255,255,255,0.06)'),
    axis: color('--scr-axis', 'rgba(255,255,255,0.16)'),
    text: color('--scr-text', 'rgba(236,234,228,0.5)'),
    trace: color('--scr-trace', '#f0a35e'),
    wash: color('--scr-wash', 'rgba(240,163,94,0.16)'),
    dim: color('--scr-dim', 'rgba(236,234,228,0.32)'),
    fade: color('--scr-fade', 'rgba(17,17,20,0.3)'),
    hatch: color('--scr-hatch', 'rgba(240,163,94,0.3)'),
  };
  const FONT = '10px "IBM Plex Mono", ui-monospace, monospace';

  const state: State = {
    bands: DEFAULT_BANDS.map((b) => ({ ...b })),
    eq: true,
    widen: true,
    src: false,
    aa: true,
    width: Number(widthInput.value) / 100,
    playing: false,
    focus: 1,
  };

  let ctx: AudioContext | null = null;
  let engine: Engine | null = null;
  let sequencer: ReturnType<typeof createSequencer> | null = null;
  let starting = false;
  let raf = 0;
  let dragging = -1;
  let visible = false;
  let agc = 0.3;
  let frame = 0;

  const freqBuf = new Float32Array(2048);
  const bufL = new Float32Array(1024);
  const bufR = new Float32Array(1024);

  // ---- frequency response ------------------------------------------------
  const rate = () => engine?.ctx.sampleRate ?? DISPLAY_RATE;
  const nyquist = () => engine?.nyquist ?? DISPLAY_RATE / srcFactor(DISPLAY_RATE) / 2;
  let eqCoeffs: Coefficients[] = [];
  let srcCoeffs: Coefficients[] = [];

  const recompute = () => {
    eqCoeffs = state.bands.map((b) => coefficients(b, rate()));
    const lp = (freq: number) => BUTTERWORTH_4.map((q) => coefficients({ type: 'lowpass', freq, gain: 0, q }, rate()));
    srcCoeffs = state.src ? [...lp(nyquist() * 0.9), ...(state.aa ? lp(nyquist() * 0.85) : [])] : [];
  };

  const responseDb = (f: number) => {
    let db = 0;
    if (state.eq) for (const c of eqCoeffs) db += magnitudeDb(c, f, rate());
    for (const c of srcCoeffs) db += magnitudeDb(c, f, rate());
    return db;
  };

  // ---- plot geometry -----------------------------------------------------
  const geo = { L: PAD.l, R: 300, T: PAD.t, B: 200 };
  const xOf = (f: number) => geo.L + (Math.log10(f / F_MIN) / Math.log10(F_MAX / F_MIN)) * (geo.R - geo.L);
  const fOf = (x: number) => F_MIN * (F_MAX / F_MIN) ** ((x - geo.L) / (geo.R - geo.L));
  const yOf = (db: number) => geo.T + (1 - (db + G_MAX) / (2 * G_MAX)) * (geo.B - geo.T);
  const gOf = (y: number) => (1 - (y - geo.T) / (geo.B - geo.T)) * 2 * G_MAX - G_MAX;

  function drawScope() {
    const { g, w, h } = fit(scope);
    geo.R = w - PAD.r;
    geo.B = h - PAD.b;
    const { L, R, T, B } = geo;

    g.fillStyle = C.bg;
    g.fillRect(0, 0, w, h);

    // Log-frequency grid
    g.lineWidth = 1;
    for (let decade = 10; decade < F_MAX; decade *= 10) {
      for (let m = 1; m < 10; m++) {
        const f = decade * m;
        if (f < F_MIN || f > F_MAX) continue;
        g.strokeStyle = m === 1 ? C.axis : C.grid;
        const x = Math.round(xOf(f)) + 0.5;
        line(g, x, T, x, B);
      }
    }
    for (const db of [-12, -6, 0, 6, 12]) {
      g.strokeStyle = db === 0 ? C.axis : C.grid;
      const y = Math.round(yOf(db)) + 0.5;
      line(g, L, y, R, y);
    }

    g.font = FONT;
    g.fillStyle = C.text;
    g.textBaseline = 'alphabetic';
    g.textAlign = 'center';
    for (const [f, label] of [
      [100, '100'],
      [1000, '1k'],
      [10000, '10k'],
    ] as const) {
      g.fillText(label, xOf(f), B + 15);
    }
    g.textAlign = 'left';
    g.fillText('20 Hz', L, B + 15);
    g.textAlign = 'right';
    g.fillText('20k', R, B + 15);
    g.textBaseline = 'middle';
    for (const db of [-12, 0, 12]) g.fillText(`${db > 0 ? '+' : ''}${db}`, L - 6, yOf(db));

    // Above the post-SRC Nyquist: either filtered out first, or folded back as aliasing.
    if (state.src) {
      const x = xOf(nyquist());
      g.save();
      g.beginPath();
      g.rect(x, T, R - x, B - T);
      g.clip();
      g.strokeStyle = state.aa ? C.grid : C.hatch;
      for (let i = x - (B - T); i < R; i += 7) line(g, i, B, i + (B - T), T);
      g.restore();
      g.setLineDash([3, 3]);
      g.strokeStyle = C.trace;
      line(g, Math.round(x) + 0.5, T, Math.round(x) + 0.5, B);
      g.setLineDash([]);
      g.fillStyle = C.text;
      g.textAlign = 'right';
      g.textBaseline = 'top';
      g.fillText(state.aa ? 'fs/2 · filtered' : 'fs/2 · aliasing', x - 6, T + 4);
    }

    g.save();
    g.beginPath();
    g.rect(L, T, R - L, B - T);
    g.clip();

    // Live spectrum
    if (state.playing && engine) {
      const { spectrum, ctx: actx } = engine;
      spectrum.getFloatFrequencyData(freqBuf);
      const binHz = actx.sampleRate / spectrum.fftSize;
      const lo = spectrum.minDecibels;
      const hi = spectrum.maxDecibels;
      const at = (i: number) => (Number.isFinite(freqBuf[i]) ? freqBuf[i] : lo);
      g.beginPath();
      g.moveTo(L, B);
      for (let x = L; x <= R; x += 2) {
        const bin = fOf(x) / binHz;
        const i = Math.floor(bin);
        const v = at(i) + (at(i + 1) - at(i)) * (bin - i);
        g.lineTo(x, B - clamp((v - lo) / (hi - lo), 0, 1) * (B - T));
      }
      g.lineTo(R, B);
      g.closePath();
      g.fillStyle = C.wash;
      g.fill();
    }

    // Response curve, washed toward 0 dB
    const pts: [number, number][] = [];
    for (let x = L; x <= R; x += 1.5) pts.push([x, yOf(clamp(responseDb(fOf(x)), -G_MAX - 3, G_MAX + 3))]);
    const zero = yOf(0);
    g.beginPath();
    g.moveTo(L, zero);
    for (const [x, y] of pts) g.lineTo(x, y);
    g.lineTo(R, zero);
    g.closePath();
    g.fillStyle = C.wash;
    g.fill();

    const bypassed = !state.eq && !state.src;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = bypassed ? C.dim : C.trace;
    g.lineWidth = 2;
    g.lineJoin = 'round';
    g.setLineDash(bypassed ? [4, 4] : []);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  function drawGonioAxes(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    const d = r * Math.SQRT1_2;
    g.lineWidth = 1;
    g.strokeStyle = C.grid;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    line(g, cx - d, cy - d, cx + d, cy + d);
    line(g, cx + d, cy - d, cx - d, cy + d);
    line(g, cx - r, cy, cx + r, cy);
    g.strokeStyle = C.axis;
    line(g, cx, cy - r, cx, cy + r);
    g.font = FONT;
    g.fillStyle = C.text;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('M', cx, cy - r - 8);
    g.fillText('L', cx - d - 7, cy - d - 7);
    g.fillText('R', cx + d + 7, cy - d - 7);
    g.fillText('S', cx + r + 8, cy);
  }

  function drawGonio() {
    const { g, w, h } = fit(gonio);
    const cx = w / 2;
    const cy = h / 2 + 6;
    const r = Math.max(10, Math.min(w, h) / 2 - 20);

    if (!state.playing || !engine) {
      g.fillStyle = C.bg;
      g.fillRect(0, 0, w, h);
      drawGonioAxes(g, cx, cy, r);
      g.fillStyle = C.text;
      g.fillText('no signal', cx, cy + r * 0.5);
      corr.textContent = '—';
      return;
    }

    // Phosphor persistence: fade the last frame instead of clearing it.
    g.fillStyle = C.fade;
    g.fillRect(0, 0, w, h);
    drawGonioAxes(g, cx, cy, r);

    engine.left.getFloatTimeDomainData(bufL);
    engine.right.getFloatTimeDomainData(bufR);
    let peak = 0;
    let lr = 0;
    let ll = 0;
    let rr = 0;
    for (let i = 0; i < bufL.length; i++) {
      const l = bufL[i];
      const rv = bufR[i];
      peak = Math.max(peak, Math.abs(l), Math.abs(rv));
      lr += l * rv;
      ll += l * l;
      rr += rv * rv;
    }
    agc += (Math.max(peak, 0.02) - agc) * 0.08;
    const k = (r * 0.9) / (agc * Math.SQRT2);
    g.fillStyle = C.trace;
    g.globalAlpha = 0.55;
    for (let i = 0; i < bufL.length; i++) {
      const l = bufL[i];
      const rv = bufR[i];
      g.fillRect(cx + (rv - l) * Math.SQRT1_2 * k, cy - (l + rv) * Math.SQRT1_2 * k, 1.5, 1.5);
    }
    g.globalAlpha = 1;
    if (++frame % 6 === 0) {
      const c = ll > 0 && rr > 0 ? lr / Math.sqrt(ll * rr) : 0;
      corr.textContent = `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(2)}`;
    }
  }

  // ---- UI sync -----------------------------------------------------------
  function placeHandles() {
    state.bands.forEach((b, i) => {
      const el = handles[i];
      el.style.transform = `translate(${xOf(b.freq)}px, ${yOf(b.gain)}px) translate(-50%, -50%)`;
      el.setAttribute('aria-valuenow', b.gain.toFixed(1));
      el.setAttribute('aria-valuetext', `${fmtGain(b.gain)} at ${fmtFreq(b.freq)}`);
      el.classList.toggle('is-active', i === state.focus);
      el.classList.toggle('is-bypassed', !state.eq);
    });
  }

  function updateReadout() {
    const b = state.bands[state.focus];
    readout.textContent = [
      `BAND ${state.focus + 1}`,
      BAND_NAMES[state.focus].toUpperCase(),
      fmtFreq(b.freq),
      fmtGain(b.gain),
      ...(state.eq ? [] : ['BYPASSED']),
    ].join(' · ');
  }

  function syncSwitches() {
    for (const el of switches) {
      const id = el.dataset.labSwitch as SwitchId;
      el.setAttribute('aria-checked', String(state[id]));
      if (id === 'aa') {
        el.disabled = !state.src;
        el.title = state.src ? '' : 'Turn on SRC to use the anti-aliasing filter';
      }
    }
  }

  function syncChain() {
    chainFigure?.toggleAttribute('data-playing', state.playing);
    document.querySelectorAll<HTMLElement>('[data-algo]').forEach((el) => {
      const id = el.dataset.algo;
      const on = id === 'eq' ? state.eq : id === 'widen' ? state.widen : state.src && state.aa;
      el.classList.toggle('is-bypassed', state.playing && !on);
    });
  }

  function syncPlay() {
    playBtn.setAttribute('aria-pressed', String(state.playing));
    playLabel.textContent = state.playing ? 'Stop' : 'Play';
    root.dataset.state = state.playing ? 'playing' : 'idle';
  }

  function applyAudio(smooth = 0.03) {
    if (!engine) return;
    const t = engine.ctx.currentTime;
    engine.eq.forEach((f, i) => {
      const b = state.bands[i];
      f.frequency.setTargetAtTime(b.freq, t, smooth);
      f.gain.setTargetAtTime(state.eq ? b.gain : 0, t, smooth);
    });
    const w = state.widen ? state.width : 1;
    const a = (1 + w) / 2;
    const b = (1 - w) / 2;
    engine.lToL.gain.setTargetAtTime(a, t, smooth);
    engine.rToR.gain.setTargetAtTime(a, t, smooth);
    engine.rToL.gain.setTargetAtTime(b, t, smooth);
    engine.lToR.gain.setTargetAtTime(b, t, smooth);
    engine.direct.gain.setTargetAtTime(state.src ? 0 : 1, t, smooth);
    engine.viaSrc.gain.setTargetAtTime(state.src ? 1 : 0, t, smooth);
    engine.aaOn.gain.setTargetAtTime(state.aa ? 1 : 0, t, smooth);
    engine.aaOff.gain.setTargetAtTime(state.aa ? 0 : 1, t, smooth);
  }

  const redraw = () => {
    if (!state.playing) {
      drawScope();
      drawGonio();
    }
    placeHandles();
  };

  function setBand(i: number, freq: number, gain: number) {
    const [lo, hi] = BAND_LIMITS[i];
    state.bands[i].freq = clamp(freq, lo, hi);
    state.bands[i].gain = Math.round(clamp(gain, -G_MAX, G_MAX) * 10) / 10;
    state.focus = i;
    recompute();
    applyAudio();
    updateReadout();
    redraw();
  }

  function setSwitch(id: SwitchId, on: boolean) {
    state[id] = on;
    recompute();
    applyAudio();
    syncSwitches();
    syncChain();
    updateReadout();
    redraw();
  }

  // ---- transport ---------------------------------------------------------
  function status(message: string) {
    statusEl.textContent = message;
  }

  function loop() {
    drawScope();
    drawGonio();
    if (state.playing) raf = requestAnimationFrame(loop);
  }

  async function start() {
    if (state.playing || starting) return;
    starting = true;
    status('');
    try {
      if (!ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) throw new Error('Web Audio isn’t available in this browser.');
        ctx = new Ctor();
      }
      const resumed = ctx.resume(); // must start inside the click for autoplay rules
      if (!engine) {
        engine = await buildEngine(ctx);
        sequencer = createSequencer(engine);
        recompute();
        const sr = ctx.sampleRate;
        rateNote.textContent = `SRC: ${(sr / 1000).toFixed(1)} kHz ÷ ${engine.factor} = ${(sr / engine.factor / 1000).toFixed(1)} kHz, close to the Bluetooth wideband-speech rate. AA: 4th-order Butterworth at ${((engine.nyquist * 0.85) / 1000).toFixed(1)} kHz.`;
      }
      await resumed;
      applyAudio(0.001);
      sequencer!.start();
      const t = engine.ctx.currentTime;
      engine.master.gain.cancelScheduledValues(t);
      engine.master.gain.setTargetAtTime(MASTER_LEVEL, t, 0.06);
      state.playing = true;
      syncPlay();
      syncChain();
      loop();
    } catch (err) {
      status(err instanceof Error ? err.message : 'Audio could not start.');
    } finally {
      starting = false;
    }
  }

  function stop() {
    if (!state.playing || !engine) return;
    state.playing = false;
    const t = engine.ctx.currentTime;
    engine.master.gain.cancelScheduledValues(t);
    engine.master.gain.setTargetAtTime(0, t, 0.05);
    sequencer?.stop();
    const actx = engine.ctx;
    window.setTimeout(() => {
      if (!state.playing) actx.suspend().catch(() => {});
    }, 400);
    cancelAnimationFrame(raf);
    syncPlay();
    syncChain();
    redraw();
  }

  // ---- events ------------------------------------------------------------
  playBtn.addEventListener('click', () => (state.playing ? stop() : start()));

  for (const el of switches) {
    el.addEventListener('click', () => {
      const id = el.dataset.labSwitch as SwitchId;
      setSwitch(id, !state[id]);
    });
  }

  widthInput.addEventListener('input', () => {
    state.width = Number(widthInput.value) / 100;
    widthOut.value = `${widthInput.value}%`;
    if (!state.widen) setSwitch('widen', true);
    else applyAudio();
  });

  handles.forEach((el, i) => {
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      el.focus({ preventScroll: true });
      dragging = i;
      if (!state.eq) setSwitch('eq', true);
    });
    el.addEventListener('pointermove', (ev) => {
      if (dragging !== i) return;
      const rect = scope.getBoundingClientRect();
      setBand(i, fOf(ev.clientX - rect.left), gOf(ev.clientY - rect.top));
    });
    const end = () => (dragging = -1);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('focus', () => {
      state.focus = i;
      updateReadout();
      placeHandles();
    });
    el.addEventListener('keydown', (ev) => {
      let { freq, gain } = state.bands[i];
      const big = ev.shiftKey;
      switch (ev.key) {
        case 'ArrowUp':
          gain += big ? 3 : 0.5;
          break;
        case 'ArrowDown':
          gain -= big ? 3 : 0.5;
          break;
        case 'ArrowRight':
          freq *= 2 ** (big ? 1 : 1 / 6);
          break;
        case 'ArrowLeft':
          freq /= 2 ** (big ? 1 : 1 / 6);
          break;
        case 'PageUp':
          gain += 3;
          break;
        case 'PageDown':
          gain -= 3;
          break;
        case 'Home':
          gain = 0;
          break;
        default:
          return;
      }
      ev.preventDefault();
      if (!state.eq) setSwitch('eq', true);
      setBand(i, freq, gain);
    });
  });

  // Stop politely: when the lab scrolls away or the tab is hidden.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      visible = true;
    } else if (visible) {
      visible = false;
      stop();
    }
  }).observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  window.addEventListener('dsp-lab:play', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    start();
  });

  new ResizeObserver(() => redraw()).observe(scope);
  document.fonts?.ready.then(() => redraw());

  recompute();
  syncSwitches();
  updateReadout();
  redraw();
}

const root = document.querySelector<HTMLElement>('[data-dsp-lab]');
if (root) initLab(root);

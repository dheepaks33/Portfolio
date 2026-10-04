// I²C waveform builder shared by the server render and the in-browser "TX" input.
// Data changes while SCL is low and is stable while SCL is high; each byte is
// followed by an ACK (SDA held low), framed by START and STOP conditions.

export const PERIOD = 22; // one bit period, in SVG units
export const BIT_TIME_US = 10; // 100 kHz standard-mode I²C
export const MAX_BYTES = 4;
export const HEIGHT = 96;

const EDGE = 1.6; // edge slant
const X0 = 34; // waveform start (lane names sit left of this)
const SCL = { high: 10, low: 28 };
const SDA = { high: 46, low: 64 };

export const LANES = { scl: SCL, sda: SDA };

export interface TraceLabel {
  x: number;
  text: string;
  kind: 'cond' | 'byte' | 'ack';
}

export interface TraceBit {
  x0: number;
  value: boolean;
  byte: number;
  /** Bit number within the byte (7 = MSB), or -1 for the ACK slot. */
  bit: number;
}

export interface Trace {
  width: number;
  scl: string;
  sda: string;
  labels: TraceLabel[];
  brackets: [number, number][];
  bits: TraceBit[];
  bytes: number[];
  clockStart: number;
  clockEnd: number;
  /** Time on the bus in microseconds, START to STOP. */
  durationUs: number;
}

/** Printable ASCII only, capped at MAX_BYTES. */
export function encode(text: string): number[] {
  return [...text]
    .map((ch) => ch.charCodeAt(0))
    .filter((c) => c >= 0x20 && c <= 0x7e)
    .slice(0, MAX_BYTES);
}

export const hex = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;

export function byteLabel(v: number) {
  return `${hex(v)} '${String.fromCharCode(v)}'`;
}

export function buildTrace(bytes: number[]): Trace {
  const bits: TraceBit[] = [];
  const startX = X0 + 12; // SDA falls while SCL is high
  const clockStart = X0 + 24; // SCL falls: first bit period starts

  bytes.forEach((v, b) => {
    for (let i = 7; i >= 0; i--) {
      bits.push({ x0: 0, value: Boolean((v >> i) & 1), byte: b, bit: i });
    }
    bits.push({ x0: 0, value: false, byte: b, bit: -1 });
  });
  bits.forEach((bit, i) => (bit.x0 = clockStart + i * PERIOD));

  const clockEnd = clockStart + bits.length * PERIOD;
  const stopX = clockEnd + PERIOD / 2 + 8; // SDA rises while SCL is high
  const width = stopX + 26;

  const wave = (events: [number, boolean][], lane: { high: number; low: number }) => {
    let level = true;
    let d = `M${X0} ${lane.high}`;
    for (const [x, next] of events) {
      if (next === level) continue;
      d += ` H${x} L${x + EDGE} ${next ? lane.high : lane.low}`;
      level = next;
    }
    return `${d} H${width - 4}`;
  };

  const sclEvents: [number, boolean][] = [[clockStart, false]];
  bits.forEach((bit) => sclEvents.push([bit.x0 + PERIOD / 2, true], [bit.x0 + PERIOD, false]));
  sclEvents.push([clockEnd + PERIOD / 2, true]);

  const sdaEvents: [number, boolean][] = [[startX, false]];
  bits.forEach((bit) => sdaEvents.push([bit.x0 + 3, bit.value]));
  sdaEvents.push([stopX, true]);

  const labels: TraceLabel[] = [{ x: startX, text: 'S', kind: 'cond' }];
  const brackets: [number, number][] = [];
  bytes.forEach((v, b) => {
    const first = clockStart + b * 9 * PERIOD;
    labels.push({ x: first + 4 * PERIOD, text: byteLabel(v), kind: 'byte' });
    labels.push({ x: first + 8.5 * PERIOD, text: 'A', kind: 'ack' });
    brackets.push([first + 2, first + 8 * PERIOD - 2]);
  });
  labels.push({ x: stopX, text: 'P', kind: 'cond' });

  return {
    width,
    scl: wave(sclEvents, SCL),
    sda: wave(sdaEvents, SDA),
    labels,
    brackets,
    bits,
    bytes,
    clockStart,
    clockEnd,
    durationUs: (bits.length + 2) * BIT_TIME_US,
  };
}

export function describeTrace(t: Trace) {
  const n = t.bytes.length;
  return `${n} byte${n === 1 ? '' : 's'} · ${t.durationUs} µs @ 100 kHz`;
}

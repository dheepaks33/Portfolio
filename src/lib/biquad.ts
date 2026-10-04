// Biquad coefficients from the RBJ Audio EQ Cookbook, using the same conventions
// as the Web Audio BiquadFilterNode (shelves use slope S = 1), so the curve drawn
// on screen matches what the audio graph is doing.

export type FilterType = 'lowshelf' | 'peaking' | 'highshelf' | 'lowpass';

export interface Band {
  type: FilterType;
  freq: number;
  gain: number; // dB (ignored by lowpass)
  q: number; // linear Q (peaking, lowpass)
}

export interface Coefficients {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
}

export function coefficients(band: Band, sampleRate: number): Coefficients {
  const A = 10 ** (band.gain / 40);
  const w0 = (2 * Math.PI * Math.min(band.freq, sampleRate / 2 - 1)) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);

  switch (band.type) {
    case 'peaking': {
      const alpha = sin / (2 * band.q);
      return { b0: 1 + alpha * A, b1: -2 * cos, b2: 1 - alpha * A, a0: 1 + alpha / A, a1: -2 * cos, a2: 1 - alpha / A };
    }
    case 'lowshelf': {
      const k = 2 * Math.sqrt(A) * ((sin / 2) * Math.SQRT2);
      return {
        b0: A * (A + 1 - (A - 1) * cos + k),
        b1: 2 * A * (A - 1 - (A + 1) * cos),
        b2: A * (A + 1 - (A - 1) * cos - k),
        a0: A + 1 + (A - 1) * cos + k,
        a1: -2 * (A - 1 + (A + 1) * cos),
        a2: A + 1 + (A - 1) * cos - k,
      };
    }
    case 'highshelf': {
      const k = 2 * Math.sqrt(A) * ((sin / 2) * Math.SQRT2);
      return {
        b0: A * (A + 1 + (A - 1) * cos + k),
        b1: -2 * A * (A - 1 + (A + 1) * cos),
        b2: A * (A + 1 + (A - 1) * cos - k),
        a0: A + 1 - (A - 1) * cos + k,
        a1: 2 * (A - 1 - (A + 1) * cos),
        a2: A + 1 - (A - 1) * cos - k,
      };
    }
    case 'lowpass': {
      const alpha = sin / (2 * band.q);
      return { b0: (1 - cos) / 2, b1: 1 - cos, b2: (1 - cos) / 2, a0: 1 + alpha, a1: -2 * cos, a2: 1 - alpha };
    }
  }
}

/** |H(e^jw)| in dB at frequency `f`: H = (b0 + b1 z^-1 + b2 z^-2) / (a0 + a1 z^-1 + a2 z^-2). */
export function magnitudeDb(c: Coefficients, f: number, sampleRate: number): number {
  const w = (2 * Math.PI * f) / sampleRate;
  const c1 = Math.cos(w);
  const s1 = Math.sin(w);
  const c2 = Math.cos(2 * w);
  const s2 = Math.sin(2 * w);
  const nr = c.b0 + c.b1 * c1 + c.b2 * c2;
  const ni = -(c.b1 * s1 + c.b2 * s2);
  const dr = c.a0 + c.a1 * c1 + c.a2 * c2;
  const di = -(c.a1 * s1 + c.a2 * s2);
  return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di));
}

/** Linear Q values for a 4th-order Butterworth low-pass built from two biquads. */
export const BUTTERWORTH_4 = [0.5412, 1.3066] as const;

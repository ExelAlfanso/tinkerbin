import { hsl2hex, hex2hsl, lerpHue } from "./color";
import type { Hex } from "./color";
import { shuffle } from "./random";

export type Harmony =
  | "random"
  | "analogous"
  | "complementary"
  | "triadic"
  | "split"
  | "tetradic"
  | "mono";
export interface ColorOptions {
  mode: Harmony;
  n: number;
  cols: Hex[];
  locked: Set<number>;
}
const OFFS: Record<Harmony, number[] | null> = {
  analogous: [-30, -15, 0, 15, 30, 45, -45, 60],
  complementary: [0, 12, 180, 192, -12, 168, 24, 204],
  mono: [0, 0, 0, 0, 0, 0, 0, 0],
  random: null,
  split: [0, 150, 210, 18, -18, 162, 198, 6],
  tetradic: [0, 90, 180, 270, 20, 110, 200, 290],
  triadic: [0, 120, 240, 12, 132, 252, -12, 108],
};
export function generateColors(
  state: ColorOptions,
  r: () => number = Math.random
): Hex[] {
  const { n } = state;
  const lockedIdx = [...state.locked].filter((i) => state.cols[i]);
  const baseHue = lockedIdx.length
    ? hex2hsl(state.cols[lockedIdx[0]!]!)[0]
    : r() * 360;
  const offs = OFFS[state.mode];
  const ls = shuffle(
    r,
    [0.2, 0.36, 0.52, 0.68, 0.84, 0.28, 0.6, 0.92].slice(0, n)
  );
  const next = Array.from({ length: n }, (_, i) => {
    if (state.locked.has(i) && state.cols[i]) {
      return state.cols[i]!;
    }
    const hue = offs
      ? baseHue + offs[i % offs.length]! + r() * 8 - 4
      : r() * 360;
    const sat = state.mode === "mono" ? 0.35 + r() * 0.4 : 0.45 + r() * 0.45;
    return hsl2hex(
      hue,
      sat,
      state.mode === "mono" ? 0.14 + (i / Math.max(1, n - 1)) * 0.74 : ls[i]!
    );
  });
  return next;
}
export type PaletteStyle = "natural" | "neon" | "pastel" | "moody" | "earthy";
export interface RampStyle {
  name: string;
  s: [number, number];
  l: [number, number];
  shift: number;
  hues?: number[];
}
export interface RampOptions {
  style: PaletteStyle;
  ramps: number;
  steps: number;
  gray: boolean;
  rows: Hex[][];
  locked: Set<number>;
}
export const STYLES: Record<PaletteStyle, RampStyle> = {
  earthy: {
    hues: [12, 28, 40, 70, 100, 150, 190, 25, 215],
    l: [0.12, 0.8],
    name: "Earthy",
    s: [0.3, 0.52],
    shift: 0.4,
  },
  moody: { l: [0.08, 0.7], name: "Moody", s: [0.22, 0.45], shift: 0.55 },
  natural: { l: [0.13, 0.9], name: "Natural", s: [0.5, 0.7], shift: 0.35 },
  neon: { l: [0.2, 0.82], name: "Neon", s: [0.85, 1], shift: 0.2 },
  pastel: { l: [0.46, 0.94], name: "Pastel", s: [0.4, 0.62], shift: 0.3 },
};
export function makeRamp(
  hue: number,
  S: RampStyle,
  n: number,
  r: () => number
): Hex[] {
  const s0 = S.s[0] + r() * (S.s[1] - S.s[0]);
  const out: Hex[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const l = S.l[0] + (S.l[1] - S.l[0]) * t ** 0.92;
    const hh =
      t < 0.5
        ? lerpHue(hue, 255, (1 - t * 2) * S.shift * 0.6)
        : lerpHue(hue, 55, (t * 2 - 1) * S.shift * 0.6);
    out.push(hsl2hex(hh, s0 * (1 - Math.abs(t * 2 - 1) ** 2 * 0.45), l));
  }
  return out;
}
export function makeGray(n: number): Hex[] {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return hsl2hex(
      250,
      0.14 * (1 - Math.abs(t * 2 - 1) * 0.5),
      0.07 + t * 0.89
    );
  });
}
export function generateRamps(
  state: RampOptions,
  r: () => number = Math.random
): Hex[][] {
  const S = STYLES[state.style];
  const base = r() * 360;
  const n = state.ramps;
  const hues = S.hues
    ? shuffle(r, S.hues)
        .slice(0, n)
        .map((h0) => h0 + r() * 16 - 8)
    : Array.from({ length: n }, (_, i) => base + (i * 360) / n + r() * 26 - 13);
  const rows = hues.map((h0) => makeRamp(h0, S, state.steps, r));
  if (state.gray) {
    rows.push(makeGray(state.steps));
  }
  return rows.map((row, i) =>
    state.locked.has(i) && state.rows[i] && state.rows[i].length === row.length
      ? state.rows[i]
      : row
  );
}

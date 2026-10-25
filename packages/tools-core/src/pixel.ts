import { hex2rgb } from "./color";
import type { RGB, Palette } from "./color";

export type Dither = "bayer" | "fs" | "none";
export interface PixelConversion {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  palette: Palette;
}
export const PRESETS: Record<string, [string, string]> = {
  c64: [
    "Commodore 64",
    "000000 ffffff 68372b 70a4b2 6f3d86 588d43 352879 b8c76f 6f4f25 433900 9a6759 444444 6c6c6c 9ad284 6c5eb5 959595",
  ],
  cga: ["CGA (4 colors)", "000000 55ffff ff55ff ffffff"],
  gameboy: ["Game Boy (4 greens)", "0f380f 306230 8bac0f 9bbc0f"],
  gray4: ["4 grays", "000000 555555 aaaaaa ffffff"],
  onebit: ["1-bit (black and white)", "000000 ffffff"],
  pico8: [
    "Pico-8 (16 colors)",
    "000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa",
  ],
  sweetie: [
    "Sweetie 16",
    "1a1c2c 5d275d b13e53 ef7d57 ffcd75 a7f070 38b764 257179 29366f 3b5dc9 41a6f6 73eff7 f4f4f4 94b0c2 566c86 333c57",
  ],
};
const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const dist = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (
    (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
  );
};
function nearest(pal: RGB[], r: number, g: number, b: number) {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const p = pal[i]!;
    const d = dist(r, g, b, p[0], p[1], p[2]);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}
const clamp8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
export function convertPixels(
  input: ArrayLike<number>,
  tw: number,
  th: number,
  hexPal: Palette,
  dither: Dither
): PixelConversion {
  if (
    !Number.isInteger(tw) ||
    !Number.isInteger(th) ||
    tw < 1 ||
    th < 1 ||
    input.length !== tw * th * 4
  ) {
    throw new Error("Invalid pixel dimensions.");
  }
  if (hexPal.length < 2) {
    throw new Error("Add at least two valid HEX colors to build a palette.");
  }
  const d = Uint8ClampedArray.from(input);
  const pal = hexPal.map(hex2rgb);
  const n = pal.length;
  const spread = (255 / Math.cbrt(n)) * 0.9;
  if (dither === "fs") {
    const buf = Float32Array.from(d);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4;
        if (d[i + 3]! < 128) {
          d[i + 3] = 0;
          continue;
        }
        const r = clamp8(buf[i]!);
        const g = clamp8(buf[i + 1]!);
        const b = clamp8(buf[i + 2]!);
        const p = pal[nearest(pal, r, g, b)]!;
        const er = r - p[0];
        const eg = g - p[1];
        const eb = b - p[2];
        d[i] = p[0];
        d[i + 1] = p[1];
        d[i + 2] = p[2];
        d[i + 3] = 255;
        const push = (xx: number, yy: number, f: number) => {
          if (xx < 0 || xx >= tw || yy >= th) {
            return;
          }
          const j = (yy * tw + xx) * 4;
          buf[j] = buf[j]! + er * f;
          buf[j + 1] = buf[j + 1]! + eg * f;
          buf[j + 2] = buf[j + 2]! + eb * f;
        };
        push(x + 1, y, 7 / 16);
        push(x - 1, y + 1, 3 / 16);
        push(x, y + 1, 5 / 16);
        push(x + 1, y + 1, 1 / 16);
      }
    }
  } else {
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4;
        if (d[i + 3]! < 128) {
          d[i + 3] = 0;
          continue;
        }
        const off =
          dither === "bayer"
            ? ((bayer[y % 4]![x % 4]! + 0.5) / 16 - 0.5) * spread
            : 0;
        const p =
          pal[
            nearest(
              pal,
              clamp8(d[i]! + off),
              clamp8(d[i + 1]! + off),
              clamp8(d[i + 2]! + off)
            )
          ]!;
        d[i] = p[0];
        d[i + 1] = p[1];
        d[i + 2] = p[2];
        d[i + 3] = 255;
      }
    }
  }
  return { height: th, palette: hexPal, pixels: d, width: tw };
}

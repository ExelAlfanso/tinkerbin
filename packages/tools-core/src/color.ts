export type Hex = `#${string}`;
export type Palette = readonly Hex[];
export type RGB = [number, number, number];
export interface QuantizedColor {
  rgb: RGB;
  count: number;
  share: number;
}
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function hex2rgb(h: string): RGB {
  h = h.replace("#", "");
  if (h.length === 3) {
    h = [...h].map((c) => c + c).join("");
  }
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgb2hex = (r: number, g: number, b: number): Hex =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}` as Hex;
export function rgb2hsl(r: number, g: number, b: number): RGB {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  let s = 0;
  const l = (mx + mn) / 2;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h =
      mx === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : mx === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function hsl2rgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let b;
  let g;
  let r;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
export const hsl2hex = (h: number, s: number, l: number) =>
  rgb2hex(...hsl2rgb(h, clamp(s), clamp(l)));
export const hex2hsl = (h: string) => rgb2hsl(...hex2rgb(h));
export function lum(hex: string) {
  const [r = 0, g = 0, b = 0] = hex2rgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const textOn = (hex: string) =>
  contrast(hex, "#14141f") >= contrast(hex, "#ffffff") ? "#14141f" : "#ffffff";
export const validHex = (s: unknown) =>
  /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s).trim());
export function normHex(s: string): Hex {
  s = String(s).trim().replace("#", "");
  if (s.length === 3) {
    s = [...s].map((c) => c + c).join("");
  }
  return `#${s.toLowerCase()}` as Hex;
}
export function lerpHue(a: number, b: number, t: number) {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}
export function parseHexList(text: string): Hex[] {
  return String(text)
    .split(/[\s,;|-]+/)
    .filter(Boolean)
    .filter(validHex)
    .map(normHex);
}
// ── Exporters ──
export const hexList = (cols: Palette) =>
  cols.map((c) => c.slice(1).toUpperCase()).join("\n");
export function gpl(name: string, cols: Palette) {
  return `GIMP Palette\nName: ${name}\nColumns: 8\n#\n${cols
    .map((c) => {
      const [r, g, b] = hex2rgb(c);
      return `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${c.toUpperCase()}`;
    })
    .join("\n")}\n`;
}
export const cssVars = (cols: Palette, prefix = "c") =>
  `:root {\n${cols.map((c, i) => `  --${prefix}-${i + 1}: ${c};`).join("\n")}\n}`;
// ── Median cut quantizer over RGBA data → [{rgb, count, share}] ──
export function medianCut(
  data: ArrayLike<number>,
  k: number
): QuantizedColor[] {
  const px: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! >= 125) {
      px.push([data[i]!, data[i + 1]!, data[i + 2]!]);
    }
  }
  if (!px.length) {
    return [];
  }
  const boxes = [px];
  const span = (b: RGB[]) => {
    const mn: RGB = [255, 255, 255];
    const mx: RGB = [0, 0, 0];
    for (const p of b) {
      for (let c = 0; c < 3; c++) {
        if (p[c]! < mn[c]!) {
          mn[c] = p[c]!;
        }
        if (p[c]! > mx[c]!) {
          mx[c] = p[c]!;
        }
      }
    }
    return [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
  };
  while (boxes.length < k) {
    let bi = -1;
    let bs = 0;
    let bc = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) {
        return;
      }
      const s = span(b);
      const m = Math.max(...s);
      const score = m * Math.sqrt(b.length);
      if (score > bs) {
        bs = score;
        bi = i;
        bc = s.indexOf(m);
      }
    });
    if (bi < 0 || bs === 0) {
      break;
    }
    const b = boxes[bi]!.sort((p, q) => p[bc]! - q[bc]!);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes
    .map((b) => {
      let bl = 0;
      let g = 0;
      let r = 0;
      for (const p of b) {
        r += p[0];
        g += p[1];
        bl += p[2];
      }
      const n = b.length;
      return {
        count: n,
        rgb: [Math.round(r / n), Math.round(g / n), Math.round(bl / n)] as RGB,
        share: n / px.length,
      };
    })
    .sort((a, b) => b.count - a.count);
}

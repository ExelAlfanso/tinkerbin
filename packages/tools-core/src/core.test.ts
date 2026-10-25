import { describe, expect, test } from "bun:test";

import {
  contrast,
  normHex,
  parseHexList,
  rgb2hex,
  hex2rgb,
  hsl2hex,
  medianCut,
  generateColors,
  generateRamps,
  rng,
  convertPixels,
  cssVars,
  gpl,
  hexList,
} from "./index";
import type { Hex, Dither } from "./index";

describe("legacy tool algorithms", () => {
  test("normalizes shared URL/custom colors and exports exact formats", () => {
    expect(parseHexList("abc-123456, #FF0000; badword")).toEqual([
      "#aabbcc",
      "#123456",
      "#ff0000",
    ]);
    expect(normHex("#AbC")).toBe("#aabbcc");
    expect(rgb2hex(...hex2rgb("#abc"))).toBe("#aabbcc");
    expect(hsl2hex(0, 1, 0.5)).toBe("#ff0000");
    expect(contrast("#ffffff", "#000000")).toBe(21);
    const colors: Hex[] = ["#ff0000", "#0088ff"];
    expect(hexList(colors)).toBe("FF0000\n0088FF");
    expect(cssVars(colors, "color")).toBe(
      ":root {\n  --color-1: #ff0000;\n  --color-2: #0088ff;\n}"
    );
    expect(gpl("Test", colors)).toBe(
      "GIMP Palette\nName: Test\nColumns: 8\n#\n255   0   0\t#FF0000\n  0 136 255\t#0088FF\n"
    );
  });
  test("median cut excludes transparent pixels and reports shares", () => {
    expect(
      medianCut(
        new Uint8ClampedArray([
          255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 0,
        ]),
        2
      )
    ).toEqual([
      { count: 2, rgb: [255, 0, 0], share: 2 / 3 },
      { count: 1, rgb: [0, 0, 255], share: 1 / 3 },
    ]);
    expect(medianCut(new Uint8ClampedArray([0, 0, 0, 0]), 8)).toEqual([]);
  });
  test("generation deterministic with locks across every harmony and style", () => {
    for (const mode of [
      "random",
      "analogous",
      "complementary",
      "triadic",
      "split",
      "tetradic",
      "mono",
    ] as const) {
      const input = {
        cols: ["#123456"] as Hex[],
        locked: new Set([0]),
        mode,
        n: 5,
      };
      const a = generateColors(input, rng("fixture"));
      expect(a).toEqual(generateColors(input, rng("fixture")));
      expect(a[0]).toBe("#123456");
      expect(a).toHaveLength(5);
      expect(a.every((c) => /^#[a-f0-9]{6}$/.test(c))).toBe(true);
    }
    for (const style of [
      "natural",
      "neon",
      "pastel",
      "moody",
      "earthy",
    ] as const) {
      const input = {
        gray: true,
        locked: new Set<number>(),
        ramps: 3,
        rows: [],
        steps: 4,
        style,
      };
      const rows = generateRamps(input, rng("fixture"));
      expect(rows).toHaveLength(4);
      expect(rows.every((r) => r.length === 4)).toBe(true);
      expect(
        generateRamps(
          { ...input, locked: new Set([1]), rows },
          rng("different")
        )[1]
      ).toEqual(rows[1]);
    }
  });
  test("all dithers preserve cutouts, use palette colors, and leave input intact", () => {
    const data = new Uint8ClampedArray([
      255, 20, 0, 255, 0, 10, 255, 255, 120, 120, 120, 127, 125, 125, 125, 128,
    ]);
    const original = [...data];
    const palette: Hex[] = ["#000000", "#ffffff", "#ff0000", "#0000ff"];
    for (const dither of ["none", "bayer", "fs"] as Dither[]) {
      const result = convertPixels(data, 2, 2, palette, dither);
      expect(result.pixels[11]).toBe(0);
      expect(result.pixels[15]).toBe(255);
      for (let i = 0; i < 16; i += 4) {
        if (result.pixels[i + 3]) {
          expect(palette).toContain(
            rgb2hex(
              result.pixels[i]!,
              result.pixels[i + 1]!,
              result.pixels[i + 2]!
            )
          );
        }
      }
    }
    expect([...data]).toEqual(original);
    expect(() => convertPixels(data, 3, 2, palette, "none")).toThrow(
      "Invalid pixel dimensions."
    );
    expect(() => convertPixels(data, 2, 2, [], "none")).toThrow(
      "Add at least two valid HEX colors"
    );
  });
});

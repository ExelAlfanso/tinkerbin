import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { useColorPalette } from "../../app/composables/useColorPalette";
import {
  installBrowserHarness,
  mountComposable,
} from "../composable-test-utils";

describe("useColorPalette", () => {
  let browser: ReturnType<typeof installBrowserHarness>;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    browser = installBrowserHarness({
      hash: "#c=000000-ff0000-ffffff",
    });
  });

  afterEach(() => {
    unmount?.();
    browser.restore();
    unmount = undefined;
  });

  it("restores shared colors, derives preview tones, and edits a locked color", () => {
    const { result, unmount: dispose } = mountComposable(useColorPalette);
    unmount = dispose;
    const { edit, lock, preview, state } = result;

    expect(state.cols).toEqual(["#000000", "#ff0000", "#ffffff"]);
    expect(state.n).toBe(3);
    expect(preview.value.bg).toBe("#ffffff");
    expect(preview.value.ink).toBe("#000000");

    const input = { value: "ABCDEF" };
    edit(1, { target: input } as unknown as Event);
    expect(state.cols[1]).toBe("#abcdef");
    expect(state.locked.has(1)).toBe(true);
    expect(browser.location.hash).toBe("#c=000000-abcdef-ffffff");

    input.value = "invalid";
    edit(1, { target: input } as unknown as Event);
    expect(input.value).toBe("ABCDEF");
    lock(1);
    expect(state.locked.has(1)).toBe(false);
  });

  it("generates five colors and tracks the first user generation once", () => {
    const { result, unmount: dispose } = mountComposable(useColorPalette);
    unmount = dispose;
    const { generate, state } = result;
    state.n = 5;

    generate();
    generate();

    expect(state.cols).toHaveLength(5);
    expect(state.cols.every((color) => /^#[\da-f]{6}$/u.test(color))).toBe(
      true
    );
    expect(browser.trackCalls).toEqual([
      ["start", { exp: "color-palette-generator" }],
    ]);
  });

  it("removes its keyboard listener when its component unmounts", () => {
    const { unmount: dispose } = mountComposable(useColorPalette);
    expect(browser.documentListeners.get("keydown")?.size).toBe(1);
    dispose();
    unmount = undefined;
    expect(browser.documentListeners.get("keydown")?.size).toBe(0);
  });
});

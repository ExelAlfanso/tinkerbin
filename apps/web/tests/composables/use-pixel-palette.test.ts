import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { usePixelPalette } from "../../app/composables/usePixelPalette";
import {
  installBrowserHarness,
  mountComposable,
} from "../composable-test-utils";

describe("usePixelPalette", () => {
  let browser: ReturnType<typeof installBrowserHarness>;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    browser = installBrowserHarness({
      hash: "#r=3&g=0&p=ff0000-00ff00-0000ff-ffffff-000000-ffff00",
      search: "?style=natural",
    });
  });

  afterEach(() => {
    unmount?.();
    browser.restore();
    unmount = undefined;
  });

  it("restores shared ramp settings and regenerates after clearing locks", () => {
    const { result, unmount: dispose } = mountComposable(usePixelPalette);
    unmount = dispose;
    const { lock, resize, state } = result;

    expect(state.steps).toBe(3);
    expect(state.gray).toBe(false);
    expect(state.style).toBe("natural");
    expect(state.rows).toEqual([
      ["#ff0000", "#00ff00", "#0000ff"],
      ["#ffffff", "#000000", "#ffff00"],
    ]);
    expect(state.ramps).toBe(2);

    lock(0);
    expect(state.locked.has(0)).toBe(true);
    resize();

    expect(state.locked.size).toBe(0);
    expect(state.rows).toHaveLength(2);
    expect(state.rows.every((row) => row.length === 3)).toBe(true);
    expect(browser.trackCalls).toEqual([
      ["start", { exp: "pixel-palette-generator" }],
    ]);
  });

  it("removes its keyboard listener when unmounted", () => {
    const { unmount: dispose } = mountComposable(usePixelPalette);
    expect(browser.documentListeners.get("keydown")?.size).toBe(1);
    dispose();
    unmount = undefined;
    expect(browser.documentListeners.get("keydown")?.size).toBe(0);
  });
});

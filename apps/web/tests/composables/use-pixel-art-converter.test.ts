import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { nextTick } from "vue";

import { usePixelArtConverter } from "../../app/composables/usePixelArtConverter";
import {
  installBrowserHarness,
  mountComposable,
} from "../composable-test-utils";

describe("usePixelArtConverter", () => {
  let browser: ReturnType<typeof installBrowserHarness>;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    browser = installBrowserHarness({
      pixels: new Uint8ClampedArray([255, 0, 0, 255]),
    });
  });

  afterEach(() => {
    unmount?.();
    browser.restore();
    unmount = undefined;
  });

  it("converts an image with the selected palette and reconverts on size changes", async () => {
    const { result, unmount: dispose } = mountComposable(usePixelArtConverter);
    unmount = dispose;
    let closeCount = 0;
    const image = {
      close: () => {
        closeCount += 1;
      },
      height: 64,
      width: 64,
    } as unknown as ImageBitmap;

    result.image(image);

    expect(result.error.value).toBe("");
    expect(result.output.value?.width).toBe(64);
    expect(result.output.value?.height).toBe(64);
    expect(result.palette.value.length).toBeGreaterThan(1);
    expect(result.used.value.size).toBeGreaterThan(0);
    expect(
      [...result.used.value].every((color) =>
        result.palette.value.includes(color)
      )
    ).toBe(true);

    result.width.value = 32;
    await nextTick();
    expect(result.output.value?.width).toBe(32);
    expect(result.output.value?.height).toBe(32);

    dispose();
    unmount = undefined;
    expect(closeCount).toBe(1);
    expect(browser.trackCalls.map(([event]) => event)).toEqual([
      "start",
      "complete",
    ]);
  });

  it("surfaces invalid custom palettes without producing output", () => {
    const { result, unmount: dispose } = mountComposable(usePixelArtConverter);
    unmount = dispose;
    result.preset.value = "custom";
    result.image({ height: 64, width: 64 } as ImageBitmap);

    expect(result.output.value).toBeNull();
    expect(result.error.value).toContain("Add at least two valid HEX colors");
  });
});

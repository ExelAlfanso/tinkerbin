import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { nextTick } from "vue";

import { useImageColorExtractor } from "../../app/composables/useImageColorExtractor";
import {
  installBrowserHarness,
  mountComposable,
} from "../composable-test-utils";

const pixels = new Uint8ClampedArray([
  255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 0, 255, 255, 255, 255,
]);

describe("useImageColorExtractor", () => {
  let browser: ReturnType<typeof installBrowserHarness>;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    browser = installBrowserHarness({ pixels });
  });

  afterEach(() => {
    unmount?.();
    browser.restore();
    unmount = undefined;
  });

  it("extracts opaque colors, resets picks, reacts to color count, and closes the bitmap", async () => {
    const { result, unmount: dispose } = mountComposable(
      useImageColorExtractor
    );
    unmount = dispose;
    let closeCount = 0;
    const image = {
      close: () => {
        closeCount += 1;
      },
      height: 2,
      width: 2,
    } as unknown as ImageBitmap;

    result.picked.value = ["#abcdef"];
    result.image(image);

    expect(result.error.value).toBe("");
    expect(result.picked.value).toEqual([]);
    expect(result.colors.value.map(({ hex }) => hex)).toContain("#ff0000");
    expect(result.colors.value.map(({ hex }) => hex)).toContain("#00ff00");
    expect(result.colors.value.map(({ hex }) => hex)).not.toContain("#0000ff");
    result.picked.value.push("#abcdef");
    expect(result.hexes.value.at(-1)).toBe("#abcdef");

    result.k.value = 2;
    await nextTick();
    expect(result.colors.value).toHaveLength(2);
    expect(browser.trackCalls.map(([event]) => event)).toEqual([
      "start",
      "complete",
    ]);

    dispose();
    unmount = undefined;
    expect(closeCount).toBe(1);
  });

  it("shows a readable error when the browser cannot create a canvas context", () => {
    browser.restore();
    browser = installBrowserHarness({ canvasAvailable: false, pixels });
    const { result, unmount: dispose } = mountComposable(
      useImageColorExtractor
    );
    unmount = dispose;

    result.image({ height: 2, width: 2 } as ImageBitmap);

    expect(result.error.value).toBe(
      "Could not process that image. Please try a smaller image."
    );
    expect(result.colors.value).toEqual([]);
    expect(browser.trackCalls).toEqual([]);
  });
});

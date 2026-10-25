import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { useBackgroundRemover } from "../../app/composables/useBackgroundRemover";
import {
  installBrowserHarness,
  mountComposable,
} from "../composable-test-utils";

describe("useBackgroundRemover", () => {
  let browser: ReturnType<typeof installBrowserHarness>;
  let unmount: (() => void) | undefined;

  beforeEach(() => {
    browser = installBrowserHarness({ deviceMemory: 2 });
  });

  afterEach(() => {
    unmount?.();
    browser.restore();
    unmount = undefined;
  });

  it("loads a saved model preference and removes browser listeners on unmount", () => {
    browser.localStorage.setItem("tb:bg-mode", JSON.stringify("best"));
    const { result, unmount: dispose } = mountComposable(useBackgroundRemover);
    unmount = dispose;

    expect(result.supported.value).toBe(true);
    expect(result.mode.value).toBe("best");
    expect(result.modeNote.value).toContain("Best quality");
    expect(browser.documentListeners.get("paste")?.size).toBe(1);
    expect(browser.windowListeners.get("pagehide")?.size).toBe(1);

    result.selectMode("fast");
    expect(browser.localStorage.getItem("tb:bg-mode")).toBe('"fast"');

    dispose();
    unmount = undefined;
    expect(browser.documentListeners.get("paste")?.size).toBe(0);
    expect(browser.windowListeners.get("pagehide")?.size).toBe(0);
  });

  it("rejects unsupported images before attempting model or network work", async () => {
    const { result, unmount: dispose } = mountComposable(useBackgroundRemover);
    unmount = dispose;

    await result.start({
      name: "portrait.gif",
      size: 1024,
      type: "image/gif",
    } as File);

    expect(result.view.value).toBe("error");
    expect(result.error.value).toContain("PNG, JPG or WebP");
    expect(result.canRetry.value).toBe(false);
    expect(result.busy.value).toBe(false);
    expect(result.filename.value).toBe("portrait-no-background.png");
    expect(browser.trackCalls).toEqual([
      ["background_remove_error", { code: "unsupported-type", mode: "fast" }],
    ]);
  });

  it("rejects empty and oversized files with actionable messages", async () => {
    const { result, unmount: dispose } = mountComposable(useBackgroundRemover);
    unmount = dispose;

    await result.start({
      name: "empty.png",
      size: 0,
      type: "image/png",
    } as File);
    expect(result.error.value).toContain("file is empty");

    await result.start({
      name: "large.png",
      size: 30 * 1024 * 1024 + 1,
      type: "image/png",
    } as File);
    expect(result.error.value).toContain("limit is 30 MB");
    expect(result.busy.value).toBe(false);
  });

  it("derives progress and status from the current engine phase", () => {
    const { result, unmount: dispose } = mountComposable(useBackgroundRemover);
    unmount = dispose;

    result.progress.value = { loaded: 47, phase: "download", total: 100 };
    expect(result.percent.value).toBe(47);
    expect(result.status.value).toBe("Preparing background remover…");

    result.progress.value = { loaded: 0, phase: "init", total: 100 };
    expect(result.status.value).toBe("Starting the model…");

    result.progress.value = { loaded: 0, phase: "inference", total: 0 };
    expect(result.percent.value).toBe(0);
    expect(result.status.value).toBe("Removing background…");
  });
});

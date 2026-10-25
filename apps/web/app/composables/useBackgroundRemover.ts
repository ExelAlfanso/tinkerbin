import type {
  BackgroundEngine,
  BgManifest,
  BgProgress,
} from "@tinkerbin/background-engine";
import { computed, onMounted, onBeforeUnmount, shallowRef } from "vue";

import { toast } from "~/components/tools/browser";

type View = "idle" | "work" | "error" | "result";
interface ResultSize {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  resized: boolean;
  seconds: number;
}

export function useBackgroundRemover() {
  const mode = shallowRef<"fast" | "best">("best");
  const view = shallowRef<View>("idle");
  const supported = shallowRef(true);
  const busy = shallowRef(false);
  const error = shallowRef("");
  const detail = shallowRef("");
  const announcement = shallowRef("");
  const progress = shallowRef<BgProgress>();
  const canRetry = shallowRef(false);
  const canUseFast = shallowRef(false);
  const canShare = shallowRef(false);
  const size = shallowRef<ResultSize>();
  const track = useTrack();
  const modeNote = computed(() =>
    mode.value === "best"
      ? "Best quality: clean edges, hair and fine detail. The first use downloads about 61 MB, then it is saved in your browser."
      : "Fast: a smaller download (about 19 MB) and quicker results, with rougher edges."
  );
  const percent = computed(() =>
    progress.value?.total
      ? Math.round((progress.value.loaded / progress.value.total) * 100)
      : 0
  );
  const status = computed(() =>
    progress.value?.phase === "init"
      ? "Starting the model…"
      : progress.value?.phase === "inference"
        ? "Removing background…"
        : "Preparing background remover…"
  );
  const resultInfo = computed(
    () =>
      size.value &&
      `${size.value.width} × ${size.value.height} px  ·  ${size.value.seconds.toFixed(1)} s  ·  ${mode.value === "best" ? "Best quality" : "Fast model"}`
  );
  const resizeNote = computed(() =>
    size.value?.resized
      ? `Your image (${size.value.originalWidth} × ${size.value.originalHeight}) was resized to ${size.value.width} × ${size.value.height} to keep your browser stable.`
      : ""
  );
  const clearUrls = () => {
    if (before.value) {
      URL.revokeObjectURL(before.value);
    }
    if (after.value) {
      URL.revokeObjectURL(after.value);
    }
    before.value = "";
    after.value = "";
    resultBlob = undefined;
    canShare.value = false;
  };
  const before = shallowRef("");
  const after = shallowRef("");
  let resultBlob: Blob | undefined;
  let api: typeof import("@tinkerbin/background-engine") | undefined;
  let engine: BackgroundEngine | undefined;
  let file: File | undefined;
  let controller: AbortController | undefined;
  let lowMemory = false;
  let manifest: BgManifest | undefined;
  let runId = 0;
  let touch = false;
  let inferenceStart = 0;
  let loadedMode: "fast" | "best" | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const dispose = () => {
    loadedMode = undefined;
    if (engine && api) {
      void api.runWorkflow(engine.dispose());
    }
  };
  function stop(announce = true) {
    runId++;
    controller?.abort();
    dispose();
    clearInterval(timer);
    timer = undefined;
    busy.value = false;
    progress.value = undefined;
    view.value = "idle";
    if (announce) {
      announcement.value = "Cancelled";
    }
  }
  function cancel() {
    stop();
  }
  function reset() {
    stop(false);
    clearUrls();
    error.value = "";
    detail.value = "";
    file = undefined;
  }
  const paste = (event: ClipboardEvent) => {
    if (view.value === "idle" && supported.value) {
      const image = [...(event.clipboardData?.files ?? [])].find((f) =>
        f.type.startsWith("image/")
      );
      if (image) {
        void start(image);
      }
    }
  };
  const pagehide = () => {
    stop(false);
    clearUrls();
  };
  onMounted(() => {
    supported.value =
      typeof WebAssembly === "object" &&
      typeof Worker === "function" &&
      typeof createImageBitmap === "function" &&
      typeof fetch === "function";
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    touch = matchMedia("(pointer: coarse)").matches;
    lowMemory = touch || (device.deviceMemory ?? 8) <= 4;
    mode.value =
      lowMemory ||
      device.connection?.saveData ||
      /(^|-)(2g|3g)$/.test(device.connection?.effectiveType ?? "")
        ? "fast"
        : "best";
    try {
      const stored = localStorage.getItem("tb:bg-mode");
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (value === "fast" || value === "best") {
          mode.value = value;
        }
      }
    } catch {
      /* Optional preference. */
    }
    document.addEventListener("paste", paste);
    window.addEventListener("pagehide", pagehide);
  });
  onBeforeUnmount(() => {
    pagehide();
    document.removeEventListener("paste", paste);
    window.removeEventListener("pagehide", pagehide);
  });
  function selectMode(value: "fast" | "best") {
    mode.value = value;
    try {
      localStorage.setItem("tb:bg-mode", JSON.stringify(value));
    } catch {
      /* Optional preference. */
    }
  }
  function context(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Canvas memory allocation failed");
    }
    return ctx;
  }
  function canvas(width: number, height = width) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }
  function fail(
    code: string,
    message: string,
    options: { retry?: boolean; fast?: boolean } = {}
  ) {
    clearInterval(timer);
    timer = undefined;
    error.value = message;
    announcement.value = message;
    canRetry.value = !!options.retry;
    canUseFast.value = !!options.fast && mode.value === "best";
    view.value = "error";
    track?.("background_remove_error", { code, mode: mode.value });
  }
  async function start(selected?: File, isRetry = false) {
    if (busy.value) {
      return;
    }
    if (selected) {
      file = selected;
    }
    if (!file) {
      return;
    }
    const current = file;
    const id = ++runId;
    error.value = "";
    canRetry.value = false;
    canUseFast.value = false;
    detail.value = "";
    size.value = undefined;
    clearUrls();
    if (!supported.value) {
      fail(
        "unsupported",
        "This browser cannot run the background remover. It needs WebAssembly and module Web Workers, which current versions of Chrome, Edge, Firefox and Safari support."
      );
      return;
    }
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(current.type) &&
      !(!current.type && /\.(png|jpe?g|webp)$/i.test(current.name))
    ) {
      fail(
        "unsupported-type",
        "That file type is not supported. Please choose a PNG, JPG or WebP image."
      );
      return;
    }
    if (current.size === 0) {
      fail("empty", "That file is empty. Please choose another image.");
      return;
    }
    if (current.size > 30 * 1024 * 1024) {
      fail(
        "too-large",
        `That file is ${(current.size / 1_048_576).toFixed(1)} MB and the limit is 30 MB. Try a smaller or more compressed image.`
      );
      return;
    }

    let bitmap: ImageBitmap | undefined;
    const canvases: HTMLCanvasElement[] = [];
    try {
      bitmap = await createImageBitmap(current);
    } catch {
      fail(
        "decode",
        "We could not open that image. It may be corrupted or in a format your browser cannot read."
      );
      return;
    }
    if (id !== runId) {
      bitmap.close();
      return;
    }
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    const scale = Math.min(
      1,
      Math.sqrt((lowMemory ? 10e6 : 16e6) / (bitmap.width * bitmap.height)),
      4096 / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    let source: HTMLCanvasElement;
    try {
      source = canvas(width, height);
      canvases.push(source);
      context(source).imageSmoothingQuality = "high";
      context(source).drawImage(bitmap, 0, 0, width, height);
    } catch {
      bitmap.close();
      fail(
        "memory",
        "This image is too large for your browser to handle. Try a smaller one."
      );
      return;
    }
    bitmap.close();
    bitmap = undefined;
    before.value = URL.createObjectURL(current);
    view.value = "work";
    busy.value = true;
    announcement.value = "Starting";
    controller = new AbortController();
    const { signal } = controller;
    const workingMode = mode.value;
    const started = performance.now();
    track?.("background_remove_start", {
      mode: workingMode,
      resized: scale < 1,
      retry: isRetry,
    });
    try {
      api ??= await import("@tinkerbin/background-engine");
      if (id !== runId) {
        return;
      }
      if (!manifest) {
        const response = await fetch("/assets/bg/manifest.json", {
          cache: "no-cache",
          signal,
        });
        if (!response.ok) {
          throw new Error(
            "Background assets are unavailable. Please reload and try again."
          );
        }
        manifest = (await response.json()) as BgManifest;
      }
      if (id !== runId) {
        return;
      }
      engine ??= api.createEngine(manifest!);
      try {
        localStorage.setItem("tb:bg-mode", JSON.stringify(workingMode));
      } catch {
        /* Optional preference. */
      }
      const wasCached = loadedMode === workingMode;
      const spec = manifest.models[workingMode];
      const megabytes = Math.round((manifest.wasm.size + spec.size) / 1e6);
      progress.value = {
        loaded: 0,
        phase: "download",
        total: manifest.wasm.size + spec.size,
      };
      detail.value = wasCached
        ? ""
        : `Downloading ${megabytes} MB the first time. It is saved in your browser for next time.`;
      let announcedProgress = -1;
      await api.runWorkflow(
        engine.load(workingMode, (value) => {
          if (id !== runId) {
            return;
          }
          progress.value = value;
          detail.value =
            value.phase === "init"
              ? "Almost ready."
              : value.phase === "download"
                ? `${(value.loaded / 1e6).toFixed(1)} of ${(value.total / 1e6).toFixed(1)} MB`
                : "";
          if (value.phase === "download" && value.total) {
            const step = Math.floor(
              Math.min(1, value.loaded / value.total) * 10
            );
            if (step !== announcedProgress) {
              announcedProgress = step;
              announcement.value = `Downloading, ${step * 10} percent`;
            }
          }
        }),
        signal
      );
      if (id !== runId) {
        return;
      }
      loadedMode = workingMode;
      progress.value = { loaded: 0, phase: "inference", total: 0 };
      announcement.value = "Removing background";
      inferenceStart = performance.now();
      const updateElapsed = () => {
        const seconds = Math.round((performance.now() - inferenceStart) / 1000);
        detail.value = `${seconds} s${workingMode === "best" ? ". Best quality can take 10 to 30 seconds." : ""}`;
      };
      timer = setInterval(updateElapsed, 1000);
      const specPx = spec.sizePx;
      const plane = specPx * specPx;
      const pre = canvas(specPx);
      canvases.push(pre);
      const ctx = context(pre);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, specPx, specPx);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, specPx, specPx);
      const { data } = ctx.getImageData(0, 0, specPx, specPx);
      const input = new Float32Array(plane * 3);
      const mean =
        spec.norm === "u2net" ? [0.485, 0.456, 0.406] : [0.5, 0.5, 0.5];
      const std = spec.norm === "u2net" ? [0.229, 0.224, 0.225] : [1, 1, 1];
      for (let i = 0; i < plane; i++) {
        for (let channel = 0; channel < 3; channel++) {
          input[channel * plane + i] =
            (data[i * 4 + channel]! / 255 - mean[channel]!) / std[channel]!;
        }
      }
      pre.width = 0;
      const mask = await api.runWorkflow(
        engine.run(input, specPx, workingMode === "best" ? 240_000 : 90_000),
        signal
      );
      if (id !== runId) {
        return;
      }
      if (mask.length !== plane) {
        throw new Error("The model returned an invalid mask. Please retry.");
      }
      const alpha = canvas(specPx);
      canvases.push(alpha);
      const pixels = new ImageData(specPx, specPx);
      for (let i = 0; i < plane; i++) {
        pixels.data[i * 4 + 3] = mask[i]!;
      }
      context(alpha).putImageData(pixels, 0, 0);
      const output = canvas(width, height);
      canvases.push(output);
      const out = context(output);
      out.drawImage(source, 0, 0);
      out.globalCompositeOperation = "destination-in";
      out.imageSmoothingQuality = "high";
      out.drawImage(alpha, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        output.toBlob(resolve, "image/png")
      );
      if (!blob) {
        throw new Error(
          "Your browser could not create the PNG. Try a smaller image."
        );
      }
      if (id !== runId) {
        return;
      }
      clearInterval(timer);
      timer = undefined;
      after.value = URL.createObjectURL(blob);
      resultBlob = blob;
      try {
        canShare.value =
          touch &&
          Boolean(
            navigator.canShare?.({
              files: [new File([blob], "a.png", { type: "image/png" })],
            })
          );
      } catch {
        canShare.value = false;
      }
      const seconds = (performance.now() - started) / 1000;
      size.value = {
        height,
        originalHeight,
        originalWidth,
        resized: scale < 1,
        seconds,
        width,
      };
      track?.("background_remove_complete", {
        first_load: !wasCached,
        mode: workingMode,
        resized: scale < 1,
        seconds: Math.round(seconds),
      });
      view.value = "result";
      announcement.value = "Done. Background removed.";
      if (lowMemory) {
        dispose();
      }
    } catch (error_) {
      if (id === runId && !signal.aborted) {
        dispose();
        const tagged =
          error_ && typeof error_ === "object" && "_tag" in error_
            ? String(error_._tag)
            : "";
        const raw =
          error_ && typeof error_ === "object" && "message" in error_
            ? String(error_.message)
            : "";
        const code =
          tagged.toLowerCase() === "configuration"
            ? "init"
            : tagged.toLowerCase() ||
              (/memory|alloc|RangeError|could not create the png/i.test(raw)
                ? "memory"
                : /download|network|connection/i.test(raw)
                  ? "network"
                  : "inference");
        const message =
          code === "memory"
            ? "Your browser ran out of memory. Close other tabs, or try the Fast model or a smaller image."
            : code === "init"
              ? "The background remover could not start in this browser."
              : code === "inference"
                ? "Something went wrong while removing the background. Please try again."
                : raw ||
                  "Something went wrong while removing the background. Please try again.";
        fail(code, message, {
          fast: ["memory", "timeout", "inference", "init"].includes(code),
          retry: code !== "unsupported",
        });
      }
    } finally {
      clearInterval(timer);
      timer = undefined;
      for (const c of canvases) {
        c.width = 0;
      }
      if (id === runId) {
        busy.value = false;
      }
    }
  }
  const filename = computed(
    () =>
      `${
        file?.name
          .replace(/\.[^.]+$/, "")
          .replaceAll(/[^\w\- ]+/g, "")
          .trim()
          .slice(0, 60)
          .replaceAll(/\s+/g, "-") || "tinkerbin"
      }-no-background.png`
  );
  function download() {
    if (!resultBlob) {
      return;
    }
    const link = document.createElement("a");
    link.href = after.value;
    link.download = filename.value;
    document.body.append(link);
    link.click();
    link.remove();
    track?.("background_remove_download", { mode: mode.value });
    toast(`Downloading ${filename.value}`);
  }
  async function share() {
    if (!resultBlob) {
      return;
    }
    try {
      await navigator.share({
        files: [new File([resultBlob], filename.value, { type: "image/png" })],
      });
      track?.("background_remove_download", { mode: mode.value, via: "share" });
    } catch (error_) {
      if (!(error_ instanceof DOMException && error_.name === "AbortError")) {
        toast("Could not open the share sheet. Use Download PNG instead.");
      }
    }
  }
  function retryFast() {
    selectMode("fast");
    void start(undefined, true);
  }
  function redo() {
    selectMode(mode.value === "best" ? "fast" : "best");
    void start(undefined, true);
  }
  return {
    after,
    announcement,
    before,
    busy,
    canRetry,
    canShare,
    canUseFast,
    cancel,
    detail,
    download,
    error,
    filename,
    mode,
    modeNote,
    percent,
    progress,
    redo,
    reset,
    resizeNote,
    resultInfo,
    retryFast,
    selectMode,
    share,
    size,
    start,
    status,
    supported,
    view,
  };
}

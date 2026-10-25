import { Effect } from "effect";

import type { BgWorkerRequest, BgWorkerResponse } from "./protocol";

export interface BgAsset {
  url: string;
  size: number;
}
export interface BgModel {
  size: number;
  sizePx: number;
  norm: "isnet" | "u2net";
  parts: readonly BgAsset[];
}
export interface BgManifest {
  cacheVersion: string;
  ort: string;
  glue: string;
  worker: string;
  wasm: BgAsset;
  models: Record<"fast" | "best", BgModel>;
}
export interface BgProgress {
  phase: "download" | "init" | "inference";
  loaded: number;
  total: number;
}
export interface BgFailure {
  _tag:
    | "Unsupported"
    | "Network"
    | "Cancelled"
    | "Memory"
    | "Timeout"
    | "Init"
    | "Inference"
    | "Configuration";
  message: string;
}
export const failure = (
  _tag: BgFailure["_tag"],
  message: string
): BgFailure => ({ _tag, message });
export function classify(
  error: unknown,
  stage: "Init" | "Inference" | "Network"
): BgFailure {
  if (
    error &&
    typeof error === "object" &&
    "_tag" in error &&
    "message" in error
  ) {
    return error as BgFailure;
  }
  if (
    /memory|allocation|alloc|out of bounds|RangeError|Aborted/i.test(
      String(error)
    )
  ) {
    return failure(
      "Memory",
      "Your browser ran out of memory. Close other tabs, or try Fast or a smaller image."
    );
  }
  return failure(
    stage,
    stage === "Network"
      ? "Could not download the background remover. Check your connection and try again."
      : stage === "Init"
        ? "The background remover could not start. Try Fast or a smaller image."
        : "Background removal failed. Please try again."
  );
}
export const supportsEngine = () =>
  typeof WebAssembly === "object" &&
  typeof Worker === "function" &&
  typeof createImageBitmap === "function" &&
  typeof fetch === "function";
export function validateManifest(value: BgManifest): void {
  const asset = (entry: BgAsset) =>
    entry &&
    typeof entry.url === "string" &&
    Number.isSafeInteger(entry.size) &&
    entry.size > 0 &&
    entry.size <= 25 * 1024 * 1024;
  if (
    !value ||
    !/^v\d+$/.test(value.cacheVersion) ||
    ![value.ort, value.glue, value.worker].every(
      (url) => typeof url === "string"
    ) ||
    !asset(value.wasm) ||
    !(["fast", "best"] as const).every((mode) => {
      const model = value.models?.[mode];
      return (
        model &&
        Number.isSafeInteger(model.size) &&
        model.size > 0 &&
        Number.isSafeInteger(model.sizePx) &&
        model.sizePx > 0 &&
        ["isnet", "u2net"].includes(model.norm) &&
        Array.isArray(model.parts) &&
        model.parts.length > 0 &&
        model.parts.every(asset) &&
        model.parts.reduce((sum, part) => sum + part.size, 0) === model.size
      );
    })
  ) {
    throw failure(
      "Configuration",
      "Background assets are unavailable or outdated. Reload and try again."
    );
  }
}
export interface BackgroundEngine {
  load(
    mode: "fast" | "best",
    report: (progress: BgProgress) => void
  ): Effect.Effect<void, BgFailure>;
  run(
    input: Float32Array,
    size: number,
    timeoutMs: number
  ): Effect.Effect<Uint8Array, BgFailure>;
  dispose(): Effect.Effect<void>;
}
export function createEngine(manifest: BgManifest): BackgroundEngine {
  let readyMode: "fast" | "best" | undefined;
  let worker: Worker | undefined;
  const dispose = () =>
    Effect.sync(() => {
      worker?.terminate();
      worker = undefined;
      readyMode = undefined;
    });
  const safeUrl = (url: string) => {
    const parsed = new URL(url, location.href);
    if (parsed.origin !== location.origin) {
      throw failure(
        "Configuration",
        "Background assets must use this site’s origin."
      );
    }
    return parsed.href;
  };
  const openCache = async () => {
    try {
      return await caches.open(`tinkerbin-bg-${manifest.cacheVersion}`);
    } catch {
      return;
    }
  };
  const bytes = (asset: BgAsset, report: (n: number) => void) =>
    Effect.tryPromise({
      catch: (error) => classify(error, "Network"),
      try: async (signal) => {
        safeUrl(asset.url);
        const cache = await openCache();
        try {
          const hit = await cache?.match(asset.url);
          if (hit) {
            const data = await hit.arrayBuffer();
            if (data.byteLength === asset.size) {
              report(data.byteLength);
              return data;
            }
            await cache?.delete(asset.url);
          }
        } catch {
          /* Cache storage is optional, including private browsing. */
        }
        const controller = new AbortController();
        const abort = () => controller.abort(signal.reason);
        signal.addEventListener("abort", abort, { once: true });
        let timer: ReturnType<typeof setTimeout> | undefined;
        const bump = () => {
          clearTimeout(timer);
          timer = setTimeout(
            () =>
              controller.abort(
                failure(
                  "Network",
                  "The download stalled. Check your connection and retry."
                )
              ),
            30_000
          );
        };
        bump();
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        try {
          const response = await fetch(asset.url, {
            signal: controller.signal,
          });
          if (!response.ok || !response.body) {
            throw failure(
              "Network",
              `Could not download the background remover (${response.status}).`
            );
          }
          reader = response.body.getReader();
          const output = new Uint8Array(asset.size);
          let offset = 0;
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) {
              break;
            }
            if (offset + chunk.value.length > asset.size) {
              throw failure(
                "Network",
                "The downloaded file was larger than expected. Please retry."
              );
            }
            output.set(chunk.value, offset);
            offset += chunk.value.length;
            report(chunk.value.length);
            bump();
          }
          if (offset !== asset.size) {
            throw failure(
              "Network",
              "The download was incomplete. Please retry."
            );
          }
          try {
            await cache?.put(asset.url, new Response(output.buffer));
          } catch {
            /* Quota must not prevent inference. */
          }
          return output.buffer;
        } catch (error) {
          throw controller.signal.reason ?? error;
        } finally {
          clearTimeout(timer);
          signal.removeEventListener("abort", abort);
          await reader?.cancel().catch(() => {});
        }
      },
    });
  const exchange = <A>(
    message: BgWorkerRequest,
    transfers: Transferable[],
    expected: "ready" | "mask",
    stage: "Init" | "Inference",
    timeoutMs: number
  ) =>
    Effect.callback<A, BgFailure>((resume) => {
      const active = worker;
      if (!active) {
        resume(
          Effect.fail(
            failure("Init", "Choose an image to start the background remover.")
          )
        );
        return;
      }
      const onMessage = ({ data }: MessageEvent<BgWorkerResponse>) => {
        if (data.type === expected) {
          resume(
            Effect.succeed((data.type === "mask" ? data.mask : undefined) as A)
          );
        } else {
          resume(
            Effect.fail(
              classify(data.type === "error" ? data.message : "", stage)
            )
          );
        }
      };
      const onError = () => resume(Effect.fail(classify("", stage)));
      active.addEventListener("message", onMessage);
      active.addEventListener("error", onError);
      active.addEventListener("messageerror", onError);
      try {
        active.postMessage(message, transfers);
      } catch (error) {
        resume(Effect.fail(classify(error, stage)));
      }
      return Effect.sync(() => {
        active.removeEventListener("message", onMessage);
        active.removeEventListener("error", onError);
        active.removeEventListener("messageerror", onError);
      });
    }).pipe(
      Effect.timeoutOrElse({
        duration: timeoutMs,
        orElse: () =>
          Effect.fail(
            failure(
              "Timeout",
              "This is taking too long. Try Fast or a smaller image."
            )
          ),
      })
    );
  const cleanFailure = <A>(effect: Effect.Effect<A, BgFailure>) =>
    effect.pipe(
      Effect.onInterrupt(() => dispose()),
      Effect.tapError(() => dispose())
    );
  return {
    dispose,
    load: (mode, report) =>
      cleanFailure(
        Effect.gen(function* load() {
          if (readyMode === mode && worker) {
            return;
          }
          yield* dispose();
          yield* Effect.try({
            catch: (error) => classify(error, "Init"),
            try: () => validateManifest(manifest),
          });
          if (!supportsEngine()) {
            return yield* Effect.fail(
              failure(
                "Unsupported",
                "This browser needs WebAssembly, Web Workers and image decoding support."
              )
            );
          }
          const spec = manifest.models[mode];
          if (
            !spec ||
            spec.parts.reduce((n, p) => n + p.size, 0) !== spec.size
          ) {
            return yield* Effect.fail(
              failure(
                "Configuration",
                "Background model assets are unavailable. Please reload."
              )
            );
          }
          const total = manifest.wasm.size + spec.size;
          let loaded = 0;
          report({ loaded, phase: "download", total });
          const bump = (n: number) => {
            loaded += n;
            report({ loaded, phase: "download", total });
          };
          const wasm = yield* bytes(manifest.wasm, bump);
          const model = new Uint8Array(spec.size);
          let offset = 0;
          for (const part of spec.parts) {
            const data = yield* bytes(part, bump);
            model.set(new Uint8Array(data), offset);
            offset += data.byteLength;
          }
          report({ loaded, phase: "init", total });
          yield* Effect.try({
            catch: (error) => classify(error, "Init"),
            try: () => {
              safeUrl(manifest.ort);
              safeUrl(manifest.glue);
              worker = new Worker(safeUrl(manifest.worker), { type: "module" });
            },
          });
          yield* exchange<void>(
            {
              glueUrl: manifest.glue,
              model: model.buffer,
              ortUrl: manifest.ort,
              type: "init",
              wasm,
            },
            [wasm, model.buffer],
            "ready",
            "Init",
            90_000
          );
          readyMode = mode;
          yield* Effect.promise(async () => {
            const cache = await openCache();
            const keep = new Set([
              manifest.wasm.url,
              ...Object.values(manifest.models).flatMap((m) =>
                m.parts.map((p) => p.url)
              ),
            ]);
            try {
              for (const request of (await cache?.keys()) ?? []) {
                if (!keep.has(new URL(request.url).pathname)) {
                  await cache?.delete(request);
                }
              }
            } catch {
              /* Optional cache maintenance. */
            }
          });
        })
      ),
    run: (input, size, timeoutMs) =>
      cleanFailure(
        exchange<Uint8Array>(
          { input, size, type: "run" },
          [input.buffer as ArrayBuffer],
          "mask",
          "Inference",
          timeoutMs
        )
      ),
  };
}
export async function runWorkflow<A>(
  effect: Effect.Effect<A, BgFailure>,
  signal?: AbortSignal
): Promise<A> {
  try {
    return await Effect.runPromise(effect, { signal });
  } catch (error) {
    throw signal?.aborted
      ? failure("Cancelled", "Cancelled.")
      : classify(error, "Inference");
  }
}

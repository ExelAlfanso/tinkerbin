import { afterEach, expect, test } from "bun:test";

import { Effect } from "effect";

import { classify, createEngine, runWorkflow } from "./index";
import type { BgManifest } from "./index";

const original = {
  Worker: globalThis.Worker,
  caches: globalThis.caches,
  createImageBitmap: globalThis.createImageBitmap,
  fetch: globalThis.fetch,
  location: globalThis.location,
};
class FakeWorker extends EventTarget {
  static instances: FakeWorker[] = [];
  terminated = false;
  silent = false;
  constructor() {
    super();
    FakeWorker.instances.push(this);
  }
  postMessage(message: { type: string }) {
    if (this.silent) {
      return;
    }
    queueMicrotask(() =>
      this.dispatchEvent(
        new MessageEvent("message", {
          data:
            message.type === "init"
              ? { type: "ready" }
              : { mask: new Uint8Array([255]), type: "mask" },
        })
      )
    );
  }
  terminate() {
    this.terminated = true;
  }
}
const manifest: BgManifest = {
  cacheVersion: "v9999",
  glue: "/glue.mjs",
  models: {
    best: {
      norm: "isnet",
      parts: [{ size: 1, url: "/best.bin" }],
      size: 1,
      sizePx: 1,
    },
    fast: {
      norm: "u2net",
      parts: [{ size: 1, url: "/fast.bin" }],
      size: 1,
      sizePx: 1,
    },
  },
  ort: "/ort.mjs",
  wasm: { size: 1, url: "/engine.wasm" },
  worker: "/worker.js",
};
function browser() {
  FakeWorker.instances = [];
  Object.assign(globalThis, {
    Worker: FakeWorker,
    createImageBitmap: () => {},
    fetch: async () => new Response(new Uint8Array([1])),
    location: {
      href: "https://example.test/background-remover/",
      origin: "https://example.test",
    },
  });
}
afterEach(() => Object.assign(globalThis, original));
test("lazy load, worker reuse, inference and disposal", async () => {
  browser();
  let requests = 0;
  globalThis.fetch = (async () => {
    requests++;
    return new Response(new Uint8Array([1]));
  }) as typeof fetch;
  const engine = createEngine(manifest);
  const progress: string[] = [];
  expect(requests).toBe(0);
  await runWorkflow(engine.load("fast", (p) => progress.push(p.phase)));
  expect(requests).toBe(2);
  await runWorkflow(engine.load("fast", () => {}));
  expect(requests).toBe(2);
  expect(progress).toContain("init");
  expect(await runWorkflow(engine.run(new Float32Array(3), 1, 100))).toEqual(
    new Uint8Array([255])
  );
  await runWorkflow(engine.dispose());
  expect(FakeWorker.instances[0]!.terminated).toBe(true);
});
test("download integrity and same-origin errors remain typed", async () => {
  browser();
  globalThis.fetch = (async () =>
    new Response(new Uint8Array(2))) as typeof fetch;
  await expect(
    runWorkflow(createEngine(manifest).load("fast", () => {}))
  ).rejects.toMatchObject({ _tag: "Network" });
  const invalid = {
    ...manifest,
    wasm: { size: 1, url: "https://other.test/engine.wasm" },
  };
  await expect(
    runWorkflow(createEngine(invalid).load("fast", () => {}))
  ).rejects.toMatchObject({ _tag: "Configuration" });
});
test("Effect inference timeout and interruption terminate the worker", async () => {
  browser();
  const engine = createEngine(manifest);
  await runWorkflow(engine.load("fast", () => {}));
  FakeWorker.instances[0]!.silent = true;
  await expect(
    runWorkflow(engine.run(new Float32Array(3), 1, 5))
  ).rejects.toMatchObject({ _tag: "Timeout" });
  expect(FakeWorker.instances[0]!.terminated).toBe(true);
  await runWorkflow(engine.load("fast", () => {}));
  FakeWorker.instances[1]!.silent = true;
  const controller = new AbortController();
  const result = runWorkflow(
    engine.run(new Float32Array(3), 1, 5000),
    controller.signal
  );
  controller.abort();
  await expect(result).rejects.toMatchObject({ _tag: "Cancelled" });
  expect(FakeWorker.instances[1]!.terminated).toBe(true);
});
test("worker memory messages map to actionable failures", () => {
  expect(classify("RangeError allocation failed", "Init")).toMatchObject({
    _tag: "Memory",
  });
  expect(classify("unrecognized error", "Inference")).toMatchObject({
    _tag: "Inference",
  });
  expect(Effect.isEffect(createEngine(manifest).dispose())).toBe(true);
});
test("invalid manifest fails before network or worker construction", async () => {
  browser();
  await expect(
    runWorkflow(
      createEngine({ ...manifest, models: {} } as BgManifest).load(
        "fast",
        () => {}
      )
    )
  ).rejects.toMatchObject({ _tag: "Configuration" });
  expect(FakeWorker.instances.length).toBe(0);
});
test("cache accepts only exact asset sizes and prunes stale URLs", async () => {
  browser();
  const removed: string[] = [];
  const stored: string[] = [];
  Object.assign(globalThis, {
    caches: {
      open: async () => ({
        delete: async (request: string | Request) => {
          removed.push(typeof request === "string" ? request : request.url);
          return true;
        },
        keys: async () => [new Request("https://example.test/old-model.bin")],
        match: async (url: string) =>
          new Response(new Uint8Array(url.endsWith(".wasm") ? 2 : 1)),
        put: async (url: string) => {
          stored.push(url);
        },
      }),
    },
  });
  await runWorkflow(createEngine(manifest).load("fast", () => {}));
  expect(removed).toEqual([
    "/engine.wasm",
    "https://example.test/old-model.bin",
  ]);
  expect(stored).toEqual(["/engine.wasm"]);
});

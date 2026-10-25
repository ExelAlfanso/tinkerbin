import { expect, test } from "bun:test";

import type { BgWorkerRequest, BgWorkerResponse } from "./protocol";

test("typed worker protocol retains single-threaded initialization, mask normalization and error reporting", async () => {
  const previousSelf = globalThis.self;
  const responses: BgWorkerResponse[] = [];
  const scope = {
    onmessage: undefined as
      | ((event: MessageEvent<BgWorkerRequest>) => Promise<void>)
      | undefined,
    postMessage: (message: BgWorkerResponse) => responses.push(message),
  };
  Object.assign(globalThis, { self: scope });
  const ortUrl = `data:text/javascript,${encodeURIComponent(`
    export const env = { wasm: {} };
    export class Tensor { constructor() {} }
    export const InferenceSession = { create: async () => ({ inputNames: ['input'], outputNames: ['output'], run: async () => ({ output: { data: new Float32Array([2, 4, 6]) } }) }) };
  `)}`;
  try {
    await import("./worker");
    const send = (data: BgWorkerRequest) =>
      scope.onmessage!(new MessageEvent("message", { data }));
    await send({ input: new Float32Array(3), size: 1, type: "run" });
    expect(responses.pop()).toMatchObject({ stage: "run", type: "error" });
    await send({
      glueUrl: "/glue.mjs",
      model: new ArrayBuffer(1),
      ortUrl,
      type: "init",
      wasm: new ArrayBuffer(1),
    });
    expect(responses.pop()).toEqual({ type: "ready" });
    const ort = await import(ortUrl);
    expect(ort.env.wasm.numThreads).toBe(1);
    expect(ort.env.wasm.proxy).toBe(false);
    expect(ort.env.wasm.wasmPaths).toEqual({ mjs: "/glue.mjs" });
    await send({ input: new Float32Array(3), size: 1, type: "run" });
    expect(responses.pop()).toEqual({
      mask: new Uint8Array([0, 128, 255]),
      type: "mask",
    });
  } finally {
    Object.assign(globalThis, { self: previousSelf });
  }
});

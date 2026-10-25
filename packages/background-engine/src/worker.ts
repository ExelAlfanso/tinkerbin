/// <reference lib="webworker" />
import type { InferenceSession } from "onnxruntime-web";

import type { BgWorkerRequest, BgWorkerResponse } from "./protocol";

// Loaded only after image selection; ONNX inference stays off the main thread.
type OrtRuntime = typeof import("onnxruntime-web");
const scope = self as unknown as DedicatedWorkerGlobalScope;
let inputName = "";
let ort: OrtRuntime | undefined;
let session: InferenceSession | undefined;
const post = (message: BgWorkerResponse, transfer: Transferable[] = []) =>
  scope.postMessage(message, transfer);

scope.onmessage = async ({ data: message }: MessageEvent<BgWorkerRequest>) => {
  try {
    if (message.type === "init") {
      ort = (await import(message.ortUrl)) as OrtRuntime;
      ort.env.wasm.numThreads = 1; // The static site does not enable cross-origin isolation.
      ort.env.wasm.proxy = false;
      ort.env.wasm.wasmPaths = { mjs: message.glueUrl };
      ort.env.wasm.wasmBinary = message.wasm;
      session = await ort.InferenceSession.create(
        new Uint8Array(message.model),
        {
          enableCpuMemArena: false,
          enableMemPattern: false,
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        }
      );
      inputName = session.inputNames[0]!;
      post({ type: "ready" });
    } else if (message.type === "run") {
      if (!ort || !session) {
        throw new Error("The background model has not been initialized.");
      }
      const tensor = new ort.Tensor("float32", message.input, [
        1,
        3,
        message.size,
        message.size,
      ]);
      const output = await session.run({ [inputName]: tensor });
      const values = output[session.outputNames[0]!]!.data as Float32Array;
      let minimum = Infinity;
      let maximum = -Infinity;
      for (let i = 0; i < values.length; i++) {
        const value = values[i]!;
        if (value < minimum) {
          minimum = value;
        }
        if (value > maximum) {
          maximum = value;
        }
      }
      const range = maximum - minimum || 1;
      const mask = new Uint8Array(values.length);
      for (let i = 0; i < values.length; i++) {
        mask[i] = Math.round(((values[i]! - minimum) / range) * 255);
      }
      post({ mask, type: "mask" }, [mask.buffer]);
    }
  } catch (error) {
    post({
      message: error instanceof Error ? error.message : String(error),
      stage: message.type,
      type: "error",
    });
  }
};

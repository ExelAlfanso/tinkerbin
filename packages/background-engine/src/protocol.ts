export type BgWorkerRequest =
  | {
      type: "init";
      ortUrl: string;
      glueUrl: string;
      wasm: ArrayBuffer;
      model: ArrayBuffer;
    }
  | { type: "run"; input: Float32Array; size: number };

export type BgWorkerResponse =
  | { type: "ready" }
  | { type: "mask"; mask: Uint8Array }
  | { type: "error"; stage: BgWorkerRequest["type"]; message: string };

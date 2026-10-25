import { expect, test } from "bun:test";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import type { BgManifest } from "../../../packages/background-engine/src/index";
import { CHUNK_SIZE, FILE_CAP } from "./background-assets";

test("prepared assets retain byte totals, same-origin paths and host limits", async () => {
  const output = resolve(import.meta.dir, "../public");
  const manifest = JSON.parse(
    await readFile(resolve(output, "assets/bg/manifest.json"), "utf-8")
  ) as BgManifest;
  expect(manifest.cacheVersion).toBe("v2");
  for (const model of Object.values(manifest.models)) {
    expect(model.parts.reduce((n, part) => n + part.size, 0)).toBe(model.size);
    expect(model.parts.every((part) => part.size <= CHUNK_SIZE)).toBe(true);
  }
  const assets = [
    manifest.wasm,
    ...Object.values(manifest.models).flatMap((model) => model.parts),
  ];
  for (const asset of assets) {
    expect(asset.url.startsWith("/assets/bg/")).toBe(true);
    expect((await stat(resolve(output, asset.url.slice(1)))).size).toBe(
      asset.size
    );
    expect(asset.size).toBeLessThanOrEqual(FILE_CAP);
  }
  for (const url of [manifest.worker, manifest.ort, manifest.glue]) {
    expect(
      (await stat(resolve(output, url.slice(1)))).size
    ).toBeLessThanOrEqual(FILE_CAP);
  }
  expect(manifest.models.best.sizePx).toBe(1024);
  expect(manifest.models.fast.sizePx).toBe(320);
  const worker = await readFile(
    resolve(output, manifest.worker.slice(1)),
    "utf-8"
  );
  expect(worker).toContain("numThreads = 1");
  expect(worker).toContain("wasmBinary = message.wasm");
  expect(worker).not.toContain("import type");
  expect(worker).not.toContain("DedicatedWorkerGlobalScope");
  expect(worker).toContain("import(message.ortUrl)");
  expect(manifest.worker.endsWith(".js")).toBe(true);
});

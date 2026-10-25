import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Transpiler } from "bun";

import type {
  BgAsset,
  BgManifest,
  BgModel,
} from "../../../packages/background-engine/src/index";

export const FILE_CAP = 25 * 1024 * 1024;
export const CHUNK_SIZE = 12 * 1024 * 1024;
const root = resolve(import.meta.dirname, "../../..");
export async function prepareBackgroundAssets(
  output = resolve(root, "apps/web/public")
): Promise<BgManifest> {
  const directory = resolve(output, "assets/bg");
  await mkdir(directory, { recursive: true });
  const emit = async (
    name: string,
    data: Uint8Array,
    extension: string
  ): Promise<BgAsset> => {
    if (data.length > FILE_CAP) {
      throw new Error(`${name} exceeds the 25 MiB host limit`);
    }
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);
    const file = `${name}-${hash}${extension}`;
    await writeFile(resolve(directory, file), data);
    return { size: data.length, url: `/assets/bg/${file}` };
  };
  const ort = resolve(root, "node_modules/onnxruntime-web/dist");
  const runtime = (name: string, file: string, ext: string) =>
    readFile(resolve(ort, file)).then((data) => emit(name, data, ext));
  const model = async (
    name: string,
    file: string,
    sizePx: number,
    norm: BgModel["norm"]
  ): Promise<BgModel> => {
    const data = await readFile(resolve(root, "models", file));
    const parts: BgAsset[] = [];
    for (
      let offset = 0, part = 0;
      offset < data.length;
      offset += CHUNK_SIZE, part++
    ) {
      parts.push(
        await emit(
          `${name}-${part}`,
          data.subarray(offset, offset + CHUNK_SIZE),
          ".bin"
        )
      );
    }
    return { norm, parts, size: data.length, sizePx };
  };
  const manifest: BgManifest = {
    cacheVersion: "v2",
    glue: (await runtime("ort-glue", "ort-wasm-simd-threaded.mjs", ".mjs")).url,
    models: {
      best: await model("isnet-q8", "isnet-general-use.q8.onnx", 1024, "isnet"),
      fast: await model("u2netp", "u2netp.onnx", 320, "u2net"),
    },
    ort: (await runtime("ort", "ort.wasm.min.mjs", ".mjs")).url,
    wasm: await runtime("ort", "ort-wasm-simd-threaded.wasm", ".wasm"),
    worker: (
      await emit(
        "worker",
        new TextEncoder().encode(
          new Transpiler({ loader: "ts", target: "browser" }).transformSync(
            await readFile(
              resolve(root, "packages/background-engine/src/worker.ts"),
              "utf-8"
            )
          )
        ),
        ".js"
      )
    ).url,
  };
  await writeFile(
    resolve(directory, "manifest.json"),
    JSON.stringify(manifest)
  );
  return manifest;
}
if (import.meta.main) {
  const manifest = await prepareBackgroundAssets(
    process.argv[2] && resolve(process.argv[2])
  );
  console.log(
    `Background assets ready: ${Object.values(manifest.models).reduce((n, m) => n + m.parts.length, 0)} model chunks; maximum ${FILE_CAP} bytes per file.`
  );
}

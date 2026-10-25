import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("generated CSP permits only the prerendered inline scripts", () => {
  const output = mkdtempSync(join(tmpdir(), "tinkerbin-csp-"));
  const importMap = '{"imports":{"#entry":"/entry.js"}}';
  const nuxtConfig = "window.__NUXT__={};";
  const jsonData = '{"notExecutable":true}';

  try {
    mkdirSync(join(output, "404"));
    writeFileSync(
      join(output, "index.html"),
      `<script type="importmap">${importMap}</script><script>${nuxtConfig}</script><script type="application/json">${jsonData}</script><script src="/entry.js"></script>`
    );
    writeFileSync(
      join(output, "404", "index.html"),
      "<script>window.notFound=true;</script>"
    );

    const run = Bun.spawnSync({
      cmd: [
        process.execPath,
        resolve(import.meta.dirname, "static-output.ts"),
        output,
      ],
      env: { ...process.env, SITE_URL: "https://tinkerbin.alfanso.xyz" },
    });
    expect(run.exitCode).toBe(0);

    const headers = readFileSync(join(output, "_headers"), "utf-8");
    for (const script of [importMap, nuxtConfig, "window.notFound=true;"]) {
      const hash = createHash("sha256").update(script).digest("base64");
      expect(headers).toContain(`'sha256-${hash}'`);
    }
    const dataHash = createHash("sha256").update(jsonData).digest("base64");
    expect(headers).not.toContain(`'sha256-${dataHash}'`);
    expect(headers.match(/script-src [^;]+/)?.[0]).not.toContain(
      "'unsafe-inline'"
    );
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

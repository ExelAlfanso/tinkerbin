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
      `<html><head></head><body><script type="importmap">${importMap}</script><script>${nuxtConfig}</script><script type="application/json">${jsonData}</script><script src="/entry.js"></script></body></html>`
    );
    writeFileSync(
      join(output, "404", "index.html"),
      "<html><head></head><body><script>window.notFound=true;</script></body></html>"
    );

    const run = Bun.spawnSync({
      cmd: [
        process.execPath,
        resolve(import.meta.dirname, "static-output.ts"),
        output,
      ],
      env: {
        ...process.env,
        ADSENSE_ENABLED: "true",
        ADSENSE_PUBLISHER_ID: "ca-pub-7272507490577483",
        SITE_URL: "https://tinkerbin.alfanso.xyz",
      },
    });
    expect(run.exitCode).toBe(0);

    const headers = readFileSync(join(output, "_headers"), "utf-8");
    const home = readFileSync(join(output, "index.html"), "utf-8");
    const notFound = readFileSync(join(output, "404.html"), "utf-8");
    const adScript =
      '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7272507490577483" crossorigin="anonymous"></script>';
    const adScriptMatches = home.match(
      /adsbygoogle\.js\?client=ca-pub-7272507490577483/g
    );
    expect(adScriptMatches).toHaveLength(1);
    expect(home).toContain(adScript);
    expect(notFound).toContain(adScript);
    expect(readFileSync(join(output, "ads.txt"), "utf-8")).toContain(
      "pub-7272507490577483"
    );
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

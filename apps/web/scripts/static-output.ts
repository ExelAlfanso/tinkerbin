import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { tools } from "../app/data/tools.ts";
import { siteConfig } from "./site-config.ts";

const webRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const out = path.resolve(
  process.cwd(),
  process.argv[2] || path.join(webRoot, ".output/public")
);
const write = (name: string, contents: string) =>
  fs.writeFileSync(path.join(out, name), contents);
const absolute = (route: string) => `${siteConfig.url}${route}`;
const routes = [
  "/",
  "/about/",
  "/privacy/",
  "/terms/",
  ...tools.map(({ path: route }) => route),
  ...(siteConfig.email ? ["/contact/"] : []),
];

fs.mkdirSync(out, { recursive: true });
const notFound = path.join(out, "404", "index.html");
if (!fs.existsSync(notFound)) {
  throw new Error("The static 404 page was not prerendered.");
}
fs.copyFileSync(notFound, path.join(out, "404.html"));
write(
  "robots.txt",
  siteConfig.url
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute("/sitemap.xml")}\n`
    : "# SITE_URL is not configured, so this build asks crawlers to stay away.\nUser-agent: *\nDisallow: /\n"
);

if (siteConfig.url) {
  const urls = routes
    .map((route) => `  <url><loc>${absolute(route)}</loc></url>`)
    .join("\n");
  write(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

write(
  "site.webmanifest",
  JSON.stringify({
    background_color: "#eef1fa",
    description: "Small, free creative tools that run in your browser.",
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/icon-512.png", type: "image/png" },
    ],
    name: "Tinkerbin",
    short_name: "Tinkerbin",
    start_url: "/",
    theme_color: "#14141f",
  })
);

let licenses = fs.readFileSync(path.join(repoRoot, "NOTICE.md"), "utf-8");
for (const name of fs.readdirSync(path.join(repoRoot, "licenses")).sort()) {
  const source = path.join(repoRoot, "licenses", name);
  if (fs.statSync(source).isFile()) {
    licenses += `\n\n===== ${name} =====\n\n${fs.readFileSync(source, "utf-8")}`;
  }
}
write("third-party-licenses.txt", licenses);

if (siteConfig.ads.enabled) {
  write(
    "ads.txt",
    `google.com, ${siteConfig.ads.publisherId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
  );
}

const csp: Record<string, string[]> = {
  "base-uri": ["'none'"],
  "connect-src": ["'self'"],
  "default-src": ["'self'"],
  "font-src": ["'self'"],
  "form-action": ["'none'"],
  "frame-ancestors": ["'none'"],
  "frame-src": ["'none'"],
  "img-src": ["'self'", "data:", "blob:"],
  "manifest-src": ["'self'"],
  "media-src": ["'none'"],
  "object-src": ["'none'"],
  "script-src": ["'self'", "'wasm-unsafe-eval'"],
  "style-src": ["'self'"],
  "style-src-attr": ["'unsafe-inline'"],
  "upgrade-insecure-requests": [],
  "worker-src": ["'self'"],
};
const add = (directive: string, ...origins: string[]) => {
  csp[directive] = [...new Set([...(csp[directive] || []), ...origins])];
};

const inlineScriptHashes = new Set<string>();
const adScript = siteConfig.ads.enabled
  ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${siteConfig.ads.publisherId.replace(/^ca-/, "")}" crossorigin="anonymous"></script>`
  : "";
for (const name of fs.readdirSync(out, { recursive: true })) {
  if (!name.endsWith(".html")) continue;
  const file = path.join(out, name);
  let html = fs.readFileSync(file, "utf-8");
  if (adScript && !html.includes(adScript)) {
    if (!html.includes("<head>")) {
      throw new Error(`Generated page has no <head>: ${name}`);
    }
    html = html.replace("<head>", `<head>${adScript}`);
    fs.writeFileSync(file, html);
  }
  for (const [, attributes, script] of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  )) {
    if (
      script &&
      !/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attributes)
    ) {
      inlineScriptHashes.add(
        `'sha256-${createHash("sha256").update(script).digest("base64")}'`
      );
    }
  }
}
add("script-src", ...[...inlineScriptHashes].sort());

const { analytics } = siteConfig;
if (analytics.provider === "plausible" && analytics.plausibleDomain) {
  add("script-src", "https://plausible.io");
  add("connect-src", "https://plausible.io");
}
if (analytics.provider === "goatcounter" && analytics.goatcounterUrl) {
  add("script-src", "https://gc.zgo.at");
  add("connect-src", new URL(analytics.goatcounterUrl).origin);
}
if (analytics.provider === "cloudflare" && analytics.cloudflareToken) {
  add("script-src", "https://static.cloudflareinsights.com");
  add("connect-src", "https://cloudflareinsights.com");
}
if (siteConfig.ads.enabled) {
  add(
    "script-src",
    "https://pagead2.googlesyndication.com",
    "https://partner.googleadservices.com",
    "https://tpc.googlesyndication.com",
    "https://www.googletagservices.com",
    "https://adservice.google.com"
  );
  csp["frame-src"] = [
    ...csp["frame-src"].filter((origin) => origin !== "'none'"),
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://www.google.com",
    "https://*.safeframe.googlesyndication.com",
  ];
  add("img-src", "https:");
  add(
    "connect-src",
    "https://pagead2.googlesyndication.com",
    "https://*.g.doubleclick.net",
    "https://*.google.com",
    "https://*.googlesyndication.com"
  );
  add("style-src", "'unsafe-inline'");
}

const cspLine = Object.entries(csp)
  .map(([directive, origins]) => [directive, ...origins].join(" "))
  .join("; ");
const cspHeader = `${siteConfig.security.cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"}: ${cspLine}`;
const headers = [
  cspHeader,
  ...(siteConfig.security.hstsMaxAge > 0
    ? [`Strict-Transport-Security: max-age=${siteConfig.security.hstsMaxAge}`]
    : []),
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()",
  "X-Permitted-Cross-Domain-Policies: none",
  ...(siteConfig.url ? [] : ["X-Robots-Tag: noindex, nofollow"]),
];
if (headers.some((header) => header.length > 1900)) {
  throw new Error(
    "A header line exceeds Cloudflare Pages' 2000 character limit"
  );
}

write(
  "_headers",
  `/*\n${headers.map((header) => `  ${header}`).join("\n")}\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/*.png\n  Cache-Control: public, max-age=86400\n\n/favicon.svg\n  Cache-Control: public, max-age=86400\n`
);

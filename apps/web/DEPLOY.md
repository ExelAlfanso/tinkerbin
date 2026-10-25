# Deploying Tinkerbin

Tinkerbin is a statically generated Nuxt site. Cloudflare Pages serves `apps/web/.output/public`; no app server, database, account, or image upload service is required.

## Build settings

Set these as build-time variables in Cloudflare Pages. Values are baked into public output; never put secrets here.

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical origin, for example `https://example.com`. Without it, pages are marked noindex and no sitemap is written. |
| `CONTACT_EMAIL` | Address shown on `/contact/`. Without it, that page is noindex and omitted from the sitemap. |
| `ADSENSE_ENABLED`, `ADSENSE_PUBLISHER_ID`, `ADSENSE_SLOTS` | Optional AdSense configuration. Disabled by default; `ADSENSE_SLOTS` is a JSON object with `top`, `content`, and `bottom` IDs. |
| `ANALYTICS_PROVIDER` | `none` (default), `cloudflare`, `plausible`, or `goatcounter`. |
| `CF_BEACON_TOKEN`, `PLAUSIBLE_DOMAIN`, `GOATCOUNTER_URL` | Credentials/configuration for the selected analytics provider. Analytics honors Do Not Track and Global Privacy Control. |
| `CSP_REPORT_ONLY` | Set `true` to report CSP violations without blocking while validating optional providers. |
| `HSTS_MAX_AGE` | HSTS duration in seconds; defaults to `15552000`. Set `0` to omit HSTS. |

## Cloudflare Pages

- Build command: `bun install --frozen-lockfile && bun run build`
- Output directory: `apps/web/.output/public`
- Runtime: static assets only

The build writes `_headers`, `robots.txt`, `sitemap.xml` when `SITE_URL` is set, `ads.txt` when AdSense is enabled, `site.webmanifest`, and `/third-party-licenses.txt`. Cloudflare Pages applies the CSP and security headers from `_headers`. A build fails if a generated header exceeds Cloudflare Pages' 2,000-character limit.

## Alchemy on Cloudflare Workers

The optional Alchemy stack deploys the same generated directory as a Cloudflare Workers Static Assets site. This is a Workers deployment, not a Cloudflare Pages project. It has no application Worker handler or backend; Cloudflare serves the static assets directly. Keep using the section above if the target must specifically be Cloudflare Pages.

Alchemy uses Cloudflare-backed state. Connect the account and bootstrap the state store once:

```sh
bun alchemy profile edit --add Cloudflare
bun alchemy state bootstrap --backend cloudflare
```

Set the same build-time variables from the table above in the shell/CI environment, then deploy:

```sh
bun install --frozen-lockfile
bun run deploy:cloudflare
```

Alchemy builds `apps/web/.output/public`, deploys it to the stable `prod` stage as an assets-only Worker, returns its URL, preserves folder routes with trailing slashes, and serves the generated `404.html` for unknown paths. The CLI previews the plan and asks before applying it. No custom domain is configured by this stack.

## Local commands

```sh
bun install
bun run dev
bun run build
bun run preview
bun run test
bun run deploy:cloudflare
```

## Privacy and third-party assets

Image tools process user images in the browser. They do not upload images or file names. Background-removal models and the ONNX WebAssembly runtime download only when the visitor starts that tool; model and runtime files are served from this site's origin and cached by the browser. The generated output retains `NOTICE.md` and all files in `licenses/` in `/third-party-licenses.txt`.

Optional analytics and AdSense stay disabled unless configured. Analytics does not load when the browser signals Do Not Track or Global Privacy Control. When enabling third-party services, first build with `CSP_REPORT_ONLY=true`, inspect browser CSP reports, then switch to enforcing CSP.

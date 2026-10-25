# Tinkerbin

Nuxt 4 + Vue 3 + strict TypeScript + Bun workspace monorepo. Effect is used by the background-removal engine for typed browser lifecycle work. Production remains static: no backend, database, login, or image upload service.

```sh
bun install
bun run dev
bun run build
bun run test
bun run deploy:cloudflare
```

Cloudflare Pages serves `apps/web/.output/public` after `bun run build`. The optional Alchemy stack deploys the same static output to Cloudflare Workers; see [deployment options](apps/web/DEPLOY.md).

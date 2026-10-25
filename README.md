# Tinkerbin

Nuxt 4 + Vue 3 + strict TypeScript + Bun workspace monorepo. Pinia manages palette generator state, and Effect handles the background-removal engine's browser lifecycle. Production remains static: no backend, database, login, or image upload service.

GitHub Actions deploys `master` to Alchemy's `prod` stage and `dev` to its `dev` stage on Cloudflare Workers Static Assets. See [deployment options](apps/web/DEPLOY.md) for CI secrets and environment variables.

```sh
bun install
bun run dev
bun run build
bun run test
bun run deploy:cloudflare
```

Cloudflare Pages can also serve `apps/web/.output/public` after `bun run build`.

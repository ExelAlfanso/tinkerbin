import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";

const site = Cloudflare.Website.StaticSite("Tinkerbin", {
  assets: {
    htmlHandling: "auto-trailing-slash",
    notFoundHandling: "404-page",
  },
  command: "bun run build",
  outdir: "apps/web/.output/public",
});

export default Alchemy.Stack(
  "Tinkerbin",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const deployed = yield* site;
    return { url: deployed.url };
  })
);

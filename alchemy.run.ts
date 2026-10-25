import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "Tinkerbin",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    const deployed = yield* Cloudflare.Website.StaticSite("Tinkerbin", {
      assets: {
        htmlHandling: "auto-trailing-slash",
        notFoundHandling: "404-page",
      },
      command: "bun run build",
      domain: stage === "prod" ? "tinkerbin.alfanso.xyz" : undefined,
      outdir: "apps/web/.output/public",
    });
    return { url: deployed.url };
  })
);

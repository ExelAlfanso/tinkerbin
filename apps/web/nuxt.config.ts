import { tools } from "./app/data/tools";
import { siteConfig } from "./scripts/site-config";

const prerenderRoutes = [
  "/",
  "/about/",
  "/privacy/",
  "/terms/",
  "/contact/",
  "/404/",
  ...tools.map(({ path }) => path),
];

export default defineNuxtConfig({
  app: {
    baseURL: "/",
    buildAssetsDir: "/_nuxt/",
    head: {
      link: [
        { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
        { href: "/apple-touch-icon.png", rel: "apple-touch-icon" },
        { href: "/site.webmanifest", rel: "manifest" },
      ],
      script: siteConfig.ads.enabled
        ? [
            {
              async: true,
              crossorigin: "anonymous",
              "data-tinkerbin-ads": "true",
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${siteConfig.ads.publisherId.replace(/^ca-/, "")}`,
            },
          ]
        : [],
    },
  },
  compatibilityDate: "2025-01-01",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  modules: ["@pinia/nuxt"],
  nitro: { prerender: { crawlLinks: false, routes: prerenderRoutes } },
  routeRules: { "/**": { prerender: true } },
  runtimeConfig: {
    public: {
      ads: siteConfig.ads,
      analytics: siteConfig.analytics,
      contactEmail: siteConfig.email,
      siteUrl: siteConfig.url,
    },
  },
  srcDir: "app/",
  ssr: true,
  typescript: { strict: true, typeCheck: true },
});

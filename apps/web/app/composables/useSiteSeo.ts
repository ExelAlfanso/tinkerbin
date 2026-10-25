export interface SiteSeoInput {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  schema?: readonly Record<string, unknown>[];
}

export function useSiteSeo(page: SiteSeoInput): void {
  const siteUrl = useRuntimeConfig().public.siteUrl as string;
  const canonical = siteUrl ? new URL(page.path, siteUrl).href : undefined;
  const indexable = Boolean(canonical) && !page.noindex;
  const image = siteUrl ? new URL("/og-default.png", siteUrl).href : undefined;

  useSeoMeta({
    description: page.description,
    ogDescription: page.description,
    ogImage: image,
    ogImageAlt:
      "Tinkerbin: small, free creative tools that run in your browser",
    ogImageHeight: "630",
    ogImageWidth: "1200",
    ogSiteName: "Tinkerbin",
    ogTitle: page.title,
    ogType: "website",
    ogUrl: canonical,
    robots: indexable
      ? "index,follow,max-image-preview:large"
      : "noindex,nofollow",
    themeColor: "#14141f",
    title: page.title,
    twitterCard: image ? "summary_large_image" : "summary",
    twitterDescription: page.description,
    twitterImage: image,
    twitterTitle: page.title,
  });

  useHead({
    link: canonical ? [{ href: canonical, rel: "canonical" }] : [],
    meta: [{ content: "light dark", name: "color-scheme" }],
    script: canonical
      ? (page.schema || []).map((schema, index) => ({
          innerHTML: JSON.stringify(schema).replaceAll("<", "\\u003c"),
          key: `jsonld-${index}`,
          type: "application/ld+json",
        }))
      : [],
  });
}

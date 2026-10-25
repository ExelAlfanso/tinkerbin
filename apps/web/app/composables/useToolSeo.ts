import type { ToolContent } from "~/data/tools";

import type { SiteSeoInput } from "./useSiteSeo";

export function useToolSeo(tool: ToolContent): void {
  const siteUrl = useRuntimeConfig().public.siteUrl as string;
  const path = `/${tool.slug}/`;
  const url = siteUrl ? new URL(path, siteUrl).href : undefined;
  const homeUrl = siteUrl ? new URL("/", siteUrl).href : undefined;
  const schema: NonNullable<SiteSeoInput["schema"]>[number][] = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      description: tool.description,
      url,
      applicationCategory: tool.schema,
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      ...(tool.features ? { featureList: tool.features } : {}),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@type": "WebSite", name: "Tinkerbin", url: homeUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", item: homeUrl, name: "Tinkerbin", position: 1 },
        { "@type": "ListItem", item: url, name: tool.name, position: 2 },
      ],
    },
  ];

  useSiteSeo({
    description: tool.description,
    path,
    schema,
    title: tool.title,
  });
}

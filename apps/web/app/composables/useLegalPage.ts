import { legalPages } from "~/data/legal-content";
import type { LegalOptions, LegalSlug } from "~/data/legal-content";

const escapeHtml = (value: string) =>
  value.replaceAll(
    /[&<>"']/g,
    (character) =>
      ({
        '"': "&quot;",
        "&": "&amp;",
        "'": "&#39;",
        "<": "&lt;",
        ">": "&gt;",
      })[character] || character
  );

export function useLegalPage(slug: LegalSlug) {
  const config = useRuntimeConfig().public;
  const options: LegalOptions = {
    ANALYTICS: {
      provider: (config.analytics as LegalOptions["ANALYTICS"]).provider,
    },
    CONTACT_EMAIL: config.contactEmail as string,
    adsOn: (config.ads as { enabled: boolean }).enabled,
    esc: escapeHtml,
  };
  const page = legalPages(options)[slug];
  useSiteSeo({
    description: page.description,
    noindex: page.noindex,
    path: `/${slug}/`,
    title: page.title,
  });
  return page;
}

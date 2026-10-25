export type AnalyticsProvider =
  | "none"
  | "cloudflare"
  | "plausible"
  | "goatcounter";
export type AdSlot = "top" | "content" | "bottom";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseSiteUrl(value: string | undefined): string {
  if (!value) {
    return "";
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SITE_URL must be a valid https:// URL");
  }
  const local =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (!local && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must look like https://example.com (with no path, query, or credentials)"
    );
  }
  return url.origin;
}

function parseAdSlots(
  value: string | undefined
): Partial<Record<AdSlot, string>> {
  if (!value) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("ADSENSE_SLOTS must be a JSON object of numeric slot IDs");
  }
  if (!isRecord(parsed)) {
    throw new Error("ADSENSE_SLOTS must be a JSON object");
  }
  const slots: Partial<Record<AdSlot, string>> = {};
  for (const [key, id] of Object.entries(parsed)) {
    if (
      !["top", "content", "bottom"].includes(key) ||
      (id !== "" && !/^\d{4,20}$/.test(String(id)))
    ) {
      throw new Error(`Invalid AdSense slot "${key}"`);
    }
    if (id) {
      slots[key as AdSlot] = String(id);
    }
  }
  return slots;
}

const provider = process.env.ANALYTICS_PROVIDER || "none";
if (!["none", "cloudflare", "plausible", "goatcounter"].includes(provider)) {
  throw new Error(
    "ANALYTICS_PROVIDER must be none, cloudflare, plausible or goatcounter"
  );
}

const plausibleDomain = process.env.PLAUSIBLE_DOMAIN || "";
if (plausibleDomain && !/^[a-z0-9.-]+$/i.test(plausibleDomain)) {
  throw new Error("PLAUSIBLE_DOMAIN must be a bare domain");
}

const goatcounterUrl = process.env.GOATCOUNTER_URL || "";
if (goatcounterUrl && !/^https:\/\/[a-z0-9.-]+\/count$/i.test(goatcounterUrl)) {
  throw new Error(
    "GOATCOUNTER_URL must look like https://you.goatcounter.com/count"
  );
}
const cloudflareToken = process.env.CF_BEACON_TOKEN || "";
if (provider === "plausible" && !plausibleDomain) {
  throw new Error(
    "PLAUSIBLE_DOMAIN is required when Plausible analytics is enabled"
  );
}
if (provider === "goatcounter" && !goatcounterUrl) {
  throw new Error(
    "GOATCOUNTER_URL is required when GoatCounter analytics is enabled"
  );
}
if (provider === "cloudflare" && !cloudflareToken) {
  throw new Error(
    "CF_BEACON_TOKEN is required when Cloudflare analytics is enabled"
  );
}

const adsEnabled = process.env.ADSENSE_ENABLED === "true";
const publisherId = process.env.ADSENSE_PUBLISHER_ID || "";
if (adsEnabled && !/^(ca-)?pub-\d{8,20}$/.test(publisherId)) {
  throw new Error("ADSENSE_PUBLISHER_ID must look like pub-1234567890123456");
}

const hstsMaxAge = Number(process.env.HSTS_MAX_AGE ?? 15_552_000);
if (!Number.isSafeInteger(hstsMaxAge) || hstsMaxAge < 0) {
  throw new Error("HSTS_MAX_AGE must be a non-negative integer");
}

const contactEmail = process.env.CONTACT_EMAIL || "";
if (
  contactEmail &&
  !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(contactEmail)
) {
  throw new Error("CONTACT_EMAIL does not look like an email address");
}

export const siteConfig = {
  ads: {
    enabled: adsEnabled,
    publisherId,
    slots: parseAdSlots(process.env.ADSENSE_SLOTS),
  },
  analytics: {
    cloudflareToken,
    goatcounterUrl,
    plausibleDomain,
    plausibleScript: "https://plausible.io/js/script.tagged-events.js",
    provider: provider as AnalyticsProvider,
    respectDnt: true,
  },
  email: contactEmail,
  security: {
    cspReportOnly: process.env.CSP_REPORT_ONLY === "true",
    hstsMaxAge,
  },
  url: parseSiteUrl(process.env.SITE_URL),
} as const;

export type SiteConfig = typeof siteConfig;

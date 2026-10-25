type AnalyticsProps = Record<string, string | number | boolean | undefined>;
type Plausible = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> }
) => void;
interface GoatCounter {
  count?: (event: { path: string; title: string; event: boolean }) => void;
}

declare global {
  interface Window {
    doNotTrack?: string;
    plausible?: Plausible;
    goatcounter?: GoatCounter;
    __cfBeacon?: (...args: unknown[]) => void;
  }
}

declare module "#app" {
  interface NuxtApp {
    $track: (name: string, properties?: AnalyticsProps) => void;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $track: (name: string, properties?: AnalyticsProps) => void;
  }
}

function respectsPrivacySignals(): boolean {
  return (
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    Boolean(
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
  );
}

export default defineNuxtPlugin(() => {
  const { analytics } = useRuntimeConfig().public as {
    analytics: {
      provider: "none" | "cloudflare" | "plausible" | "goatcounter";
      cloudflareToken: string;
      plausibleDomain: string;
      plausibleScript: string;
      goatcounterUrl: string;
      respectDnt: boolean;
    };
  };
  let enabled =
    Boolean(analytics.provider !== "none") &&
    !(analytics.respectDnt && respectsPrivacySignals());
  const script = document.createElement("script");
  script.defer = true;

  if (
    enabled &&
    analytics.provider === "plausible" &&
    analytics.plausibleDomain
  ) {
    const queue: unknown[] = [];
    const queued = ((...args: Parameters<Plausible>) => {
      queue.push(args);
    }) as Plausible & { q?: unknown[] };
    queued.q = queue;
    window.plausible = window.plausible || queued;
    script.src = analytics.plausibleScript;
    script.dataset.domain = analytics.plausibleDomain;
  } else if (
    enabled &&
    analytics.provider === "goatcounter" &&
    analytics.goatcounterUrl
  ) {
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = analytics.goatcounterUrl;
  } else if (
    enabled &&
    analytics.provider === "cloudflare" &&
    analytics.cloudflareToken
  ) {
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.dataset.cfBeacon = JSON.stringify({
      token: analytics.cloudflareToken,
    });
  } else {
    enabled = false;
  }

  if (enabled) {
    document.head.append(script);
  }

  const track = (name: string, properties: AnalyticsProps = {}) => {
    if (/[?&]tbdebug/.test(location.search)) {
      console.info("[tinkerbin]", name, properties);
    }
    if (!enabled) {
      return;
    }
    if (analytics.provider === "plausible") {
      const props = Object.fromEntries(
        Object.entries(properties).filter(
          (entry): entry is [string, string | number | boolean] =>
            entry[1] !== undefined
        )
      );
      window.plausible?.(name, { props });
    } else if (analytics.provider === "goatcounter") {
      window.goatcounter?.count?.({
        event: true,
        path: `event/${name}${properties.exp ? `/${properties.exp}` : ""}`,
        title: name,
      });
    }
  };

  return { provide: { track } };
});

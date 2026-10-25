<script setup lang="ts">
import type { AdSlot } from "../../../scripts/site-config";

const props = defineProps<{ slot: AdSlot }>();
const ads = useRuntimeConfig().public.ads as {
  enabled: boolean;
  publisherId: string;
  slots: Partial<Record<AdSlot, string>>;
};
const slotId = ads.enabled ? ads.slots[props.slot] : undefined;
const publisherId = ads.publisherId.replace(/^ca-/, "");

onMounted(() => {
  if (!slotId || !/^pub-\d{8,20}$/.test(publisherId)) {
    return;
  }
  const script = document.querySelector<HTMLScriptElement>(
    "script[data-tinkerbin-ads]"
  );
  if (!script) {
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${publisherId}`;
    loader.crossOrigin = "anonymous";
    loader.dataset.tinkerbinAds = "true";
    document.head.append(loader);
  }
  const adsWindow = window as Window & {
    adsbygoogle?: Record<string, unknown>[];
  };
  adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
  adsWindow.adsbygoogle.push({});
});
</script>

<template>
  <aside
    v-if="slotId && publisherId"
    class="ad-slot"
    aria-label="Advertisement"
    :data-slot="slot"
  >
    <span class="ad-label">Advertisement</span>
    <ins
      class="adsbygoogle"
      style="display: block"
      :data-ad-client="`ca-${publisherId}`"
      :data-ad-slot="slotId"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  </aside>
</template>

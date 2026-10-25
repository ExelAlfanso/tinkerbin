<script setup lang="ts">
import "lenis/dist/lenis.css";
import { VueLenis } from "lenis/vue";
import { useTemplateRef } from "vue";

import SiteAdSlot from "~/components/site/AdSlot.vue";
import MascotArt from "~/components/site/MascotArt.vue";
import ToolCard from "~/components/site/ToolCard.vue";
import { bySlug, tools } from "~/data/tools";

const lenisRef = useTemplateRef<InstanceType<typeof VueLenis>>("lenis");
const lenisOptions = { smoothWheel: false };
const siteUrl = useRuntimeConfig().public.siteUrl as string;
const featured = bySlug["background-remover"]!;
const otherTools = tools.filter((tool) => tool !== featured);

const browseTools = (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const target = document.querySelector<HTMLElement>("#tools");
  const lenis = lenisRef.value?.lenis;
  if (!target || !lenis) {
    return;
  }

  event.preventDefault();
  if (window.location.hash !== "#tools") {
    window.history.pushState(null, "", "#tools");
  }
  target.focus({ preventScroll: true });
  lenis.scrollTo(target, { duration: 1 });
};

useSiteSeo({
  description:
    "Free browser tools for creators: remove image backgrounds, extract colors from images, generate color and pixel art palettes, and convert images to pixel art. No uploads.",
  path: "/",
  schema: [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      description: "Small, free creative tools that run in your browser.",
      name: "Tinkerbin",
      url: siteUrl ? new URL("/", siteUrl).href : undefined,
    },
  ],
  title: "Tinkerbin: Free Creative Tools That Run in Your Browser",
});
</script>
<template>
  <VueLenis ref="lenis" root autoRaf :options="lenisOptions" />
  <main id="main">
    <section class="hero">
      <div class="hero-copy">
        <h1>A little box of tools to tinker with.</h1>
        <p class="tag">
          Small, free creative tools that run in your browser. No sign-up,
          nothing to install, and your images never leave your device.
        </p>
        <div class="hero-cta">
          <NuxtLink class="btn btn-primary btn-big" to="/background-remover/"
            >Remove a background</NuxtLink
          >
          <a class="btn btn-big" href="#tools" @click="browseTools"
            >Browse tools</a
          >
        </div>
      </div>
      <div class="bench" aria-hidden="true">
        <span class="spark s1" /><span class="spark s2" /><span
          class="spark s3"
        />
        <span class="bench-art"><MascotArt /></span>
      </div>
    </section>
    <SiteAdSlot slot="top" />
    <section id="tools" aria-labelledby="h-tools" tabindex="-1">
      <h2 id="h-tools" class="section-h">Tools</h2>
      <ul class="tools tools-featured">
        <ToolCard :tool="featured" wide />
      </ul>
      <ul class="tools">
        <ToolCard v-for="tool in otherTools" :key="tool.slug" :tool="tool" />
      </ul>
    </section>
    <section class="points" aria-labelledby="h-why">
      <h2 id="h-why" class="section-h">Why Tinkerbin</h2>
      <ul class="point-list">
        <li>
          <strong>Private by design</strong
          ><span>Image tools run on your device. Nothing is uploaded.</span>
        </li>
        <li>
          <strong>No account</strong
          ><span>Open a tool and use it. No sign-up, no email.</span>
        </li>
        <li>
          <strong>Light and fast</strong
          ><span
            >Each tool loads only when you open it. Heavy AI models download
            only when you choose an image.</span
          >
        </li>
      </ul>
    </section>
    <section class="prose" aria-labelledby="h-what">
      <h2 id="h-what">What is Tinkerbin?</h2>
      <p>
        Tinkerbin is a small toolbox of practical creative tools: an AI
        background remover, an image color extractor, color palette generators
        and a pixel art converter. Each does one job well and runs in your
        browser, so it is quick, private and free to use.
      </p>
    </section>
    <SiteAdSlot slot="bottom" />
  </main>
</template>

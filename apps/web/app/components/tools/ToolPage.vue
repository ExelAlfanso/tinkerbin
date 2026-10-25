<script setup lang="ts">
import SiteAdSlot from "~/components/site/AdSlot.vue";
import type { ToolContent } from "~/data/tools";

defineProps<{
  tool: ToolContent;
  related: ToolContent[];
}>();
</script>

<template>
  <main id="main" :style="{ '--accent': tool.accent }">
    <nav class="crumbs" aria-label="Breadcrumb">
      <NuxtLink to="/">Tinkerbin</NuxtLink> /
      <span aria-current="page">{{ tool.name }}</span>
    </nav>
    <header class="page-head">
      <h1>{{ tool.h1 }}</h1>
      <p class="lede">{{ tool.lede }}</p>
    </header>
    <section class="stage" :aria-label="tool.name">
      <div
        id="app"
        class="app"
        :style="tool.minH ? { minHeight: tool.minH + 'px' } : undefined"
      >
        <noscript>
          <p class="stage-note">
            {{ tool.name }} needs JavaScript. Please turn it on in your browser
            to use it.
          </p>
        </noscript>
        <slot />
      </div>
    </section>
    <SiteAdSlot v-if="tool.adAfter === undefined" slot="content" />
    <section class="prose">
      <h2>How to use it</h2>
      <ol>
        <li v-for="step in tool.how" :key="step">{{ step }}</li>
      </ol>
      <!-- Only the checked-in registry supplies this HTML. User input stays escaped. -->
      <template v-for="(html, i) in tool.about" :key="i">
        <div v-html="html" />
        <SiteAdSlot v-if="tool.adAfter === i" slot="content" />
      </template>
    </section>
    <section class="faq prose" aria-labelledby="faq-h">
      <h2 id="faq-h">Questions</h2>
      <details v-for="[question, answer] in tool.faq" :key="question">
        <summary>{{ question }}</summary>
        <p>{{ answer }}</p>
      </details>
    </section>
    <section class="more" aria-labelledby="more-h">
      <h2 id="more-h">More tools</h2>
      <ul class="more-list">
        <li v-for="item in related" :key="item.slug">
          <NuxtLink
            class="rc"
            :to="'/' + item.slug + '/'"
            :style="{ '--accent': item.accent }"
          >
            <span class="rc-name">{{ item.name }}</span>
            <span class="rc-blurb">{{ item.blurb }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
    <SiteAdSlot slot="bottom" />
  </main>
</template>

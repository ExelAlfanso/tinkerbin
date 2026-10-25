<script setup lang="ts">
import type { ToolContent } from "~/data/tools";

import ToolIcon from "./ToolIcon.vue";

defineProps<{ tool: ToolContent; wide?: boolean }>();
</script>

<template>
  <li>
    <NuxtLink
      :class="['card', { 'card-wide': wide }]"
      :to="`/${tool.slug}/`"
      :style="{ '--accent': tool.accent }"
    >
      <span class="tile"><ToolIcon :slug="tool.slug" /></span>
      <span class="txt"
        ><strong>{{ tool.name }}</strong
        ><span>{{ tool.blurb }}</span></span
      >
    </NuxtLink>
  </li>
</template>

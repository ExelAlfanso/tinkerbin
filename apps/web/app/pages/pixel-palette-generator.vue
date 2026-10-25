<script setup lang="ts">
import Feature from "~/components/tools/PixelPaletteGenerator.vue";
import ToolPage from "~/components/tools/ToolPage.vue";
import { bySlug, tools } from "~/data/tools";

const tool = bySlug["pixel-palette-generator"]!;
useToolSeo(tool);
</script>
<template>
  <ToolPage
    :tool="tool"
    :related="tools.filter((t) => tool.related.includes(t.slug))"
  >
    <Feature />
  </ToolPage>
</template>

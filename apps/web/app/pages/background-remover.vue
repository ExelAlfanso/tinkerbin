<script setup lang="ts">
import BackgroundRemover from "~/components/background/BackgroundRemover.vue";
import ToolPage from "~/components/tools/ToolPage.vue";
import { bySlug, tools } from "~/data/tools";

const tool = bySlug["background-remover"]!;
useToolSeo(tool);
</script>
<template>
  <ToolPage
    :tool="tool"
    :related="tools.filter((item) => tool.related.includes(item.slug))"
    ><BackgroundRemover
  /></ToolPage>
</template>

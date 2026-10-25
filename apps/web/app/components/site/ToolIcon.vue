<script setup lang="ts">
import background from "~/assets/site/icons/background-remover.svg?raw";
import color from "~/assets/site/icons/color-palette-generator.svg?raw";
import extractor from "~/assets/site/icons/image-color-extractor.svg?raw";
import converter from "~/assets/site/icons/pixel-art-palette-converter.svg?raw";
import pixel from "~/assets/site/icons/pixel-palette-generator.svg?raw";

const icons = {
  "background-remover": background,
  "color-palette-generator": color,
  "image-color-extractor": extractor,
  "pixel-art-palette-converter": converter,
  "pixel-palette-generator": pixel,
};
defineProps<{ slug: string }>();
</script>

<template><span v-html="icons[slug as keyof typeof icons]" /></template>

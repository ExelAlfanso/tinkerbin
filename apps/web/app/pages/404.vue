<script setup lang="ts">
import NotFoundPage from "~/components/site/NotFoundPage.vue";

useSiteSeo({
  description: "That page does not exist. Try one of the tools instead.",
  noindex: true,
  path: "/404.html",
  title: "Page not found | Tinkerbin",
});
</script>

<template><NotFoundPage /></template>

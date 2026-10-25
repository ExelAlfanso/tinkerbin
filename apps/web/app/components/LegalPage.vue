<script setup lang="ts">
defineProps<{
  page: { title: string; h1: string; description: string; html: string };
}>();
</script>
<template>
  <main id="main">
    <nav class="crumbs" aria-label="Breadcrumb">
      <NuxtLink to="/">Tinkerbin</NuxtLink> /
      <span aria-current="page">{{ page.h1 }}</span>
    </nav>
    <article class="legal">
      <h1>{{ page.h1 }}</h1>
      <div v-html="page.html" />
    </article>
  </main>
</template>

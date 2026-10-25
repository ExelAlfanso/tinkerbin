<script setup lang="ts">
import { tools } from "~/data/tools";
</script>

<template>
  <main id="main">
    <h1>Nothing in this corner of the box</h1>
    <p>That page does not exist. Try one of the tools:</p>
    <ul class="rec-list">
      <li v-for="tool in tools" :key="tool.slug">
        <NuxtLink
          class="rec"
          :to="tool.path"
          :style="{ '--accent': tool.accent }"
        >
          <strong>{{ tool.name }}</strong
          ><span>{{ tool.blurb }}</span>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

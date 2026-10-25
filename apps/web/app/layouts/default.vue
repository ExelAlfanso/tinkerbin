<script setup lang="ts">
import MascotArt from "~/components/site/MascotArt.vue";
import { tools } from "~/data/tools";
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-head">
    <div class="in">
      <NuxtLink class="logo" to="/" aria-label="Tinkerbin home">
        <MascotArt />
        <span>tinkerbin</span>
      </NuxtLink>
      <nav class="head-links" aria-label="Main">
        <NuxtLink class="nav-link" to="/#tools">Tools</NuxtLink>
        <NuxtLink class="btn btn-accent" to="/background-remover/"
          >Remove background</NuxtLink
        >
      </nav>
    </div>
  </header>
  <slot />
  <footer class="site-foot">
    <div class="in">
      <div>
        <h2>Tools</h2>
        <ul>
          <li v-for="tool in tools" :key="tool.slug">
            <NuxtLink :to="tool.path">{{ tool.name }}</NuxtLink>
          </li>
        </ul>
      </div>
      <div>
        <h2>Tinkerbin</h2>
        <ul>
          <li><NuxtLink to="/">Home</NuxtLink></li>
          <li><NuxtLink to="/about/">About</NuxtLink></li>
          <li><NuxtLink to="/privacy/">Privacy</NuxtLink></li>
          <li><NuxtLink to="/terms/">Terms</NuxtLink></li>
          <li><NuxtLink to="/contact/">Contact</NuxtLink></li>
        </ul>
      </div>
      <p class="fine">
        A little box of tools to tinker with. A small independent project. Your
        images stay in your browser.
      </p>
    </div>
  </footer>
</template>

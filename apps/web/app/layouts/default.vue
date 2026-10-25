<script setup lang="ts">
import { onMounted, ref } from "vue";
import MascotArt from "~/components/site/MascotArt.vue";
import { tools } from "~/data/tools";

const isDark = ref(false);

function setTheme(dark: boolean) {
  isDark.value = dark;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

onMounted(() => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  try {
    const savedTheme = window.localStorage.getItem("theme");
    setTheme(savedTheme === "dark" || (savedTheme !== "light" && prefersDark));
  } catch {
    setTheme(prefersDark);
  }
});

function toggleTheme() {
  setTheme(!isDark.value);
  try {
    window.localStorage.setItem("theme", isDark.value ? "dark" : "light");
  } catch {
    // Keep the selected theme for this page when browser storage is unavailable.
  }
}
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
        <button
          class="btn"
          type="button"
          aria-label="Dark mode"
          :aria-pressed="isDark"
          @click="toggleTheme"
        >
          <svg
            v-if="isDark"
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
          <svg
            v-else
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20.985 12.486A9 9 0 1 1 11.514 3.015a7 7 0 0 0 9.471 9.471Z" />
          </svg>
        </button>
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

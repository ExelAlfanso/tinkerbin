<script setup lang="ts">
import { contrast, textOn } from "@tinkerbin/tools-core";

import { copy } from "./browser";
import PaletteExports from "./PaletteExports.vue";

const { state, generate, lock, edit, preview } = useColorPalette();
const track = useTrack();
const harmonies = [
  ["random", "Random"],
  ["analogous", "Analogous"],
  ["complementary", "Complementary"],
  ["triadic", "Triadic"],
  ["split", "Split"],
  ["tetradic", "Tetradic"],
  ["mono", "Monochrome"],
] as const;
async function copied(c: string) {
  await copy(c.toUpperCase(), `Copied ${c.toUpperCase()}`);
  track("copy", { exp: "color-palette-generator" });
}
function wcag(c: string) {
  const w = contrast(c, "#ffffff");
  const k = contrast(c, "#14141f");
  const best = Math.max(w, k);
  return `${best.toFixed(1)}:1 ${best >= 7 ? "AAA" : best >= 4.5 ? "AA" : best >= 3 ? "large text" : "low"} with ${w >= k ? "white" : "dark"} text`;
}
</script>
<template>
  <div class="controls">
    <fieldset class="chips">
      <legend>Harmony</legend>
      <span v-for="[mode, label] in harmonies" :key="mode" class="chip"
        ><input
          :id="`harmony-${mode}`"
          v-model="state.mode"
          type="radio"
          name="mode"
          :value="mode"
          @change="generate"
        /><label :for="`harmony-${mode}`">{{ label }}</label></span
      >
    </fieldset>
    <div class="field">
      <label for="color-count"
        >Colors <output for="color-count">{{ state.n }}</output></label
      ><input
        id="color-count"
        v-model.number="state.n"
        type="range"
        min="3"
        max="8"
        @input="generate"
      />
    </div>
    <div class="row">
      <button class="btn btn-primary" @click="generate">Generate</button>
      <span class="muted">or press Space</span>
    </div>
  </div>
  <div class="cp-stage">
    <div
      v-for="(c, i) in state.cols"
      :key="i"
      class="cp-col"
      :style="{ background: c, color: textOn(c) }"
    >
      <div class="cp-top">
        <button
          class="cp-btn"
          :aria-pressed="state.locked.has(i)"
          :aria-label="`Lock color ${i + 1}`"
          @click="lock(i)"
        >
          {{ state.locked.has(i) ? "Locked" : "Lock" }}
        </button>
        <button class="cp-btn" :aria-label="`Copy ${c}`" @click="copied(c)">
          Copy
        </button>
      </div>
      <div class="cp-info">
        <span class="cp-hash">#</span>
        <input
          class="hex-input"
          :value="c.slice(1).toUpperCase()"
          maxlength="7"
          :aria-label="`Color ${i + 1} hex value`"
          :style="{ color: textOn(c) }"
          @change="edit(i, $event)"
        />
        <small>{{ wcag(c) }}</small>
      </div>
    </div>
  </div>
  <p class="visually-hidden" aria-live="polite">
    New palette: {{ state.cols.join(", ") }}
  </p>
  <PaletteExports v-if="state.cols.length" :rows="[state.cols]" kind="color" />
  <h2 class="sub-h">See it in use</h2>
  <div
    v-if="preview.bg && preview.ink && preview.accent && preview.alt"
    class="cp-preview"
    aria-label="Palette preview on a sample card"
  >
    <div
      class="mock"
      :style="{ background: preview.bg, color: textOn(preview.bg) }"
    >
      <div
        class="mock-bar"
        :style="{ background: preview.ink, color: textOn(preview.ink) }"
      >
        Your palette in use
      </div>
      <div class="mock-body">
        <strong
          :style="{
            color:
              contrast(preview.ink, preview.bg) > 3
                ? preview.ink
                : textOn(preview.bg),
          }"
          >A heading with this palette</strong
        >
        <p>
          Body text, links and buttons pull from the same colors so you can
          judge them together.
        </p>
        <div class="row">
          <span
            class="mock-btn"
            :style="{
              background: preview.accent,
              color: textOn(preview.accent),
            }"
            >Primary action</span
          >
          <span
            class="mock-btn"
            :style="{ background: preview.alt, color: textOn(preview.alt) }"
            >Secondary</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

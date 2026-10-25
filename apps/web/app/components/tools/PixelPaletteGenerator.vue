<script setup lang="ts">
import { STYLES, textOn } from "@tinkerbin/tools-core";
import type { Hex } from "@tinkerbin/tools-core";
import { watch, useTemplateRef } from "vue";

import { copy } from "./browser";
import PaletteExports from "./PaletteExports.vue";

const { state, generate, resize, lock } = usePixelPalette();
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const track = useTrack();
async function copied(c: string) {
  await copy(c.toUpperCase(), `Copied ${c.toUpperCase()}`);
  track("copy", { exp: "pixel-palette-generator" });
}
function scene(cv: HTMLCanvasElement) {
  const Ht = 40;
  const Wd = 64;
  cv.width = Wd;
  cv.height = Ht;
  const x = cv.getContext("2d")!;
  const R = (i: number) => state.rows[i % state.rows.length]!;
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const dith = (ramp: Hex[], t: number, px: number, py: number) => {
    const n = ramp.length;
    const v = Math.min(n - 1, Math.max(0, t * (n - 1)));
    const lo = Math.floor(v);
    const f = v - lo;
    return ramp[
      Math.min(n - 1, lo + ((bayer[py % 4]![px % 4]! + 0.5) / 16 < f ? 1 : 0))
    ]!;
  };
  const sky = R(1);
  const far = R(2);
  const near = R(3);
  const orb = R(0);
  for (let py = 0; py < Ht; py++) {
    for (let px = 0; px < Wd; px++) {
      let c;
      const h1 = 23 + 4 * Math.sin(px / 9) + 2 * Math.sin(px / 4.3);
      const h2 = 29 + 3 * Math.sin(px / 6 + 2);
      const dx = px - 46;
      const dy = py - 11;
      const d2 = dx * dx + dy * dy;
      if (py >= h2) {
        c = dith(near, 0.15 + ((py - h2) / 12) * 0.35, px, py);
      } else if (py >= h1) {
        c = dith(far, 0.3 + ((py - h1) / 14) * 0.4, px, py);
      } else if (d2 <= 49) {
        const nx = dx / 7;
        const ny = dy / 7;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        c = dith(
          orb,
          Math.max(0.05, Math.min(1, -0.5 * nx - 0.6 * ny + 0.62 * nz)),
          px,
          py
        );
      } else {
        c = dith(sky, 0.25 + (py / h1) * 0.7, px, py);
      }
      x.fillStyle = c;
      x.fillRect(px, py, 1, 1);
    }
  }
}
watch(
  () => state.rows,
  () => {
    if (canvas.value && state.rows.length) {
      scene(canvas.value);
    }
  },
  { flush: "post" }
);
</script>
<template>
  <div class="controls">
    <fieldset class="chips">
      <legend>Style</legend>
      <span v-for="(style, key) in STYLES" :key="key" class="chip"
        ><input
          :id="`style-${key}`"
          v-model="state.style"
          type="radio"
          name="style"
          :value="key"
          @change="generate"
        /><label :for="`style-${key}`">{{ style.name }}</label></span
      >
    </fieldset>
    <div class="field">
      <label for="ramp-count"
        >Ramps <output for="ramp-count">{{ state.ramps }}</output></label
      ><input
        id="ramp-count"
        v-model.number="state.ramps"
        type="range"
        min="2"
        max="8"
        @input="resize"
      />
    </div>
    <div class="field">
      <label for="ramp-steps"
        >Shades per ramp
        <output for="ramp-steps">{{ state.steps }}</output></label
      ><input
        id="ramp-steps"
        v-model.number="state.steps"
        type="range"
        min="3"
        max="7"
        @input="resize"
      />
    </div>
    <label>
      <input v-model="state.gray" type="checkbox" @change="resize" /> Add a gray
      ramp</label
    >
    <div class="row">
      <button class="btn btn-primary" @click="generate">Generate</button>
      <span class="muted">or press Space</span>
    </div>
  </div>
  <div class="palette-stage">
    <div>
      <div class="ramps">
        <div v-for="(row, i) in state.rows" :key="i" class="ramp">
          <button
            class="lock"
            title="Lock this ramp"
            :aria-pressed="state.locked.has(i)"
            :aria-label="`Lock ramp ${i + 1}`"
            @click="lock(i)"
          >
            {{ state.locked.has(i) ? "Locked" : "Lock" }}
          </button>
          <div class="swatch-row">
            <button
              v-for="(c, j) in row"
              :key="j"
              class="sw"
              :style="{ background: c, color: textOn(c) }"
              :aria-label="`Copy ${c}`"
              :title="c.toUpperCase()"
              @click="copied(c)"
            ></button>
          </div>
        </div>
      </div>
      <p class="muted" aria-live="polite">
        {{ state.rows.flat().length }} colors, {{ state.rows.length }} ramps of
        {{ state.steps }}
      </p>
      <PaletteExports
        v-if="state.rows.length"
        :rows="state.rows"
        kind="pixel"
      />
    </div>
    <div class="scene-wrap">
      <canvas
        ref="canvas"
        class="scene"
        role="img"
        aria-label="Small pixel landscape painted with your palette"
      />
      <p class="muted">
        Preview: the first four ramps painted as a tiny dithered scene.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { rgb2hex, textOn } from "@tinkerbin/tools-core";
import { nextTick, useTemplateRef } from "vue";

import { copy } from "./browser";
import ImageInput from "./ImageInput.vue";
import PaletteExports from "./PaletteExports.vue";

const { source, k, colors, picked, hexes, error, image } =
  useImageColorExtractor();
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const track = useTrack();
async function load(s: ImageBitmap | HTMLCanvasElement) {
  image(s);
  await nextTick();
  if (canvas.value) {
    const scale = Math.min(1, 640 / Math.max(s.width, s.height));
    canvas.value.width = Math.max(1, Math.round(s.width * scale));
    canvas.value.height = Math.max(1, Math.round(s.height * scale));
    canvas.value
      .getContext("2d")!
      .drawImage(s, 0, 0, canvas.value.width, canvas.value.height);
  }
}
async function copied(c: string) {
  await copy(c.toUpperCase(), `Copied ${c.toUpperCase()}`);
  track("copy", { exp: "image-color-extractor" });
}
async function pickedCopy(c: string) {
  await copy(c.toUpperCase(), `Copied ${c.toUpperCase()}`);
}
function pick(event: MouseEvent) {
  const c = canvas.value;
  if (!c) {
    return;
  }
  const r = c.getBoundingClientRect();
  const x = Math.max(
    0,
    Math.min(
      c.width - 1,
      Math.floor(((event.clientX - r.left) / r.width) * c.width)
    )
  );
  const y = Math.max(
    0,
    Math.min(
      c.height - 1,
      Math.floor(((event.clientY - r.top) / r.height) * c.height)
    )
  );
  const d = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
  const hex = rgb2hex(d[0]!, d[1]!, d[2]!);
  if (!picked.value.includes(hex)) {
    picked.value.push(hex);
  }
  void copy(hex.toUpperCase(), `Picked ${hex.toUpperCase()}`);
}
</script>
<template>
  <ImageInput @image="load" />
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <div v-if="source" class="ex-stage">
    <div class="ex-left">
      <canvas
        ref="canvas"
        class="ex-canvas"
        aria-label="Your image. Click or tap to pick a color from it."
        tabindex="0"
        @click="pick"
      />
      <p class="muted">
        Tip: click or tap the image to pick any exact pixel color.
      </p>
    </div>
    <div class="ex-results">
      <div class="field">
        <label for="extract-count"
          >Colors to extract <output for="extract-count">{{ k }}</output></label
        ><input
          id="extract-count"
          v-model.number="k"
          type="range"
          min="3"
          max="12"
        />
      </div>
      <div class="strip" aria-hidden="true">
        <span
          v-for="(c, i) in colors"
          :key="i"
          :style="{ background: c.hex, flex: Math.max(0.4, c.share * 10) }"
        />
      </div>
      <ul class="ex-list">
        <li v-for="(c, i) in colors" :key="i">
          <button
            class="ex-chip"
            :style="{ background: c.hex, color: textOn(c.hex) }"
            @click="copied(c.hex)"
          >
            {{ c.hex.toUpperCase() }}
          </button>
          <span class="muted"
            >{{ Math.round(c.share * 100) || "<1" }}% of the image</span
          >
        </li>
      </ul>
      <template v-if="picked.length">
        <h2 class="sub-h">Picked from the image</h2>
        <div class="swatch-row">
          <button
            v-for="c in picked"
            :key="c"
            class="sw"
            :style="{ background: c, color: textOn(c) }"
            @click="pickedCopy(c)"
          >
            {{ c.slice(1) }}
          </button>
        </div>
      </template>
      <PaletteExports v-if="hexes.length" :rows="[hexes]" kind="extract" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PRESETS, textOn, hexList, gpl } from "@tinkerbin/tools-core";
import { nextTick, watch, ref, useTemplateRef } from "vue";

import { copy, download, toBlob } from "./browser";
import ImageInput from "./ImageInput.vue";

const {
  source,
  output,
  width,
  dither,
  preset,
  autoN,
  custom,
  palette,
  linkPal,
  used,
  error,
  image,
} = usePixelArtConverter();
const out = useTemplateRef<HTMLCanvasElement>("out");
const original = useTemplateRef<HTMLCanvasElement>("original");
const status = ref("");
const busy = ref(false);
const track = useTrack();
watch(
  output,
  async () => {
    await nextTick();
    if (output.value && out.value) {
      out.value.width = output.value.width;
      out.value.height = output.value.height;
      out.value.getContext("2d")!.drawImage(output.value, 0, 0);
    }
  },
  { flush: "post" }
);
async function load(s: ImageBitmap | HTMLCanvasElement) {
  image(s);
  await nextTick();
  if (original.value) {
    const scale = Math.min(1, 320 / Math.max(s.width, s.height));
    original.value.width = Math.round(s.width * scale);
    original.value.height = Math.round(s.height * scale);
    original.value
      .getContext("2d")!
      .drawImage(s, 0, 0, original.value.width, original.value.height);
  }
}
async function copied(text: string, message: string) {
  await copy(text, message);
}
async function png(scale: number) {
  if (!output.value || busy.value) {
    return;
  }
  busy.value = true;
  try {
    const c = document.createElement("canvas");
    c.width = output.value.width * scale;
    c.height = output.value.height * scale;
    const x = c.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.drawImage(output.value, 0, 0, c.width, c.height);
    download(`tinkerbin-pixel-${scale}x.png`, await toBlob(c));
    track("export", {
      exp: "pixel-art-palette-converter",
      format: `png-${scale}x`,
    });
  } catch {
    status.value = "Could not create PNG.";
  } finally {
    busy.value = false;
  }
}
function save() {
  download("tinkerbin-converter.gpl", gpl("Converter palette", palette.value));
}
</script>
<template>
  <p v-if="linkPal.length >= 2" class="notice">
    Using the {{ linkPal.length }}-color palette from your link. Add an image to
    see it converted.
  </p>
  <ImageInput @image="load" />
  <div v-if="source" class="controls">
    <label class="field"
      >Palette<select v-model="preset">
        <option v-if="linkPal.length >= 2" value="link">
          From your link ({{ linkPal.length }} colors)
        </option>
        <option v-for="(p, key) in PRESETS" :key="key" :value="key">
          {{ p[0] }}
        </option>
        <option value="auto">Reduce colors (from the image)</option>
        <option value="custom">Custom HEX list</option>
      </select>
    </label>
    <label v-if="preset === 'custom'" class="field"
      >Paste HEX colors (spaces, commas or lines)<textarea
        v-model="custom"
        rows="3"
        placeholder="#1a1c2c #5d275d #b13e53 ..."
      />
    </label>
    <div v-if="preset === 'auto'" class="field">
      <label for="auto-color-count"
        >Colors to keep
        <output for="auto-color-count">{{ autoN }}</output></label
      ><input
        id="auto-color-count"
        v-model.number="autoN"
        type="range"
        min="2"
        max="32"
      />
    </div>
    <label class="field"
      >Pixel width<select v-model.number="width">
        <option v-for="w in [32, 48, 64, 96, 128, 192]" :key="w" :value="w">
          {{ w }} px
        </option>
      </select>
    </label>
    <label class="field"
      >Dithering<select v-model="dither">
        <option value="bayer">Ordered (Bayer, retro)</option>
        <option value="fs">Floyd–Steinberg (smooth)</option>
        <option value="none">None (flat)</option>
      </select>
    </label>
  </div>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <div v-if="source" class="conv-result">
    <div class="conv-pair">
      <figure>
        <canvas
          ref="out"
          v-show="output"
          class="pix-out"
          role="img"
          aria-label="Converted pixel art result"
        />
        <figcaption>Converted</figcaption>
      </figure>
      <figure>
        <canvas
          ref="original"
          class="pix-orig"
          role="img"
          aria-label="Original image"
        />
        <figcaption>Original</figcaption>
      </figure>
    </div>
    <template v-if="output">
      <p class="muted" aria-live="polite">
        {{ output.width }} × {{ output.height }} pixels, {{ used.size }} of
        {{ palette.length }} palette colors used
      </p>
      <h2 class="sub-h">Palette (faded colors are unused)</h2>
      <div class="swatch-row">
        <button
          v-for="(c, i) in palette"
          :key="i"
          class="sw"
          :style="{
            background: c,
            color: textOn(c),
            opacity: used.has(c) ? 1 : 0.35,
          }"
          :aria-label="`Copy ${c}${used.has(c) ? '' : ' (not used)'}`"
          @click="copied(c.toUpperCase(), `Copied ${c.toUpperCase()}`)"
        >
          {{ c.slice(1) }}
        </button>
      </div>
      <div class="row wrap" role="group" aria-label="Download">
        <button
          v-for="scale in [1, 4, 8]"
          :key="scale"
          class="btn"
          :disabled="busy"
          @click="png(scale)"
        >
          Download {{ scale }}×
        </button>
        <button class="btn" @click="copied(hexList(palette), 'Palette copied')">
          Copy palette
        </button>
        <button class="btn" @click="save">Download .gpl</button>
      </div>
    </template>
  </div>
  <p role="status">{{ status }}</p>
</template>

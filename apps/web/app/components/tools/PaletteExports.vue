<script setup lang="ts">
import { cssVars, gpl, hexList } from "@tinkerbin/tools-core";
import type { Hex } from "@tinkerbin/tools-core";
import { ref } from "vue";

import { copy, download, paletteCanvas, toast, toBlob } from "./browser";

const props = defineProps<{
  rows: Hex[][];
  kind: "color" | "pixel" | "extract";
}>();
const busy = ref(false);
const track = useTrack();
const slug = () =>
  props.kind === "color"
    ? "color-palette-generator"
    : props.kind === "pixel"
      ? "pixel-palette-generator"
      : "image-color-extractor";
async function copied(text: string, format: string) {
  const message =
    format === "link"
      ? "Link to this palette copied"
      : format === "hex"
        ? props.kind === "pixel"
          ? "HEX list copied"
          : "HEX values copied"
        : format === "css"
          ? "CSS variables copied"
          : format === "json"
            ? "JSON copied"
            : "Tailwind config copied";
  await copy(text, message);
  track(format === "link" ? "share" : "export", { exp: slug(), format });
}
function text(format: "hex" | "css" | "json" | "tailwind") {
  const cols = props.rows.flat();
  const value =
    format === "hex"
      ? props.kind === "pixel"
        ? hexList(cols)
        : cols.map((c) => c.toUpperCase()).join(", ")
      : format === "css"
        ? cssVars(cols, props.kind === "color" ? "color" : "c")
        : format === "json"
          ? JSON.stringify(cols, null, 2)
          : `colors: {\n${cols.map((c, i) => `  palette${i + 1}: '${c}',`).join("\n")}\n}`;
  void copied(value, format);
}
function share() {
  void copied(location.href, "link");
}
function save(format: "gpl" | "hex") {
  download(
    `tinkerbin-${props.kind === "extract" ? "extracted" : "palette"}.${format}`,
    format === "gpl"
      ? gpl(
          props.kind === "extract" ? "Extracted palette" : "Tinkerbin palette",
          props.rows.flat()
        )
      : `${hexList(props.rows.flat())}\n`
  );
  track("export", { exp: slug(), format });
}
async function png() {
  busy.value = true;
  try {
    download(
      props.kind === "color"
        ? "tinkerbin-colors.png"
        : props.kind === "extract"
          ? "tinkerbin-extracted.png"
          : "tinkerbin-palette.png",
      await toBlob(
        paletteCanvas(
          props.rows,
          props.kind === "color" ? 128 : props.kind === "extract" ? 96 : 32
        )
      )
    );
    track("export", { exp: slug(), format: "png" });
  } catch {
    toast("Could not create PNG.");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="row wrap" role="group" aria-label="Export palette">
    <button class="btn" @click="text('hex')">Copy HEX list</button>
    <template v-if="kind === 'pixel'">
      <button class="btn" @click="save('gpl')">Download .gpl</button>
      <button class="btn" @click="save('hex')">Download .hex</button>
    </template>
    <button v-if="kind !== 'pixel'" class="btn" @click="text('css')">
      Copy CSS
    </button>
    <template v-if="kind === 'color'">
      <button class="btn" @click="text('json')">Copy JSON</button>
      <button class="btn" @click="text('tailwind')">Copy Tailwind</button>
    </template>
    <button v-if="kind === 'extract'" class="btn" @click="save('gpl')">
      Download .gpl
    </button>
    <button class="btn" :disabled="busy" @click="png">Download PNG</button>
    <button v-if="kind === 'pixel'" class="btn" @click="text('css')">
      Copy CSS
    </button>
    <button v-if="kind === 'color'" class="btn" @click="share()">
      Copy link
    </button>
    <NuxtLink
      v-if="kind === 'color'"
      class="btn btn-primary"
      to="/pixel-palette-generator/"
      >Make a pixel palette</NuxtLink
    >
    <NuxtLink
      v-if="kind === 'pixel'"
      class="btn btn-primary"
      :to="
        '/pixel-art-palette-converter/#p=' +
        rows
          .flat()
          .map((c) => c.slice(1))
          .join('-')
      "
      >Use in converter</NuxtLink
    >
    <button v-if="kind === 'pixel'" class="btn" @click="share()">
      Copy link
    </button>
    <NuxtLink
      v-if="kind === 'extract'"
      class="btn btn-primary"
      :to="
        '/pixel-art-palette-converter/#p=' +
        rows
          .flat()
          .map((c) => c.slice(1))
          .join('-')
      "
      >Use as pixel palette</NuxtLink
    >
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from "vue";

import { sampleImage } from "./browser";

const emit = defineEmits<{
  image: [source: ImageBitmap | HTMLCanvasElement];
}>();
const id = useId();
const error = ref("");
const over = ref(false);
const types = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
let request = 0;
async function load(file?: File) {
  const current = ++request;
  error.value = "";
  if (!file) {
    return;
  }
  if (!types.has(file.type)) {
    error.value = "That file type is not supported. Use PNG, JPG, WebP or GIF.";
    return;
  }
  if (file.size > 30 * 1024 * 1024) {
    error.value = `That file is ${(file.size / 1_048_576).toFixed(1)} MB. The limit is 30 MB.`;
    return;
  }
  try {
    const bitmap = await createImageBitmap(file);
    if (current !== request) {
      bitmap.close();
      return;
    }
    if (bitmap.width * bitmap.height > 50e6) {
      bitmap.close();
      error.value =
        "That image is too large to process in the browser. Please use a smaller one.";
      return;
    }
    emit("image", bitmap);
  } catch {
    if (current === request) {
      error.value = "We could not open that image. It may be corrupted.";
    }
  }
}
function change(e: Event) {
  const input = e.target as HTMLInputElement;
  void load(input.files?.[0]);
  input.value = "";
}
function drop(e: DragEvent) {
  over.value = false;
  void load(e.dataTransfer?.files[0]);
}
function paste(e: ClipboardEvent) {
  const file = [...(e.clipboardData?.files || [])].find((f) =>
    types.has(f.type)
  );
  if (file) {
    void load(file);
  }
}
function sample() {
  request++;
  error.value = "";
  emit("image", sampleImage());
}
onMounted(() => document.addEventListener("paste", paste));
onUnmounted(() => {
  request++;
  document.removeEventListener("paste", paste);
});
</script>
<template>
  <div class="image-input">
    <input
      :id="id"
      class="visually-hidden"
      type="file"
      :accept="[...types].join(',')"
      @change="change"
    />
    <label
      :for="id"
      class="drop"
      :class="{ over }"
      @dragover.prevent="over = true"
      @dragleave.prevent="over = false"
      @drop.prevent="drop"
    >
      <span class="drop-main">Drop an image here, or choose one</span>
      <span class="drop-sub"
        >PNG, JPG, WebP or GIF up to 30 MB. Your image stays in your
        browser.</span
      >
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="row">
      <button class="btn" type="button" @click="sample">
        Try a sample image
      </button>
      <span class="muted">You can also paste an image with Ctrl+V.</span>
    </div>
  </div>
</template>

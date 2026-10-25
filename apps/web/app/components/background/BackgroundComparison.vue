<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

const props = defineProps<{
  before: string;
  after: string;
  width: number;
  height: number;
}>();
const position = ref(50);
const view = ref<"slider" | "side">("slider");
const background = ref<"checker" | "white" | "black" | "green">("checker");
const dragging = ref(false);
const comparison = useTemplateRef<HTMLDivElement>("comparison");
function setPosition(value: number) {
  position.value = Math.max(0, Math.min(100, value));
}
function fromEvent(event: PointerEvent) {
  const rect = comparison.value?.getBoundingClientRect();
  if (rect?.width) {
    setPosition(((event.clientX - rect.left) / rect.width) * 100);
  }
}
function pointerDown(event: PointerEvent) {
  dragging.value = true;
  try {
    comparison.value?.setPointerCapture(event.pointerId);
  } catch {
    /* Pointer capture may be unavailable for synthetic events. */
  }
  fromEvent(event);
}
</script>

<template>
  <div class="br-stage">
    <div
      ref="comparison"
      class="br-compare"
      :data-bg="background"
      :data-view="view"
      :style="{
        '--pos': `${position}%`,
        aspectRatio: `${props.width} / ${props.height}`,
      }"
      @pointerdown="pointerDown"
      @pointermove="dragging && fromEvent($event)"
      @pointerup="dragging = false"
      @pointercancel="dragging = false"
    >
      <img
        class="br-after"
        :src="after"
        alt="Result with the background removed"
        :width="width"
        :height="height"
        draggable="false"
      />
      <img
        class="br-before"
        :src="before"
        alt="Original image"
        :width="width"
        :height="height"
        draggable="false"
      />
      <span class="br-tag br-tag-l">Original</span
      ><span class="br-tag br-tag-r">No background</span>
      <span class="br-handle" aria-hidden="true"><span>↔</span></span>
    </div>
    <input
      class="visually-hidden br-range"
      type="range"
      min="0"
      max="100"
      :value="position"
      aria-label="Compare original and result. Use left and right arrow keys."
      @input="
        setPosition(Number(($event.target as HTMLInputElement).value) || 0)
      "
      @focus="comparison?.classList.add('focus')"
      @blur="comparison?.classList.remove('focus')"
    />
  </div>
  <slot />
  <div class="br-controls">
    <fieldset class="chips">
      <legend>Compare</legend>
      <span class="chip"
        ><input
          id="br-view-slider"
          v-model="view"
          type="radio"
          name="brview"
          value="slider"
        /><label for="br-view-slider">Slider</label></span
      >
      <span class="chip"
        ><input
          id="br-view-side"
          v-model="view"
          type="radio"
          name="brview"
          value="side"
        /><label for="br-view-side">Side by side</label></span
      >
    </fieldset>
    <fieldset class="chips">
      <legend>Preview on</legend>
      <span class="chip"
        ><input
          id="br-bg-checker"
          v-model="background"
          type="radio"
          name="brbg"
          value="checker"
        /><label for="br-bg-checker">Transparent</label></span
      >
      <span class="chip"
        ><input
          id="br-bg-white"
          v-model="background"
          type="radio"
          name="brbg"
          value="white"
        /><label for="br-bg-white">White</label></span
      >
      <span class="chip"
        ><input
          id="br-bg-black"
          v-model="background"
          type="radio"
          name="brbg"
          value="black"
        /><label for="br-bg-black">Black</label></span
      >
      <span class="chip"
        ><input
          id="br-bg-green"
          v-model="background"
          type="radio"
          name="brbg"
          value="green"
        /><label for="br-bg-green">Green</label></span
      >
    </fieldset>
  </div>
</template>

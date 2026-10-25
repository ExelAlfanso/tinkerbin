<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from "vue";

import { useBackgroundRemover } from "~/composables/useBackgroundRemover";

import BackgroundComparison from "./BackgroundComparison.vue";

const {
  mode,
  view,
  supported,
  busy,
  error,
  before,
  after,
  detail,
  announcement,
  progress,
  percent,
  status,
  modeNote,
  resultInfo,
  resizeNote,
  size,
  canRetry,
  canUseFast,
  canShare,
  share,
  download,
  selectMode,
  start,
  retryFast,
  redo,
  cancel,
  reset,
} = useBackgroundRemover();
const input = useTemplateRef<HTMLInputElement>("file");
const over = ref(false);
const errorPanel = useTemplateRef<HTMLDivElement>("errorPanel");
const resultPanel = useTemplateRef<HTMLDivElement>("resultPanel");
function choose(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (file) {
    void start(file);
  }
}
function dragEnter(event: DragEvent) {
  if (
    view.value === "idle" &&
    [...(event.dataTransfer?.types ?? [])].includes("Files")
  ) {
    over.value = true;
  }
}
function drop(event: DragEvent) {
  over.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && supported.value) {
    void start(file);
  }
}
watch(view, async (current) => {
  await nextTick();
  if (current === "error") {
    errorPanel.value?.scrollIntoView({ block: "start" });
  }
  if (current === "result") {
    resultPanel.value?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
});
</script>

<template>
  <div
    class="background-tool"
    @dragenter.prevent="dragEnter"
    @dragover.prevent="dragEnter"
    @dragleave.prevent="over = false"
    @drop.prevent="drop"
  >
    <div v-if="view === 'idle'" class="br-idle">
      <input
        id="br-file"
        ref="file"
        class="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        :disabled="busy || !supported"
        @change="choose"
      />
      <p class="br-title">Remove Background</p>
      <label class="drop br-drop" :class="{ over }" for="br-file">
        <span class="drop-main">Drop an image here or click to upload</span>
        <span class="drop-sub">PNG, JPG or WebP, up to 30 MB</span>
      </label>
      <div class="row wrap">
        <button
          class="btn btn-primary btn-big"
          type="button"
          :disabled="!supported"
          @click="input?.click()"
        >
          Upload Image
        </button>
        <span class="br-private"
          >Your image is processed locally in your browser. It is never
          uploaded.</span
        >
      </div>
      <p v-if="!supported" class="notice" role="alert">
        This browser cannot run the background remover. It needs WebAssembly and
        module Web Workers, which current versions of Chrome, Edge, Firefox and
        Safari support.
      </p>
      <fieldset class="chips">
        <legend>Model</legend>
        <span class="chip"
          ><input
            id="bgmode-best"
            type="radio"
            name="bgmode"
            :checked="mode === 'best'"
            @change="selectMode('best')"
          /><label for="bgmode-best">Best quality</label></span
        >
        <span class="chip"
          ><input
            id="bgmode-fast"
            type="radio"
            name="bgmode"
            :checked="mode === 'fast'"
            @change="selectMode('fast')"
          /><label for="bgmode-fast">Fast</label></span
        >
      </fieldset>
      <p class="muted br-note">{{ modeNote }}</p>
    </div>

    <div v-else-if="view === 'work'" class="br-work">
      <img class="br-thumb" :src="before" alt="Your image" />
      <div>
        <p class="br-phase">{{ status }}</p>
        <div
          class="br-progress"
          :class="{ indeterminate: progress?.phase !== 'download' }"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progress?.phase === 'download' ? percent : undefined"
          aria-label="Progress"
        >
          <span
            :style="{
              width: progress?.phase === 'download' ? `${percent}%` : undefined,
            }"
          />
        </div>
        <p class="muted">{{ detail }}</p>
        <button class="btn btn-ghost" type="button" @click="cancel">
          Cancel
        </button>
      </div>
    </div>

    <div
      v-else-if="view === 'error'"
      ref="errorPanel"
      class="br-error"
      role="alert"
    >
      <p class="br-title">That did not work</p>
      <p class="br-err-msg">{{ error }}</p>
      <div class="row wrap">
        <button
          v-if="canRetry"
          class="btn btn-primary"
          type="button"
          @click="start()"
        >
          Try again
        </button>
        <button v-if="canUseFast" class="btn" type="button" @click="retryFast">
          Try the Fast model
        </button>
        <button class="btn btn-ghost" type="button" @click="reset">
          Choose another image
        </button>
      </div>
    </div>

    <div
      v-else-if="view === 'result' && size"
      ref="resultPanel"
      class="br-result"
    >
      <BackgroundComparison
        :before="before"
        :after="after"
        :width="size.width"
        :height="size.height"
      >
        <p class="muted br-info">{{ resultInfo }}</p>
        <p v-if="resizeNote" class="notice">{{ resizeNote }}</p>
      </BackgroundComparison>
      <div class="row wrap br-actions">
        <button class="btn btn-primary btn-big" type="button" @click="download">
          Download PNG
        </button>
        <button v-if="canShare" class="btn" type="button" @click="share">
          Save to Photos / Share
        </button>
        <button class="btn" type="button" @click="reset">Remove Another</button>
        <button class="btn btn-ghost" type="button" @click="redo">
          {{
            mode === "best" ? "Redo with Fast model" : "Redo with Best quality"
          }}
        </button>
      </div>
      <p class="muted">
        The download is a transparent PNG at the size shown above. Your image
        never left this device.
      </p>
    </div>
    <p class="visually-hidden" role="status" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>

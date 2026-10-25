import { medianCut, rgb2hex } from "@tinkerbin/tools-core";
import type { Hex } from "@tinkerbin/tools-core";
import { computed, onUnmounted, ref, shallowRef, watch } from "vue";

import { downscale } from "~/components/tools/browser";

export function useImageColorExtractor() {
  const source = shallowRef<ImageBitmap | HTMLCanvasElement | null>(null);
  const k = ref(6);
  const colors = ref<
    {
      hex: Hex;
      share: number;
    }[]
  >([]);
  const picked = ref<Hex[]>([]);
  const error = ref("");
  const track = useTrack();
  let started = false;
  const hexes = computed(() => [
    ...colors.value.map((c) => c.hex),
    ...picked.value,
  ]);
  function extract() {
    if (!source.value) {
      return;
    }
    try {
      const s = source.value;
      const scale = Math.min(1, 200 / Math.max(s.width, s.height));
      const sample = downscale(
        s,
        s.width,
        s.height,
        Math.max(1, Math.round(s.width * scale)),
        Math.max(1, Math.round(s.height * scale))
      );
      colors.value = medianCut(
        sample.getContext("2d")!.getImageData(0, 0, sample.width, sample.height)
          .data,
        k.value
      ).map((c) => ({ hex: rgb2hex(...c.rgb), share: c.share }));
      error.value = "";
    } catch {
      error.value = "Could not process that image. Please try a smaller image.";
    }
  }
  function image(s: ImageBitmap | HTMLCanvasElement) {
    if (source.value && "close" in source.value) {
      source.value.close();
    }
    source.value = s;
    picked.value = [];
    extract();
    if (!error.value) {
      if (!started) {
        started = true;
        track("start", { exp: "image-color-extractor" });
      }
      track("complete", { exp: "image-color-extractor" });
    }
  }
  watch(k, extract);
  onUnmounted(() => {
    if (source.value && "close" in source.value) {
      source.value.close();
    }
  });
  return { colors, error, hexes, image, k, picked, source };
}

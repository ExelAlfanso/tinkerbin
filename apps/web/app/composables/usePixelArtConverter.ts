import {
  PRESETS,
  parseHexList,
  medianCut,
  rgb2hex,
  convertPixels,
} from "@tinkerbin/tools-core";
import type { Hex, Dither } from "@tinkerbin/tools-core";
import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";

import { downscale } from "~/components/tools/browser";

export function usePixelArtConverter() {
  const source = shallowRef<ImageBitmap | HTMLCanvasElement | null>(null);
  const output = shallowRef<HTMLCanvasElement | null>(null);
  const width = ref(64);
  const dither = ref<Dither>("bayer");
  const preset = ref("pico8");
  const autoN = ref(8);
  const custom = ref("");
  const palette = ref<Hex[]>([]);
  const linkPal = ref<Hex[]>([]);
  const used = ref(new Set<string>());
  const error = ref("");
  const track = useTrack();
  let started = false;
  function convert() {
    output.value = null;
    error.value = "";
    if (!source.value) {
      return;
    }
    try {
      const s = source.value;
      const th = Math.max(1, Math.round((width.value * s.height) / s.width));
      const small = downscale(s, s.width, s.height, width.value, th);
      const ctx = small.getContext("2d")!;
      const img = ctx.getImageData(0, 0, small.width, small.height);
      const pal =
        preset.value === "auto"
          ? medianCut(img.data, autoN.value).map((c) => rgb2hex(...c.rgb))
          : preset.value === "link"
            ? linkPal.value
            : preset.value === "custom"
              ? parseHexList(custom.value)
              : parseHexList(PRESETS[preset.value]?.[1] || "");
      palette.value = pal;
      const result = convertPixels(
        img.data,
        small.width,
        small.height,
        pal,
        dither.value
      );
      img.data.set(result.pixels);
      ctx.putImageData(img, 0, 0);
      output.value = small;
      const colors = new Set<string>();
      for (let i = 0; i < img.data.length; i += 4) {
        if (img.data[i + 3]) {
          colors.add(rgb2hex(img.data[i]!, img.data[i + 1]!, img.data[i + 2]!));
        }
      }
      used.value = colors;
    } catch (error_) {
      error.value =
        error_ instanceof Error
          ? error_.message
          : "Could not convert that image.";
    }
  }
  function image(s: ImageBitmap | HTMLCanvasElement) {
    if (source.value && "close" in source.value) {
      source.value.close();
    }
    source.value = s;
    convert();
    if (!started) {
      started = true;
      track("start", { exp: "pixel-art-palette-converter" });
    }
    track("complete", { exp: "pixel-art-palette-converter" });
  }
  watch([width, dither, preset, autoN, custom], convert);
  onMounted(() => {
    linkPal.value = parseHexList(
      new URLSearchParams(location.hash.slice(1)).get("p") || ""
    );
    if (linkPal.value.length >= 2) {
      preset.value = "link";
    }
  });
  onUnmounted(() => {
    if (source.value && "close" in source.value) {
      source.value.close();
    }
  });
  return {
    autoN,
    custom,
    dither,
    error,
    image,
    linkPal,
    output,
    palette,
    preset,
    source,
    used,
    width,
  };
}

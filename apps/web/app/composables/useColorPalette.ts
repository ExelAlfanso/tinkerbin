import {
  generateColors,
  parseHexList,
  validHex,
  normHex,
  hex2hsl,
} from "@tinkerbin/tools-core";
import type { ColorOptions } from "@tinkerbin/tools-core";
import { computed, onMounted, onUnmounted, reactive } from "vue";

import { pushHash, spaceHandler } from "~/components/tools/browser";

export function useColorPalette() {
  const state = reactive<ColorOptions>({
    cols: [],
    locked: new Set(),
    mode: "random",
    n: 5,
  });
  const track = useTrack();
  let started = false;
  const save = () =>
    pushHash(`c=${state.cols.map((c) => c.slice(1)).join("-")}`);
  function generate() {
    state.cols = generateColors(state);
    save();
    if (!started) {
      started = true;
      track("start", { exp: "color-palette-generator" });
    }
  }
  function lock(i: number) {
    state.locked.has(i) ? state.locked.delete(i) : state.locked.add(i);
  }
  function edit(i: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (validHex(input.value)) {
      state.cols[i] = normHex(input.value);
      state.locked.add(i);
      save();
    } else {
      input.value = state.cols[i]!.slice(1).toUpperCase();
    }
  }
  const preview = computed(() => {
    const sorted = [...state.cols].sort(
      (a, b) => hex2hsl(b)[2] - hex2hsl(a)[2]
    );
    return {
      accent: [...state.cols].sort((a, b) => hex2hsl(b)[1] - hex2hsl(a)[1])[0],
      alt: sorted[Math.floor(sorted.length / 2)],
      bg: sorted[0],
      ink: sorted.at(-1),
    };
  });
  const key = spaceHandler(generate);
  onMounted(() => {
    const cols = parseHexList(
      new URLSearchParams(location.hash.slice(1)).get("c") || ""
    );
    if (cols.length >= 3 && cols.length <= 8) {
      state.cols = cols;
      state.n = cols.length;
      save();
    } else {
      generate();
    }
    started = false;
    document.addEventListener("keydown", key);
  });
  onUnmounted(() => document.removeEventListener("keydown", key));
  return { edit, generate, lock, preview, state };
}

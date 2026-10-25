import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, reactive } from "vue";

import {
  generateColors,
  hex2hsl,
  normHex,
  validHex,
} from "@tinkerbin/tools-core";
import type { ColorOptions } from "@tinkerbin/tools-core";

export const useColorPaletteStore = defineStore("color-palette", () => {
  const state = reactive<ColorOptions>({
    cols: [],
    locked: new Set(),
    mode: "random",
    n: 5,
  });

  const preview = computed(() => {
    const sorted = [...state.cols].sort(
      (a, b) => hex2hsl(b)[2] - hex2hsl(a)[2]
    );
    return {
      accent: [...state.cols].sort(
        (a, b) => hex2hsl(b)[1] - hex2hsl(a)[1]
      )[0],
      alt: sorted[Math.floor(sorted.length / 2)],
      bg: sorted[0],
      ink: sorted.at(-1),
    };
  });

  function generate() {
    state.cols = generateColors(state);
  }

  function restore(cols: ColorOptions["cols"]) {
    state.cols = cols;
    state.locked.clear();
    state.n = cols.length;
  }

  function lock(index: number) {
    state.locked.has(index)
      ? state.locked.delete(index)
      : state.locked.add(index);
  }

  function setColor(index: number, value: string) {
    if (!validHex(value) || !state.cols[index]) {
      return false;
    }
    state.cols[index] = normHex(value);
    state.locked.add(index);
    return true;
  }

  return { generate, lock, preview, restore, setColor, state };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useColorPaletteStore, import.meta.hot)
  );
}

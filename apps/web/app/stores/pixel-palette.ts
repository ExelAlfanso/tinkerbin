import { acceptHMRUpdate, defineStore } from "pinia";
import { reactive } from "vue";

import { generateRamps } from "@tinkerbin/tools-core";
import type { RampOptions } from "@tinkerbin/tools-core";

export const usePixelPaletteStore = defineStore("pixel-palette", () => {
  const state = reactive<RampOptions>({
    gray: true,
    locked: new Set(),
    ramps: 5,
    rows: [],
    steps: 5,
    style: "natural",
  });

  function generate() {
    state.rows = generateRamps(state);
  }

  function resize() {
    state.locked.clear();
    generate();
  }

  function restore(rows: RampOptions["rows"], steps: number, gray: boolean) {
    state.steps = steps;
    state.gray = gray;
    state.locked.clear();
    state.rows = rows;
    state.ramps = Math.max(2, Math.min(8, rows.length - (gray ? 1 : 0)));
  }

  function lock(index: number) {
    state.locked.has(index)
      ? state.locked.delete(index)
      : state.locked.add(index);
  }

  return { generate, lock, resize, restore, state };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(usePixelPaletteStore, import.meta.hot)
  );
}

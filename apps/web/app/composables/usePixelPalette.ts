import { generateRamps, parseHexList, STYLES } from "@tinkerbin/tools-core";
import type { RampOptions, PaletteStyle } from "@tinkerbin/tools-core";
import { onMounted, onUnmounted, reactive } from "vue";

import { pushHash, spaceHandler } from "~/components/tools/browser";

export function usePixelPalette() {
  const state = reactive<RampOptions>({
    gray: true,
    locked: new Set(),
    ramps: 5,
    rows: [],
    steps: 5,
    style: "natural",
  });
  const track = useTrack();
  let started = false;
  function save() {
    pushHash(
      `r=${state.steps}&g=${state.gray ? 1 : 0}&p=${state.rows
        .flat()
        .map((c) => c.slice(1))
        .join("-")}`
    );
  }
  function generate() {
    state.rows = generateRamps(state);
    save();
    if (!started) {
      started = true;
      track("start", { exp: "pixel-palette-generator" });
    }
  }
  function resize() {
    state.locked.clear();
    generate();
  }
  function lock(i: number) {
    state.locked.has(i) ? state.locked.delete(i) : state.locked.add(i);
  }
  const key = spaceHandler(generate);
  onMounted(() => {
    const style = new URLSearchParams(location.search).get("style");
    if (style && style in STYLES) {
      state.style = style as PaletteStyle;
    }
    const hp = new URLSearchParams(location.hash.slice(1));
    const cols = parseHexList(hp.get("p") || "");
    state.steps = Math.min(7, Math.max(3, Number(hp.get("r")) || 5));
    if (cols.length >= state.steps * 2) {
      state.gray = hp.get("g") !== "0";
      for (let i = 0; i + state.steps <= cols.length; i += state.steps) {
        state.rows.push(cols.slice(i, i + state.steps));
      }
      state.ramps = Math.max(
        2,
        Math.min(8, state.rows.length - (state.gray ? 1 : 0))
      );
      save();
    } else {
      generate();
    }
    started = false;
    document.addEventListener("keydown", key);
  });
  onUnmounted(() => document.removeEventListener("keydown", key));
  return { generate, lock, resize, state };
}

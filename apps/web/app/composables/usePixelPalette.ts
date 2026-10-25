import { parseHexList, STYLES } from "@tinkerbin/tools-core";
import type { PaletteStyle } from "@tinkerbin/tools-core";
import { onMounted, onUnmounted } from "vue";

import { pushHash, spaceHandler } from "~/components/tools/browser";
import { usePixelPaletteStore } from "~/stores/pixel-palette";

export function usePixelPalette() {
  const store = usePixelPaletteStore();
  const { state } = store;
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
    store.generate();
    save();
    trackStart();
  }
  function resize() {
    store.resize();
    save();
    trackStart();
  }
  function lock(i: number) {
    store.lock(i);
  }
  function trackStart() {
    if (!started) {
      started = true;
      track("start", { exp: "pixel-palette-generator" });
    }
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
      const gray = hp.get("g") !== "0";
      const rows = [];
      for (let i = 0; i + state.steps <= cols.length; i += state.steps) {
        rows.push(cols.slice(i, i + state.steps));
      }
      store.restore(rows, state.steps, gray);
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

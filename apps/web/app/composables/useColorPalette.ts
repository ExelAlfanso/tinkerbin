import { parseHexList } from "@tinkerbin/tools-core";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted } from "vue";

import { pushHash, spaceHandler } from "~/components/tools/browser";
import { useColorPaletteStore } from "~/stores/color-palette";

export function useColorPalette() {
  const store = useColorPaletteStore();
  const state = store.state;
  const { preview } = storeToRefs(store);
  const track = useTrack();
  let started = false;
  const save = () =>
    pushHash(`c=${state.cols.map((c) => c.slice(1)).join("-")}`);
  function generate() {
    store.generate();
    save();
    if (!started) {
      started = true;
      track("start", { exp: "color-palette-generator" });
    }
  }
  function lock(i: number) {
    store.lock(i);
  }
  function edit(i: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (store.setColor(i, input.value)) {
      save();
    } else {
      input.value = state.cols[i]!.slice(1).toUpperCase();
    }
  }
  const key = spaceHandler(generate);
  onMounted(() => {
    const cols = parseHexList(
      new URLSearchParams(location.hash.slice(1)).get("c") || ""
    );
    if (cols.length >= 3 && cols.length <= 8) {
      store.restore(cols);
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

import type { Palette } from "@tinkerbin/tools-core";

export function downscale(
  src: CanvasImageSource,
  sw: number,
  sh: number,
  tw: number,
  th: number
) {
  let cur = src;
  let cw = sw;
  let ch = sh;
  while (cw / 2 >= tw && ch / 2 >= th) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(cw / 2);
    c.height = Math.ceil(ch / 2);
    const x = c.getContext("2d")!;
    x.imageSmoothingQuality = "high";
    x.drawImage(cur, 0, 0, c.width, c.height);
    cur = c;
    cw = c.width;
    ch = c.height;
  }
  const out = document.createElement("canvas");
  out.width = tw;
  out.height = th;
  const ox = out.getContext("2d")!;
  ox.imageSmoothingQuality = "high";
  ox.drawImage(cur, 0, 0, tw, th);
  return out;
}
// Procedural sample image so every visitor can try image tools instantly
export function sampleImage() {
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 300;
  const x = c.getContext("2d")!;
  x.fillStyle = "#12123a";
  x.fillRect(0, 0, 480, 300);
  const sky = x.createLinearGradient(0, 0, 0, 190);
  (
    [
      ["#2b1b5e", 0],
      ["#7b2d8e", 0.35],
      ["#ff5c8a", 0.65],
      ["#ffb347", 0.9],
      ["#ffe08a", 1],
    ] as [string, number][]
  ).forEach(([col, p]) => sky.addColorStop(p, col));
  x.fillStyle = sky;
  x.fillRect(0, 0, 480, 190);
  x.fillStyle = "#fff3b0";
  x.beginPath();
  x.arc(330, 150, 46, 0, 7);
  x.fill();
  x.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    x.fillRect((i * 97) % 480, (i * 53) % 90, 2, 2);
  }
  const hill = (
    col: string,
    base: number,
    amp: number,
    f: number,
    ph: number
  ) => {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, 300);
    for (let i = 0; i <= 480; i += 4) {
      x.lineTo(
        i,
        base +
          Math.sin(i / f + ph) * amp +
          Math.sin(i / (f / 2.7) + ph) * amp * 0.35
      );
    }
    x.lineTo(480, 300);
    x.fill();
  };
  hill("#4a2a7a", 170, 22, 60, 1);
  hill("#2a1b5c", 205, 18, 45, 3);
  hill("#12123a", 245, 14, 38, 5);
  x.fillStyle = "#34e0a1";
  x.fillRect(60, 232, 8, 30);
  x.beginPath();
  x.moveTo(40, 236);
  x.lineTo(64, 196);
  x.lineTo(88, 236);
  x.fill();
  return c;
}
export function paletteCanvas(rows: readonly Palette[], cell = 32) {
  const c = document.createElement("canvas");
  c.width = Math.max(...rows.map((r) => r.length)) * cell;
  c.height = rows.length * cell;
  const x = c.getContext("2d")!;
  rows.forEach((row, j) =>
    row.forEach((col, i) => {
      x.fillStyle = col;
      x.fillRect(i * cell, j * cell, cell, cell);
    })
  );
  return c;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string) {
  let element = document.querySelector("#toast");
  if (!element) {
    element = document.createElement("div");
    element.id = "toast";
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element?.classList.remove("show"), 1800);
}
export async function copy(text: string, message = "Copied"): Promise<boolean> {
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      input.remove();
    }
  }
  if (copied) {
    toast(message);
  }
  return copied;
}
export function download(name: string, data: string | Blob) {
  const blob =
    typeof data === "string" ? new Blob([data], { type: "text/plain" }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}
export const toBlob = (c: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create PNG."))),
      "image/png"
    )
  );
export function pushHash(value: string) {
  try {
    history.replaceState(null, "", `#${value}`);
  } catch {
    /* History can be unavailable in embedded/private contexts. */
  }
}
export function spaceHandler(generate: () => void) {
  return (event: KeyboardEvent) => {
    if (
      event.code === "Space" &&
      !/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(
        (document.activeElement as HTMLElement)?.tagName || ""
      )
    ) {
      event.preventDefault();
      generate();
    }
  };
}

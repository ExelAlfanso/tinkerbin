export function hash(str: string) {
  let a = 1_779_033_703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    a = Math.imul(a ^ str.charCodeAt(i), 3_432_918_353);
    a = (a << 13) | (a >>> 19);
  }
  a = Math.imul(a ^ (a >>> 16), 2_246_822_507);
  a = Math.imul(a ^ (a >>> 13), 3_266_489_909);
  return (a ^= a >>> 16) >>> 0;
}
export function rng(seed: string | number) {
  let a = typeof seed === "number" ? seed >>> 0 : hash(String(seed));
  return function () {
    a |= 0;
    a = (a + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
export function shuffle<T>(r: () => number, a: T[]) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
export const newSeed = () => Math.random().toString(36).slice(2, 8);

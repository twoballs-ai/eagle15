// Детерминированный рандом на основе seed
export function createSeededRandom(seed) {
  let state = seed | 0;
  return function() {
    state = (state * 1664525 + 1013904223) | 0;
    return ((state >>> 0) / 4294967296);
  };
}

export function randomPick(arr, seed) {
  const rng = typeof seed === "number" ? createSeededRandom(seed) : Math.random;
  const r = typeof rng === "function" ? rng() : rng;
  return arr[Math.floor(r * arr.length)];
}

export function randomInt(min, max, seed) {
  const rng = typeof seed === "number" ? createSeededRandom(seed) : Math.random;
  const r = typeof rng === "function" ? rng() : rng;
  return Math.floor(min + r * (max - min + 1));
}

export function randomFloat(min, max, seed) {
  const rng = typeof seed === "number" ? createSeededRandom(seed) : Math.random;
  const r = typeof rng === "function" ? rng() : rng;
  return min + r * (max - min);
}
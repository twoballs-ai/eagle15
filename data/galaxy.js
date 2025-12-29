import { dist } from "../engine/math.js";

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGalaxy(seed = 777) {
  const g = {
    systems: [],
    links: [],
    gen(seed2 = seed) {
      const R = rng(seed2);
      const N = 24;
      this.systems.length = 0;
      this.links.length = 0;

      for (let i = 0; i < N; i++) {
        const x = (R() * 2 - 1) * 900;
        const y = (R() * 2 - 1) * 600;
        const size = 10 + Math.floor(R() * 10);
        this.systems.push({ id: i, x, y, size, name: `System-${i}` });
      }

      // Connect each system to 2 nearest neighbors
      for (let i = 0; i < N; i++) {
        const a = this.systems[i];
        const dists = [];
        for (let j = 0; j < N; j++) if (j !== i) {
          const b = this.systems[j];
          dists.push({ j, d: dist(a.x, a.y, b.x, b.y) });
        }
        dists.sort((p, q) => p.d - q.d);
        for (let k = 0; k < 2; k++) {
          const j = dists[k].j;
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!this.links.some(l => l.key === key)) {
            this.links.push({ key, a: i, b: j });
          }
        }
      }
    },

    pickSystem(wx, wy, radius = 22) {
      for (const s of this.systems) {
        if (dist(wx, wy, s.x, s.y) <= Math.max(radius, s.size)) return s;
      }
      return null;
    }
  };

  g.gen(seed);
  return g;
}

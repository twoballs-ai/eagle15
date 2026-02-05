// data/galaxy.js
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

function randRange(R, a, b) { return a + R() * (b - a); }

// “псевдо-нормальное” распределение (быстро)
function randN(R) {
  // Box-Muller simplified
  const u = Math.max(1e-6, R());
  const v = Math.max(1e-6, R());
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function createGalaxy(seed = 777) {
  const g = {
    seed,
    systems: [],   // { id,x,z,size,name, clusterId, kind }
    links: [],     // { key,a,b, kind:"lane"|"relay" }
    clusters: [],  // { id,x,z,name }

    gen(seed2 = seed) {
      this.seed = seed2;
      const R = rng(seed2);

      // ===== параметры “Mass Effect feel” =====
      const N = 28;                 // количество систем
      const CLUSTERS = 5;           // кластеров
      const MAP_W = 2200;           // ширина карты
      const MAP_H = 1500;           // высота карты

      this.systems.length = 0;
      this.links.length = 0;
      this.clusters.length = 0;

      // 1) генерим центры кластеров
      for (let c = 0; c < CLUSTERS; c++) {
        const cx = randRange(R, -MAP_W * 0.45, MAP_W * 0.45);
        const cz = randRange(R, -MAP_H * 0.45, MAP_H * 0.45);
        this.clusters.push({
          id: c,
          x: cx,
          z: cz,
          name: `Cluster-${c + 1}`,
        });
      }

      // 2) раскладываем системы вокруг кластеров
      for (let i = 0; i < N; i++) {
        const clusterId = Math.floor(R() * CLUSTERS);
        const c = this.clusters[clusterId];

        // плотность кластера
        const spreadX = 220 + R() * 160;
        const spreadZ = 170 + R() * 140;

        const x = c.x + randN(R) * spreadX;
        const z = c.z + randN(R) * spreadZ;

        const size = 10 + Math.floor(R() * 10);

        // 1-2 “особых” узла (ретранслятор / важная точка)
        const kind = (R() < 0.10) ? "relay" : "system";

        this.systems.push({
          id: i,
          x,
          z,
          size,
          name: `System-${i}`,
          clusterId,
          kind,
        });
      }

      // 3) линкование: внутри кластера плотнее, между кластерами — реже (через relay)
      // внутри каждого кластера: каждый узел соединить с 2 ближайшими в кластере
      for (let c = 0; c < CLUSTERS; c++) {
        const ids = this.systems.filter(s => s.clusterId === c).map(s => s.id);

        for (const i of ids) {
          const a = this.systems[i];
          const dists = [];
          for (const j of ids) if (j !== i) {
            const b = this.systems[j];
            dists.push({ j, d: dist(a.x, a.z, b.x, b.z) });
          }
          dists.sort((p, q) => p.d - q.d);
          const K = Math.min(2, dists.length);
          for (let k = 0; k < K; k++) this._addLink(i, dists[k].j, "lane");
        }
      }

      // межкластерные связи: выбираем relay узлы (или ближайшие к центру) и связываем цепочкой
      const relayIds = this.systems
        .filter(s => s.kind === "relay")
        .map(s => s.id);

      // если релеев мало — “доделаем” по одному на кластер (ближайший к центру)
      if (relayIds.length < CLUSTERS) {
        for (let c = 0; c < CLUSTERS; c++) {
          const cc = this.clusters[c];
          let best = null;
          let bestD = Infinity;
          for (const s of this.systems) if (s.clusterId === c) {
            const d = dist(cc.x, cc.z, s.x, s.z);
            if (d < bestD) { bestD = d; best = s; }
          }
          if (best && !relayIds.includes(best.id)) {
            best.kind = "relay";
            relayIds.push(best.id);
          }
        }
      }

      // связываем relay узлы по ближайшему соседу (создаёт “магистрали”)
      for (const i of relayIds) {
        const a = this.systems[i];
        let bestJ = null;
        let bestD = Infinity;
        for (const j of relayIds) if (j !== i) {
          const b = this.systems[j];
          const d = dist(a.x, a.z, b.x, b.z);
          if (d < bestD) { bestD = d; bestJ = j; }
        }
        if (bestJ != null) this._addLink(i, bestJ, "relay");
      }

      // слегка подчистим “дубликаты/петли” уже ключом
    },

    _addLink(a, b, kind = "lane") {
      const i = Math.min(a, b);
      const j = Math.max(a, b);
      const key = `${i}-${j}-${kind}`;
      if (this.links.some(l => l.key === key)) return;
      this.links.push({ key, a: i, b: j, kind });
    },

    pickSystem(wx, wz, radius = 26) {
      for (const s of this.systems) {
        if (dist(wx, wz, s.x, s.z) <= Math.max(radius, s.size)) return s;
      }
      return null;
    },

    getNeighbors(systemId) {
      const out = [];
      for (const l of this.links) {
        if (l.a === systemId) out.push(l.b);
        else if (l.b === systemId) out.push(l.a);
      }
      return out;
    },
  };

  g.gen(seed);
  return g;
}

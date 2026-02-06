// data/galaxy.js
import { dist } from "../engine/math.js";
import { GALAXY_STATIC } from "./galaxy.static.js";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

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

function makeKey(a, b, kind) {
  const i = String(a);
  const j = String(b);
  return (i < j) ? `${i}-${j}-${kind}` : `${j}-${i}-${kind}`;
}

function buildIndexById(systems) {
  const map = new Map();
  for (let i = 0; i < systems.length; i++) map.set(String(systems[i].id), i);
  return map;
}

function neighborsFromLinks(systems, links) {
  const n = systems.length;
  const adj = Array.from({ length: n }, () => []);
  const idx = buildIndexById(systems);

  for (const l of links) {
    const a = idx.get(String(l.a));
    const b = idx.get(String(l.b));
    if (a == null || b == null) continue;
    adj[a].push(b);
    adj[b].push(a);
  }
  return { adj, idx };
}

function connectedComponents(systems, links) {
  const { adj } = neighborsFromLinks(systems, links);
  const n = systems.length;
  const seen = new Array(n).fill(false);
  const comps = [];

  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const stack = [i];
    seen[i] = true;
    const comp = [];
    while (stack.length) {
      const v = stack.pop();
      comp.push(v);
      for (const to of adj[v]) {
        if (!seen[to]) { seen[to] = true; stack.push(to); }
      }
    }
    comps.push(comp);
  }
  return comps;
}

function ensureConnectedByNearestBridge(systems, links) {
  // Достраиваем связность: находим компоненты связности,
  // и соединяем их “мостами” по ближайшей паре систем.
  // kind ставим "relay" (или "lane" — на твой вкус)
  let comps = connectedComponents(systems, links);
  if (comps.length <= 1) return;

  // Пока больше одной компоненты — соединяем две ближайшие
  while (comps.length > 1) {
    let best = null;

    for (let ci = 0; ci < comps.length; ci++) {
      for (let cj = ci + 1; cj < comps.length; cj++) {
        for (const ai of comps[ci]) {
          const A = systems[ai];
          for (const bi of comps[cj]) {
            const B = systems[bi];
            const d = dist(A.x, A.z, B.x, B.z);
            if (!best || d < best.d) best = { ci, cj, aId: A.id, bId: B.id, d };
          }
        }
      }
    }

    if (!best) break;

    const key = makeKey(best.aId, best.bId, "relay");
    if (!links.some(l => l.key === key)) {
      links.push({ key, a: String(best.aId), b: String(best.bId), kind: "relay" });
    }

    comps = connectedComponents(systems, links);
  }
}

export function createGalaxyStatic(options = {}) {
  const {
    base = GALAXY_STATIC,
    ensureConnected = true,

    // можно добавлять дополнительные системы позже
    randomCount = 0,
    randomSeed = 777,
    randomConnect = true,      // подключать ли рандомные к сети
    isolatedCount = 0,         // добавить изолированные “пустые” системы
  } = options;

  const g = {
    seed: randomSeed,
    systems: [],
    links: [],
    clusters: [],

    pickSystem(wx, wz, radius = 26) {
      for (const s of this.systems) {
        if (dist(wx, wz, s.x, s.z) <= Math.max(radius, s.size)) return s;
      }
      return null;
    },

    getNeighbors(systemId) {
      const id = String(systemId);
      const out = [];
      for (const l of this.links) {
        if (String(l.a) === id) out.push(String(l.b));
        else if (String(l.b) === id) out.push(String(l.a));
      }
      return out;
    },
  };

  // 1) загружаем базовую статику
  g.clusters = (base.clusters ?? []).map(c => ({ ...c, id: Number(c.id) }));
  g.systems = (base.systems ?? []).map(s => ({
    ...s,
    id: String(s.id),
    clusterId: (s.clusterId ?? 0),
    kind: s.kind ?? "system",
    size: s.size ?? 10,
  }));

  // 2) links с ключами (и нормализация id)
  const links = [];
  for (const l of (base.links ?? [])) {
    const a = String(l.a);
    const b = String(l.b);
    const kind = l.kind ?? "lane";
    links.push({ key: makeKey(a, b, kind), a, b, kind });
  }
  g.links = links;

  // 3) опционально: добавить изолированные системы (ни с кем не связаны)
  if (isolatedCount > 0) {
    const R = rng(randomSeed ^ 0x9e3779b9);
    const W = base.map?.w ?? 2200;
    const H = base.map?.h ?? 1500;

    for (let i = 0; i < isolatedCount; i++) {
      const id = `iso-${i + 1}`;
      g.systems.push({
        id,
        x: randRange(R, -W * 0.48, W * 0.48),
        z: randRange(R, -H * 0.48, H * 0.48),
        size: 10,
        name: `Isolated-${i + 1}`,
        clusterId: 0,
        kind: "system",
        isolated: true,
      });
    }
  }

  // 4) опционально: добавить рандомные системы
  if (randomCount > 0) {
    const R = rng(randomSeed);
    const W = base.map?.w ?? 2200;
    const H = base.map?.h ?? 1500;

    for (let i = 0; i < randomCount; i++) {
      const id = `rnd-${i + 1}`;
      const x = randRange(R, -W * 0.48, W * 0.48);
      const z = randRange(R, -H * 0.48, H * 0.48);

      g.systems.push({
        id,
        x,
        z,
        size: 10 + Math.floor(R() * 6),
        name: `Random-${i + 1}`,
        clusterId: 0,
        kind: (R() < 0.10) ? "relay" : "system",
        random: true,
      });

      if (randomConnect) {
        // подключаем к ближайшей НЕ-изолированной системе (или к любой, если хочешь)
        let best = null;
        for (const s of g.systems) {
          if (s.id === id) continue;
          if (s.isolated) continue;
          const d = dist(x, z, s.x, s.z);
          if (!best || d < best.d) best = { id: s.id, d };
        }
        if (best) {
          const kind = "lane";
          const key = makeKey(id, best.id, kind);
          if (!g.links.some(l => l.key === key)) {
            g.links.push({ key, a: id, b: best.id, kind });
          }
        }
      }
    }
  }

  // 5) гарантируем связность “основной” сети, если включено
  if (ensureConnected) {
    // Важно: изолированные мы НЕ обязаны подключать.
    // Поэтому временно фильтруем их для проверки связности.
    const mainSystems = g.systems.filter(s => !s.isolated);
    const mainIds = new Set(mainSystems.map(s => s.id));

    const mainLinks = g.links.filter(l => mainIds.has(String(l.a)) && mainIds.has(String(l.b)));

    // Приведем обратно (ссылка на массивы нам важна)
    if (mainSystems.length > 0) {
      const tempLinks = mainLinks.map(l => ({ ...l }));
      ensureConnectedByNearestBridge(mainSystems, tempLinks);

      // Добавим “мосты”, которых не было
      for (const l of tempLinks) {
        if (!g.links.some(x => x.key === l.key)) g.links.push(l);
      }
    }
  }

  return g;
}

// Удобный алиас: сейчас используем статику вместо рандома
export function createGalaxy(seed = 777, options = {}) {
  return createGalaxyStatic({ randomSeed: seed, ...options });
}

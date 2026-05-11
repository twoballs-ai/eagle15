// data/starSystem.js
import { PLANET_MODELS } from "./models/planetModels.js";
import { ASSETS } from "../assets_folder/manifest.js";
import { getSystemDef } from "./system/systemDefs.js";

// ✅ Генерация "внутренности" звёздной системы (звезда + планеты)
// Теперь поддерживает:
// - фиксированные планеты (из SYSTEM_DEFS[systemId])
// - + детерминированные рандомные (min/max)
// - systemId может быть строкой (и должен быть строкой)
export function createStarSystem(seed, systemId, opts = {}) {
  const id = String(systemId);
  const def = getSystemDef(id);

  // ---- НАСТРОЙКИ ----
  const SCALE = 1.7;
  const SPEED_SCALE = 0.12;
  const PLANET_SIZE_SCALE = 2.0;
  const ORBIT_GAP_SCALE = 1.8;

  // ✅ детерминированный seed: глобальный seed + hash(systemId) + системный seed из дефиниции
  const sysSeed = (Number.isFinite(def?.seed) ? def.seed : 0) >>> 0;
  const mixed = (seed >>> 0) ^ hashString(id) ^ sysSeed;
  const rand = mulberry32(mixed);

  const starRadiusMul = opts?.randomizeStar === false ? 1 : (Number.isFinite(opts?.starRadiusMul) ? opts.starRadiusMul : 1);
  const star = {
    radius: (40 + rand() * 30) * SCALE * starRadiusMul,
    color: [1.0, 0.9, 0.6],
    modelUrl: ASSETS.models.sun,
  };

  if (opts?.devPreset?.mode === "description") {
    const preset = opts.devPreset;
    const starCfg = preset.star;

    if (starCfg) {
      const sr = Number.isFinite(starCfg.radiusMul) ? starCfg.radiusMul : 1;
      star.radius *= sr;
      if (Array.isArray(starCfg.color) && starCfg.color.length >= 3) {
        star.color = [starCfg.color[0], starCfg.color[1], starCfg.color[2]];
      }
      star.visual = { ...(starCfg.visual ?? {}) };
      if (typeof starCfg.modelUrl === "string" && starCfg.modelUrl.length) {
        star.modelUrl = ASSETS.normalizeUrl(starCfg.modelUrl);
      }
    }

    const fixedPlanets = Array.isArray(preset.planets) ? preset.planets : [];
    if (fixedPlanets.length) {
      let localOrbit = star.radius + 260 * SCALE;
      const out = [];
      for (let i = 0; i < fixedPlanets.length; i++) {
        const pp = fixedPlanets[i] ?? {};

        if (pp.preserveExact) {
          out.push({
            id: pp.id ?? `keep-${i}`,
            name: pp.name ?? `Planet ${i + 1}`,
            orbitRadius: Number.isFinite(pp.orbitRadius) ? pp.orbitRadius : localOrbit,
            size: Number.isFinite(pp.size) ? pp.size : (9 * SCALE),
            speed: Number.isFinite(pp.speed) ? pp.speed : ((0.3 * SPEED_SCALE) / Math.sqrt((localOrbit || 1) / (160 * SCALE))),
            phase: Number.isFinite(pp.phase) ? pp.phase : rand() * Math.PI * 2,
            color: Array.isArray(pp.color) && pp.color.length >= 3 ? [pp.color[0], pp.color[1], pp.color[2]] : [0.75, 0.75, 0.75],
            modelUrl: pickModelUrl(pp, rand),
            fixed: true,
            visual: { ...(pp.visual ?? {}), type: pp.type ?? null },
          });
          continue;
        }

        const orbitRadius = Number.isFinite(pp.orbitRadius) ? pp.orbitRadius : localOrbit;
        const sizeBase = Number.isFinite(pp.size) ? pp.size : (7 + rand() * 11) * SCALE * 0.72 * PLANET_SIZE_SCALE;
        const sizeMul = Number.isFinite(pp.sizeMul) ? pp.sizeMul : 1;
        const size = sizeBase * sizeMul;
        const distFactor = Math.sqrt(orbitRadius / (160 * SCALE));
        const speed = Number.isFinite(pp.speed)
          ? pp.speed
          : ((0.24 + rand() * 0.55) * SPEED_SCALE) / distFactor;
        out.push({
          id: pp.id ?? `dev-${i}`,
          name: pp.name ?? `Planet ${i + 1}`,
          orbitRadius,
          size,
          speed,
          phase: Number.isFinite(pp.phase) ? pp.phase : rand() * Math.PI * 2,
          color: Array.isArray(pp.color) && pp.color.length >= 3 ? [pp.color[0], pp.color[1], pp.color[2]] : [0.7 + rand() * 0.3, 0.7 + rand() * 0.3, 0.7 + rand() * 0.3],
          modelUrl: pickModelUrl(pp, rand),
          fixed: true,
          visual: { ...(pp.visual ?? {}), type: pp.type ?? null },
        });
        localOrbit = nextOrbit(Math.max(localOrbit, orbitRadius), rand, SCALE, ORBIT_GAP_SCALE);
      }
      return { star, planets: out, systemId: id, def: def ?? null, generatedFromPrompt: true };
    }
  }

  // Базовая орбита (первая планета) и шаги орбит
  let orbit = star.radius + 220 * SCALE;

  // Сколько рандомных планет добавлять
  const planetsCfg = def?.planets ?? null;

  const fixed = Array.isArray(planetsCfg?.fixed) ? planetsCfg.fixed : [];
  const randomCount = opts?.randomizePlanets === false
    ? 0
    : resolveRandomCount(opts?.randomCountRange ?? planetsCfg?.randomCount, rand);

  const planets = [];

  // --- 1) фиксированные планеты ---
  for (let i = 0; i < fixed.length; i++) {
    const fp = fixed[i] ?? {};

    // орбита: если задана — используем её, иначе идём "по сетке" орбит
    let orbitRadius = Number(fp.orbitRadius);
    if (!Number.isFinite(orbitRadius)) {
      orbitRadius = orbit;
    }

    // размер: если задан — используем, иначе генерим "как обычно"
    let size = Number(fp.size);
    if (!Number.isFinite(size)) {
      size = (6 + rand() * 12) * SCALE * 0.75 * PLANET_SIZE_SCALE;
    }

    const base = 0.2 + rand() * 0.6;
    const distFactor = Math.sqrt(orbitRadius / (160 * SCALE));
    const speed = (base * SPEED_SCALE) / distFactor;

    const modelUrl = pickModelUrl(fp, rand);

    const color = Array.isArray(fp.color) && fp.color.length >= 3
      ? [fp.color[0], fp.color[1], fp.color[2]]
      : [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4];

    const phase = Number.isFinite(fp.phase) ? fp.phase : rand() * Math.PI * 2;

    planets.push({
      id: fp.id ?? `fixed-${i}`,
      name: fp.name ?? null,
      orbitRadius,
      size,
      speed,
      phase,
      color,
      modelUrl,
      fixed: true,
    });

    // если фиксированная планета не задавала orbitRadius явно,
    // продолжаем орбитальную сетку от текущей
    if (!Number.isFinite(Number(fp.orbitRadius))) {
      orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
    } else {
      // если orbitRadius задан — всё равно двигаем "сетку" вперёд,
      // чтобы случайные не налезали в ту же орбиту
      orbit = Math.max(orbit, orbitRadius);
      orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
    }
  }

  // --- 2) рандомные планеты (докидываем) ---
  for (let i = 0; i < randomCount; i++) {
    const size = (6 + rand() * 12) * SCALE * 0.75 * PLANET_SIZE_SCALE;

    const base = 0.2 + rand() * 0.6;
    const distFactor = Math.sqrt(orbit / (160 * SCALE));
    const speed = (base * SPEED_SCALE) / distFactor;

    const modelIndex = Math.floor(rand() * PLANET_MODELS.length);
    const modelUrl = ASSETS.normalizeUrl(PLANET_MODELS[modelIndex]);

    planets.push({
      id: `rnd-${i}`,
      name: null,
      orbitRadius: orbit,
      size,
      speed,
      phase: rand() * Math.PI * 2,
      color: [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4],
      modelUrl,
      random: true,
    });

    orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
  }

  return { star, planets, systemId: id, def: def ?? null };
}

function nextOrbit(currentOrbit, rand, SCALE, ORBIT_GAP_SCALE) {
  return currentOrbit + (140 + rand() * 180) * SCALE * ORBIT_GAP_SCALE;
}

function resolveRandomCount(rc, rand) {
  // rc может быть:
  // - числом (фиксированно)
  // - {min,max}
  // - undefined -> дефолт 4..7 (как было, но лучше поменьше)
  if (Number.isFinite(rc)) return Math.max(0, Math.floor(rc));

  const min = Number.isFinite(rc?.min) ? rc.min : 0;
  const max = Number.isFinite(rc?.max) ? rc.max : 3;

  const a = Math.max(0, Math.floor(min));
  const b = Math.max(a, Math.floor(max));

  return a + Math.floor(rand() * (b - a + 1));
}

function pickModelUrl(fixedPlanet, rand) {
  // Приоритет:
  // 1) modelUrl (если задан напрямую)
  // 2) modelIndex (индекс в PLANET_MODELS)
  // 3) modelId (строка — попробуем найти в массиве, если это путь)
  // 4) иначе — случайная из PLANET_MODELS
  if (typeof fixedPlanet?.modelUrl === "string" && fixedPlanet.modelUrl.length) {
    return ASSETS.normalizeUrl(fixedPlanet.modelUrl);
  }

  if (Number.isFinite(fixedPlanet?.modelIndex)) {
    const idx = clampInt(fixedPlanet.modelIndex, 0, PLANET_MODELS.length - 1);
    return ASSETS.normalizeUrl(PLANET_MODELS[idx]);
  }

  if (typeof fixedPlanet?.modelId === "string" && fixedPlanet.modelId.length) {
    // если modelId — это прям путь из PLANET_MODELS
    const found = PLANET_MODELS.find((p) => String(p) === fixedPlanet.modelId);
    if (found) return ASSETS.normalizeUrl(found);
  }

  const idx = Math.floor(rand() * PLANET_MODELS.length);
  return ASSETS.normalizeUrl(PLANET_MODELS[idx]);
}

function clampInt(v, a, b) {
  const x = Math.floor(v);
  return Math.max(a, Math.min(b, x));
}

// ✅ Строковый hash -> uint32 (FNV-1a-ish)
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// простой детерминированный RNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

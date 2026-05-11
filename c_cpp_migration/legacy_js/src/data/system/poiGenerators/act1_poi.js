import { getWorldPoiForSystem } from "../../content/world/poi/poiBySystem.js";


function hashSystemId(systemId) {
  const str = String(systemId);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h;
}

// Генерит POI первого акта на базе твоего createStarSystem() результата.
// Планетные POI привязаны к planetId (p.id), статичные — детерминированные x/z.

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maxOrbitRadius(system) {
  let max = 0;
  for (const p of system?.planets ?? []) max = Math.max(max, p.orbitRadius || 0);
  return max;
}

function pickPlanetIds(system) {
  const planets = system?.planets ?? [];
  // MVP: A/B/C = первые три планеты (детерминированно, всегда есть при count>=3)
  const a = planets[0]?.id ?? 0;
  const b = planets[1]?.id ?? a;
  const c = planets[2]?.id ?? b;
  return { a, b, c };
}

export function createAct1Poi(seed, systemId, system) {
  const rand = mulberry32((seed ^ hashSystemId(systemId)) + 0xA11C7);

  const { a, b, c } = pickPlanetIds(system);

  const maxOrbit = Math.max(900, maxOrbitRadius(system));
  // Внутренний радиус для статичных POI (чтобы не улетали слишком далеко)
  const R = maxOrbit * 0.85;

  function pickPoint(rMin, rMax) {
    const ang = rand() * Math.PI * 2;
    const r = rMin + rand() * (rMax - rMin);
    return { x: Math.cos(ang) * r, z: Math.sin(ang) * r };
  }

  // Статичные POI
  const station = pickPoint(R * 0.35, R * 0.55);
  const anomaly = pickPoint(R * 0.60, R * 0.85);
  const beacon  = pickPoint(R * 0.70, R * 0.95);

  // Радиусы — пока примерные (потом подгоним на шаге 3)
  const basePoi = [
    // Планетные
    {
      id: "poi_planet_a",
      kind: "planet",
      planetId: a,
      name: "Близкая",
      radius: 110,
      interactRadius: 90,
      onEnter: "event_scan_planet_a",
    },
    {
      id: "poi_planet_b",
      kind: "planet",
      planetId: b,
      name: "Промышленная",
      radius: 140,
      interactRadius: 110,
      onEnter: "event_salvage_parts_b",
    },
    {
      id: "poi_planet_c",
      kind: "planet",
      planetId: c,
      name: "Искажённая",
      radius: 150,
      interactRadius: 120,
      onEnter: "event_trace_enemy_c",
    },

    // Статичные
    {
      id: "poi_station",
      kind: "static",
      name: "Полуразрушенная станция",
      x: station.x,
      z: station.z,
      radius: 120,
      interactRadius: 95,
      onEnter: "event_station_contact",
    },
    {
      id: "poi_anomaly",
      kind: "static",
      name: "Пространственная аномалия",
      x: anomaly.x,
      z: anomaly.z,
      radius: 170,
      interactRadius: 130,
      onEnter: "event_anomaly_field",
    },
    {
      id: "poi_beacon",
      kind: "static",
      name: "Навигационный маяк",
      x: beacon.x,
      z: beacon.z,
      radius: 120,
      interactRadius: 95,
      onEnter: "event_beacon_hint",
    },
  ];

  return [...basePoi, ...getWorldPoiForSystem(systemId)];
}

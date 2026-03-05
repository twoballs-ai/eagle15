import { ASSETS } from "../../assets_folder/manifest.js";

const PLANET_MODEL_BY_TYPE = {
  ocean: "assets_folder/models/planets_1gen/planet_ocean_001.glb",
  gas: "assets_folder/models/planets_1gen/planet_gas_001.glb",
  ice: "assets_folder/models/planets_1gen/planet_ice_001.glb",
  lava: "assets_folder/models/planets_1gen/planet_lava_001.glb",
  crystal: "assets_folder/models/planets_1gen/planet_crystal_001.glb",
  acid: "assets_folder/models/planets_1gen/planet_acid_001.glb",
  arid: "assets_folder/models/planets_1gen/planet_arid_001.glb",
};

function includesAny(s, words) {
  return words.some((w) => s.includes(w));
}

function detectPlanetType(chunk) {
  const c = chunk.toLowerCase();
  if (includesAny(c, ["океан", "ocean", "море", "water"])) return "ocean";
  if (includesAny(c, ["газ", "gas", "jupiter"])) return "gas";
  if (includesAny(c, ["лед", "ice", "snow", "frost"])) return "ice";
  if (includesAny(c, ["лава", "lava", "volcan"])) return "lava";
  if (includesAny(c, ["крист", "crystal"])) return "crystal";
  if (includesAny(c, ["кисл", "acid"])) return "acid";
  return "arid";
}

function makeVisual(type, chunk) {
  const c = chunk.toLowerCase();
  return {
    clouds: includesAny(c, ["облак", "cloud", "storm", "шторм"]) || type === "gas" || type === "ocean",
    oceans: includesAny(c, ["океан", "море", "ocean", "sea", "water"]) || type === "ocean",
    rings: includesAny(c, ["кольц", "ring"]),
    atmosphere: !includesAny(c, ["без атмосф", "airless", "атмосферы нет"]),
    emissive: includesAny(c, ["светящ", "glow", "biolum"]) ? 0.2 : 0.02,
    ambient: includesAny(c, ["реалист", "quality", "деталь"]) ? 0.9 : 0.82,
  };
}

export function buildSystemPresetFromDescription(description, opts = {}) {
  const {
    includeStar = true,
    includePlanets = true,
    preserveStar = null,
    preservePlanets = null,
  } = opts;

  const text = String(description ?? "").trim();
  const low = text.toLowerCase();

  const rawChunks = text
    .split(/\n|;/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 8);

  const chunks = rawChunks.length ? rawChunks : [text || "ocean world", "gas giant", "ice world"];

  const starHot = includesAny(low, ["blue", "голуб", "син", "hot", "горяч"]);
  const generatedStar = {
    radiusMul: includesAny(low, ["giant", "гигант", "большое солнце"]) ? 1.35 : 1.0,
    color: starHot ? [0.75, 0.86, 1.0] : [1.0, 0.92, 0.65],
    visual: { emissive: 2.8, ambient: 1.0, corona: true },
  };

  const generatedPlanets = chunks.map((chunk, i) => {
    const type = detectPlanetType(chunk);
    const modelUrl = ASSETS.normalizeUrl(PLANET_MODEL_BY_TYPE[type]);
    const sizeMul = includesAny(chunk.toLowerCase(), ["big", "large", "больш"]) ? 1.25 : 1.0;
    return {
      id: `dev-${i}`,
      name: `Dev ${type} ${i + 1}`,
      type,
      modelUrl,
      sizeMul,
      orbitRadius: 520 + i * 290,
      visual: makeVisual(type, chunk),
    };
  });

  const star = includeStar ? generatedStar : (preserveStar ? {
    radiusMul: 1,
    color: [...(preserveStar.color ?? [1, 0.92, 0.65])],
    visual: { ...(preserveStar.visual ?? {}) },
  } : null);

  const planets = includePlanets
    ? generatedPlanets
    : (Array.isArray(preservePlanets) ? preservePlanets.map((p, i) => ({
      id: p.id ?? `keep-${i}`,
      name: p.name ?? `Keep ${i + 1}`,
      type: p.visual?.type ?? null,
      modelUrl: p.modelUrl,
      orbitRadius: p.orbitRadius,
      sizeMul: 1,
      size: p.size,
      speed: p.speed,
      phase: p.phase,
      color: p.color,
      visual: { ...(p.visual ?? {}) },
      preserveExact: true,
    })) : []);

  return {
    mode: "description",
    description: text,
    star,
    planets,
    includeStar: !!includeStar,
    includePlanets: !!includePlanets,
  };
}

export async function saveGeneratedPresetToFolder(preset, systemId = "system") {
  const fileName = `generated_${String(systemId)}_${Date.now()}.json`;
  const payload = JSON.stringify(preset, null, 2);

  if (typeof window.showDirectoryPicker === "function") {
    const dir = await window.showDirectoryPicker({ mode: "readwrite" });
    const handle = await dir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(payload);
    await writable.close();
    return { ok: true, method: "folder", fileName };
  }

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { ok: true, method: "download", fileName };
}

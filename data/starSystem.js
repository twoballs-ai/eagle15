import { PLANET_MODELS } from "./models/planetModels.js";
import { ASSETS } from "../assets/manifest.js"; // путь поправь относительно файла data/starSystem.js
export function createStarSystem(seed, systemId) {
  const rand = mulberry32(seed ^ systemId);

  // ---- НАСТРОЙКИ ----
  const SCALE = 1.7;
  const SPEED_SCALE = 0.12;

  const star = {
    radius: (40 + rand() * 30) * SCALE,
    color: [1.0, 0.9, 0.6],
  };

  // ✅ 4..7 планет
  const planetCount = 4 + Math.floor(rand() * 4); // 4,5,6,7

  const planets = [];
  let orbit = star.radius + 220 * SCALE;

  for (let i = 0; i < planetCount; i++) {
    const PLANET_SIZE_SCALE = 2; // ✅ планеты крупнее
    const size = (6 + rand() * 12) * SCALE * 0.75 * PLANET_SIZE_SCALE;

    const base = 0.2 + rand() * 0.6;
    const distFactor = Math.sqrt(orbit / (160 * SCALE));
    const speed = (base * SPEED_SCALE) / distFactor;

    // ✅ выбираем модель детерминированно из списка
    const modelIndex = Math.floor(rand() * PLANET_MODELS.length);


const modelUrl = ASSETS.normalizeUrl(PLANET_MODELS[modelIndex]);

    planets.push({
      id: i,
      orbitRadius: orbit,
      size,
      speed,
      phase: rand() * Math.PI * 2,
      color: [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4],

      // ✅ новое поле
      modelUrl,
    });

   const ORBIT_GAP_SCALE = 1.8; // ✅ межпланетные расстояния
    orbit += (140 + rand() * 180) * SCALE * ORBIT_GAP_SCALE;
  }

  return { star, planets };
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

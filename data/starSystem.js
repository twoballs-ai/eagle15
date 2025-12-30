export function createStarSystem(seed, systemId) {
  const rand = mulberry32(seed ^ systemId);

  // ---- НАСТРОЙКИ (можешь тюнить) ----
  const SCALE = 1.7;        // общий размер системы (1.0 было как раньше)
  const SPEED_SCALE = 0.12; // замедление орбит (1.0 было как раньше)

  const star = {
    radius: (40 + rand() * 30) * SCALE,
    color: [1.0, 0.9, 0.6],
  };

  const planetCount = 3 + Math.floor(rand() * 6);

  const planets = [];
  let orbit = star.radius + 120 * SCALE;

  for (let i = 0; i < planetCount; i++) {
    const size = (6 + rand() * 12) * SCALE * 0.75;

    // Базовая скорость
    const base = 0.2 + rand() * 0.6;

    // Чем дальше планета, тем медленнее (выглядит естественнее)
    const distFactor = Math.sqrt(orbit / (160 * SCALE)); // >1 для дальних орбит
    const speed = (base * SPEED_SCALE) / distFactor;

    planets.push({
      id: i,
      orbitRadius: orbit,
      size,
      speed, // ✅ медленнее + зависит от орбиты
      phase: rand() * Math.PI * 2,
      color: [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4],
    });

    orbit += (90 + rand() * 110) * SCALE;
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

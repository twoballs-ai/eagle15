export function createStarSystem(seed, systemId) {
  const rand = mulberry32(seed ^ systemId);

  const star = {
    radius: 40 + rand() * 30,
    color: [1.0, 0.9, 0.6],
  };

  const planetCount = 3 + Math.floor(rand() * 6);

  const planets = [];
  let orbit = star.radius + 80;

  for (let i = 0; i < planetCount; i++) {
    const size = 6 + rand() * 12;

    planets.push({
      id: i,
      orbitRadius: orbit,
      size,
      speed: 0.2 + rand() * 0.6, // угловая скорость
      phase: rand() * Math.PI * 2,
      color: [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4],
    });

    orbit += 60 + rand() * 70;
  }

  return {
    star,
    planets,
  };
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

// src/data/content/npc/shipTemplates.js

export const SHIP_TEMPLATES = {
  scout: {
    nameBase: "Scout",
    hull: { min: 60, max: 100 },
    shields: { min: 30, max: 60 },
    energy: { min: 50, max: 80 },
    speed: { min: 1.3, max: 1.6 },
    scoreValue: 100,
    spawnWeight: 4,
  },
  frigate: {
    nameBase: "Frigate",
    hull: { min: 120, max: 180 },
    shields: { min: 80, max: 130 },
    energy: { min: 70, max: 110 },
    speed: { min: 0.95, max: 1.15 },
    scoreValue: 200,
    spawnWeight: 3,
  },
  destroyer: {
    nameBase: "Destroyer",
    hull: { min: 180, max: 260 },
    shields: { min: 110, max: 170 },
    energy: { min: 100, max: 160 },
    speed: { min: 0.75, max: 0.95 },
    scoreValue: 350,
    spawnWeight: 2,
  },
  cruiser: {
    nameBase: "Cruiser",
    hull: { min: 280, max: 380 },
    shields: { min: 180, max: 260 },
    energy: { min: 150, max: 230 },
    speed: { min: 0.55, max: 0.75 },
    scoreValue: 500,
    spawnWeight: 1,
  },
};

export function getRandomShipType(rng) {
  const types = Object.keys(SHIP_TEMPLATES);
  const weights = types.map(t => SHIP_TEMPLATES[t].spawnWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  let r = rng() * totalWeight;
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r <= 0) return types[i];
  }
  return types[types.length - 1];
}

export function getShipStats(templateKey, rng) {
  const template = SHIP_TEMPLATES[templateKey] || SHIP_TEMPLATES.frigate;
  
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min, max) => rng() * (max - min) + min;
  
  return {
    hull: randInt(template.hull.min, template.hull.max),
    shields: randInt(template.shields.min, template.shields.max),
    energy: randInt(template.energy.min, template.energy.max),
    speed: parseFloat(randFloat(template.speed.min, template.speed.max).toFixed(2)),
    scoreValue: template.scoreValue,
    type: template.nameBase,
  };
}

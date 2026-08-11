export const SHIP_TEMPLATES = {
  pirate_scout: {
    id: "pirate_scout",
    name: "Пиратский разведчик",
    factionId: "pirates",
    shipClass: "Scout",
    model: "ship",
    stats: {
      armor: 80, shields: 30, energy: 60,
      speed: 280, accel: 200, turnSpeed: 3.0, radius: 8,
    },
    weaponPresetId: "scatter",
    ai: { aggression: 0.7, preferredRange: 350 },
  },

  pirate_raider: {
    id: "pirate_raider",
    name: "Пиратский рейдер",
    factionId: "pirates",
    shipClass: "Raider",
    model: "ship",
    stats: {
      armor: 150, shields: 60, energy: 100,
      speed: 240, accel: 160, turnSpeed: 2.5, radius: 10,
    },
    weaponPresetId: "pulse",
    ai: { aggression: 0.8, preferredRange: 450 },
  },

  trader_merchant: {
    id: "trader_merchant",
    name: "Торговец",
    factionId: "neutral",
    shipClass: "Merchant",
    model: "ship",
    stats: {
      armor: 120, shields: 40, energy: 80,
      speed: 180, accel: 120, turnSpeed: 1.8, radius: 12,
    },
    ai: { aggression: 0.1, preferredRange: 500 },
  },

  union_patrol: {
    id: "union_patrol",
    name: "Патрульный Союза",
    factionId: "union",
    shipClass: "Patrol",
    model: "ship",
    stats: {
      armor: 200, shields: 80, energy: 120,
      speed: 260, accel: 180, turnSpeed: 2.8, radius: 9,
    },
    weaponPresetId: "pulse",
    ai: { aggression: 0.6, preferredRange: 480 },
  },
};

export function getTemplate(templateId) {
  return SHIP_TEMPLATES[templateId] ?? null;
}

export function getAllTemplateIds() {
  return Object.keys(SHIP_TEMPLATES);
}

export function getTemplatesByFaction(factionId) {
  return Object.values(SHIP_TEMPLATES).filter(t => t.factionId === factionId);
}
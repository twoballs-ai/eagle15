// data/items/weapons.js
// Каталог оружия с характеристиками и визуальными эффектами

export const WEAPONS_CATALOG = [
  {
    id: "weapon_pulse_laser",
    name: "Импульсный лазер",
    type: "weapon",
    slotType: "main",
    description: "Стандартное энергетическое оружие с высокой скорострельностью",

    // Боевые характеристики
    damage: 18,
    fireCooldown: 0.15,
    bulletSpeed: 2500,
    bulletLife: 0.8,
    spread: 0.002,
    energyCost: 5,
    range: 800,

    // Визуальные эффекты
    vfx: {
      type: "impulse_laser",
      color: [0.2, 0.9, 1.0],        // голубой луч
      coreColor: [1.0, 1.0, 1.0],     // белое ядро
      muzzleFlash: true,
      impactSparks: true,
    },

    // Звуковые эффекты
    sfx: {
      fire: "laser_pulse_fire",
      impact: "laser_impact_small",
    },

    rarity: "common",
    tier: 1,
    price: 150,
    mass: 2.5,
  },

  {
    id: "weapon_scattergun",
    name: "Дробовик",
    type: "weapon",
    slotType: "auxiliary",
    description: "Оружие ближнего боя с широким разбросом",

    damage: 8,
    fireCooldown: 0.35,
    bulletSpeed: 900,
    bulletLife: 0.55,
    spread: 0.09,
    pellets: 6,
    energyCost: 8,
    range: 300,

    vfx: {
      type: "tracer",
      color: [1.0, 0.8, 0.2],        // оранжевый трассер
      size: 1.5,
      alpha: 0.9,
    },

    sfx: {
      fire: "shotgun_fire",
      impact: "bullet_impact",
    },

    rarity: "common",
    tier: 1,
    price: 200,
    mass: 4.0,
  },

  {
    id: "weapon_railgun",
    name: "Рельсотрон",
    type: "weapon",
    slotType: "main",
    description: "Мощное снайперское оружие с высокой пробивной способностью",

    damage: 42,
    fireCooldown: 0.55,
    bulletSpeed: 1800,
    bulletLife: 1.5,
    spread: 0.002,
    energyCost: 15,
    range: 1500,

    vfx: {
      type: "laser_beam",
      color: [1.0, 0.2, 0.2],        // красный луч
      thickness: 2.0,
      trailLength: 0.2,
      chargeEffect: true,
    },

    sfx: {
      fire: "railgun_fire",
      charge: "railgun_charge",
      impact: "railgun_impact",
    },

    rarity: "rare",
    tier: 2,
    price: 450,
    mass: 6.0,
  },

  {
    id: "weapon_rocket_launcher",
    name: "Ракетная установка",
    type: "weapon",
    slotType: "missile",
    description: "Запускает самонаводящиеся ракеты с большой разрушительной силой",

    damage: 65,
    fireCooldown: 0.8,
    bulletSpeed: 600,
    bulletLife: 2.5,
    spread: 0.01,
    energyCost: 20,
    range: 1200,
    homing: true,
    explosionRadius: 25,

    vfx: {
      type: "rocket_model",
      trailColor: [1.0, 0.4, 0.0],   // огненный след
      trailSize: 4.0,
      explosionEffect: true,
    },

    sfx: {
      fire: "rocket_launch",
      explosion: "rocket_explosion",
    },

    rarity: "rare",
    tier: 2,
    price: 600,
    mass: 8.0,
  },

  {
    id: "weapon_plasma_cannon",
    name: "Плазменная пушка",
    type: "weapon",
    slotType: "main",
    description: "Выстреливает сгустки плазмы, наносящие урон по площади",

    damage: 35,
    fireCooldown: 0.45,
    bulletSpeed: 1200,
    bulletLife: 1.0,
    spread: 0.015,
    energyCost: 12,
    range: 900,
    splashRadius: 15,

    vfx: {
      type: "plasma_blob",
      color: [0.3, 1.0, 0.3],        // зелёная плазма
      glowSize: 6.0,
      trailEffect: true,
    },

    sfx: {
      fire: "plasma_fire",
      impact: "plasma_impact",
    },

    rarity: "epic",
    tier: 3,
    price: 850,
    mass: 7.5,
  },

  {
    id: "weapon_turret_laser",
    name: "Лазерная турель",
    type: "weapon",
    slotType: "turret",
    description: "Автоматическая турель с непрерывным лазерным лучом",

    damage: 12,
    fireCooldown: 0.08,
    bulletSpeed: 3000,
    bulletLife: 0.5,
    spread: 0.005,
    energyCost: 3,
    range: 600,
    continuous: true,

    vfx: {
      type: "continuous_beam",
      color: [0.8, 0.2, 1.0],        // фиолетовый луч
      beamWidth: 1.5,
    },

    sfx: {
      fire: "laser_continuous",
      impact: "laser_hit",
    },

    rarity: "uncommon",
    tier: 2,
    price: 380,
    mass: 5.0,
  },
];

// Быстрый доступ по ID
export const WEAPONS_BY_ID = Object.fromEntries(
  WEAPONS_CATALOG.map(w => [w.id, w])
);

// Получить оружие по ID
export function getWeapon(id) {
  return WEAPONS_BY_ID[id] || null;
}

// Получить все оружия определённого типа слота
export function getWeaponsBySlotType(slotType) {
  return WEAPONS_CATALOG.filter(w => w.slotType === slotType);
}

// Получить все оружия определённой редкости
export function getWeaponsByRarity(rarity) {
  return WEAPONS_CATALOG.filter(w => w.rarity === rarity);
}

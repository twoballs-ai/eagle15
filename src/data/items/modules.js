// data/items/modules.js
// Каталог модулей корабля с характеристиками и эффектами

export const MODULES_CATALOG = [
  // ===== ДВИГАТЕЛИ =====
  {
    id: "module_engine_basic",
    name: "Базовый двигатель",
    type: "module",
    slotType: "engine",
    description: "Стандартный двигатель для малых кораблей",

    // Характеристики модуля
    modifiers: {
      speed: 0.10,      // +10% к скорости
      accel: 0.05,      // +5% к ускорению
      turnSpeed: 0.05,  // +5% к повороту
    },

    energyConsumption: 2,
    mass: 3.0,

    rarity: "common",
    tier: 1,
    price: 120,
  },

  {
    id: "module_engine_advanced",
    name: "Улучшенный двигатель",
    type: "module",
    slotType: "engine",
    description: "Двигатель с повышенной эффективностью",

    modifiers: {
      speed: 0.20,
      accel: 0.12,
      turnSpeed: 0.10,
    },

    energyConsumption: 4,
    mass: 4.5,

    rarity: "uncommon",
    tier: 2,
    price: 280,
  },

  {
    id: "module_engine_racing",
    name: "Гоночный двигатель",
    type: "module",
    slotType: "engine",
    description: "Максимальная скорость за счёт манёвренности",

    modifiers: {
      speed: 0.35,
      accel: 0.20,
      turnSpeed: -0.05,  // -5% к повороту
    },

    energyConsumption: 6,
    mass: 5.0,

    rarity: "rare",
    tier: 3,
    price: 520,
  },

  // ===== ЩИТЫ =====
  {
    id: "module_shield_basic",
    name: "Базовый генератор щита",
    type: "module",
    slotType: "shield",
    description: "Стандартная защита от энергетического оружия",

    modifiers: {
      shields: 0.25,      // +25% к щиту
      shieldRegen: 0.15,  // +15% к регенерации
    },

    energyConsumption: 3,
    mass: 2.5,

    rarity: "common",
    tier: 1,
    price: 140,
  },

  {
    id: "module_shield_advanced",
    name: "Усиленный генератор щита",
    type: "module",
    slotType: "shield",
    description: "Повышенная ёмкость и скорость восстановления",

    modifiers: {
      shields: 0.45,
      shieldRegen: 0.30,
    },

    energyConsumption: 5,
    mass: 4.0,

    rarity: "uncommon",
    tier: 2,
    price: 320,
  },

  {
    id: "module_shield_capacitor",
    name: "Щитовой конденсатор",
    type: "module",
    slotType: "shield",
    description: "Мгновенное восстановление щита при критическом уроне",

    modifiers: {
      shields: 0.60,
      shieldRegen: 0.50,
      shieldBurst: true,  // Уникальный эффект
    },

    energyConsumption: 8,
    mass: 5.5,

    rarity: "epic",
    tier: 4,
    price: 750,
  },

  // ===== УТИЛИТИ МОДУЛИ =====
  {
    id: "module_scanner_basic",
    name: "Базовый сканер",
    type: "module",
    slotType: "scanner",
    description: "Обнаружение ресурсов и объектов в системе",

    scanRange: 5000,
    scanSpeed: 1.0,
    detectResources: true,
    detectShips: false,

    energyConsumption: 1,
    mass: 1.5,

    rarity: "common",
    tier: 1,
    price: 90,
  },

  {
    id: "module_scanner_advanced",
    name: "Улучшенный сканер",
    type: "module",
    slotType: "scanner",
    description: "Расширенное обнаружение с анализом состава",

    scanRange: 10000,
    scanSpeed: 1.5,
    detectResources: true,
    detectShips: true,
    analyzeComposition: true,

    energyConsumption: 2,
    mass: 2.5,

    rarity: "uncommon",
    tier: 2,
    price: 220,
  },

  {
    id: "module_cargo_boost",
    name: "Расширение трюма",
    type: "module",
    slotType: "utility",
    description: "Увеличивает вместимость грузового отсека",

    modifiers: {
      cargoCapacity: 20,  // +20 слотов
    },

    mass: 3.0,

    rarity: "common",
    tier: 1,
    price: 180,
  },

  {
    id: "module_energy_cell",
    name: "Энергоячейка",
    type: "module",
    slotType: "utility",
    description: "Увеличивает запас энергии корабля",

    modifiers: {
      energy: 0.30,       // +30% к энергии
      energyRegen: 0.15,  // +15% к регенерации
    },

    mass: 2.0,

    rarity: "common",
    tier: 1,
    price: 160,
  },

  {
    id: "module_armor_plating",
    name: "Бронепластины",
    type: "module",
    slotType: "utility",
    description: "Дополнительная защита корпуса",

    modifiers: {
      hull: 0.40,         // +40% к корпусу
      armor: 0.25,        // +25% к броне
    },

    mass: 6.0,            // Увеличивает массу

    rarity: "uncommon",
    tier: 2,
    price: 290,
  },

  {
    id: "module_cooling_system",
    name: "Система охлаждения",
    type: "module",
    slotType: "utility",
    description: "Снижает перегрев оружия и двигателей",

    modifiers: {
      coolingRate: 0.35,  // +35% к охлаждению
      heatResistance: 0.20,
    },

    energyConsumption: 1,
    mass: 2.5,

    rarity: "uncommon",
    tier: 2,
    price: 240,
  },

  {
    id: "module_targeting_computer",
    name: "Вычислитель прицеливания",
    type: "module",
    slotType: "utility",
    description: "Повышает точность оружия",

    modifiers: {
      weaponAccuracy: 0.20,   // -20% разброс
      weaponRange: 0.15,      // +15% дальность
    },

    energyConsumption: 2,
    mass: 1.8,

    rarity: "rare",
    tier: 3,
    price: 420,
  },

  {
    id: "module_stealth_field",
    name: "Поле маскировки",
    type: "module",
    slotType: "utility",
    description: "Временно снижает заметность корабля",

    modifiers: {
      stealth: 0.50,      // -50% заметность
    },

    specialAbility: {
      id: "cloak",
      name: "Невидимость",
      duration: 8.0,
      cooldown: 30.0,
      energyCost: 25,
    },

    energyConsumption: 3,
    mass: 3.5,

    rarity: "epic",
    tier: 4,
    price: 890,
  },
];

// Быстрый доступ по ID
export const MODULES_BY_ID = Object.fromEntries(
  MODULES_CATALOG.map(m => [m.id, m])
);

// Получить модуль по ID
export function getModule(id) {
  return MODULES_BY_ID[id] || null;
}

// Получить все модули определённого типа слота
export function getModulesBySlotType(slotType) {
  return MODULES_CATALOG.filter(m => m.slotType === slotType);
}

// Получить все модули определённой редкости
export function getModulesByRarity(rarity) {
  return MODULES_CATALOG.filter(m => m.rarity === rarity);
}

// Получить все модули определённого типа
export function getModulesByType(type) {
  return MODULES_CATALOG.filter(m => m.type === type);
}

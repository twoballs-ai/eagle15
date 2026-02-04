export const RACES = {
  human: {
    id: "human",
    name: "Люди",
    description: "Адаптивная и выносливая раса, ставшая пионерами галактики.",
    traits: ["adaptive", "balanced"],

    modifiers: {
      shipHullMul: 0.0,
      shipShieldsMul: 0.0,
      shipEnergyMul: 0.0,
      shipSpeedMul: 0.0,
    },
  },

  synth: {
    id: "synth",
    name: "Синты",
    description: "Искусственные формы жизни, созданные для эффективности и выживания.",
    traits: ["no_breath", "immune_poison", "energy_based"],

    modifiers: {
      shipHullMul: (120 - 100) / 200,     // +0.10
      shipShieldsMul: (0 - 100) / 200,    // -0.50
      shipEnergyMul: (150 - 100) / 200,   // +0.25
      shipSpeedMul: 0.9 - 1.0,            // -0.10
    },
  },

  aeon: {
    id: "aeon",
    name: "Эоны",
    description: "Древние существа из чистой энергии, заключённые в физические оболочки.",
    traits: ["energy_regen", "phase_shift", "low_physical_resistance"],

    modifiers: {
      shipHullMul: (80 - 100) / 200,      // -0.10
      shipShieldsMul: (50 - 100) / 200,   // -0.25
      shipEnergyMul: (200 - 100) / 200,   // +0.50
      shipSpeedMul: 1.05 - 1.0,           // +0.05
    },
  },

  drakar: {
    id: "drakar",
    name: "Дракары",
    description: "Рептилоидная раса, эволюционировавшая для войны и выносливости.",
    traits: ["combat_bred", "slow_regen", "heat_resistant"],

    modifiers: {
      shipHullMul: (140 - 100) / 200,     // +0.20
      shipShieldsMul: (120 - 100) / 200,  // +0.10
      shipEnergyMul: (60 - 100) / 200,    // -0.20
      shipSpeedMul: 0.95 - 1.0,           // -0.05
    },
  },

  mycel: {
    id: "mycel",
    name: "Мицелы",
    description: "Коллективные грибные организмы с распределённым сознанием.",
    traits: ["collective_mind", "bio_regen", "toxin_affinity"],

    modifiers: {
      shipHullMul: (90 - 100) / 200,      // -0.05
      shipShieldsMul: (80 - 100) / 200,   // -0.10
      shipEnergyMul: (140 - 100) / 200,   // +0.20
      shipSpeedMul: 0.9 - 1.0,            // -0.10
    },
  },

  voidborn: {
    id: "voidborn",
    name: "Рождённые Пустотой",
    description: "Существа, приспособленные к существованию в вакууме между звёздами.",
    traits: ["vacuum_adapted", "high_mobility", "fragile_body"],

    modifiers: {
      shipHullMul: (70 - 100) / 200,      // -0.15
      shipShieldsMul: (60 - 100) / 200,   // -0.20
      shipEnergyMul: (180 - 100) / 200,   // +0.40
      shipSpeedMul: 1.2 - 1.0,            // +0.20
    },
  },
};

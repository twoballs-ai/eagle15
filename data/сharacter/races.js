export const RACES = {
  human: {
    id: "human",
    name: "Люди",
    description: "Адаптивная и выносливая раса, ставшая пионерами галактики.",

    stats: {
      hp: 100,
      stamina: 100,
      energy: 100,
      speed: 1.0,
    },

    traits: [
      "adaptive",     // универсальность
      "balanced",     // отсутствие штрафов
    ],
  },

  synth: {
    id: "synth",
    name: "Синты",
    description: "Искусственные формы жизни, созданные для эффективности и выживания.",

    stats: {
      hp: 120,
      stamina: 0,
      energy: 150,
      speed: 0.9,
    },

    traits: [
      "no_breath",        // не нуждаются в дыхании
      "immune_poison",    // иммунитет к ядам
      "energy_based",     // способности используют энергию
    ],
  },

  aeon: {
    id: "aeon",
    name: "Эоны",
    description: "Древние существа из чистой энергии, заключённые в физические оболочки.",

    stats: {
      hp: 80,
      stamina: 50,
      energy: 200,
      speed: 1.05,
    },

    traits: [
      "energy_regen",         // ускоренная регенерация энергии
      "phase_shift",          // фазовое смещение
      "low_physical_resistance",
    ],
  },

  drakar: {
    id: "drakar",
    name: "Дракары",
    description: "Рептилоидная раса, эволюционировавшая для войны и выносливости.",

    stats: {
      hp: 140,
      stamina: 120,
      energy: 60,
      speed: 0.95,
    },

    traits: [
      "combat_bred",      // рождены для боя
      "slow_regen",       // медленное восстановление
      "heat_resistant",   // устойчивость к высоким температурам
    ],
  },

  mycel: {
    id: "mycel",
    name: "Мицелы",
    description: "Коллективные грибные организмы с распределённым сознанием.",

    stats: {
      hp: 90,
      stamina: 80,
      energy: 140,
      speed: 0.9,
    },

    traits: [
      "collective_mind",  // коллективный разум
      "bio_regen",        // биологическая регенерация
      "toxin_affinity",   // взаимодействие с токсинами
    ],
  },

  voidborn: {
    id: "voidborn",
    name: "Рождённые Пустотой",
    description: "Существа, приспособленные к существованию в вакууме между звёздами.",

    stats: {
      hp: 70,
      stamina: 60,
      energy: 180,
      speed: 1.2,
    },

    traits: [
      "vacuum_adapted",   // адаптация к вакууму
      "high_mobility",    // повышенная мобильность
      "fragile_body",     // хрупкое тело
    ],
  },
};

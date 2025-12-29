export const CLASSES = {
  soldier: {
    id: "soldier",
    name: "Боец",
    description: "Фронтовой пилот и специалист по прямому бою.",

    pilotRole: "combat",

    baseStats: {
      hp: 30,
      stamina: 20,
    },

    allowedWeapons: ["rifle", "pistol"],

    abilities: [
      "burst_fire",
      "overload_weapons",
    ],
  },

  ace: {
    id: "ace",
    name: "Ас-пилот",
    description: "Мастер манёвров и высокоскоростного боя.",

    pilotRole: "navigation",

    baseStats: {
      stamina: 25,
      speed: 0.1,
    },

    allowedWeapons: ["pistol"],

    abilities: [
      "evasive_maneuver",
      "afterburner_boost",
    ],
  },

  engineer: {
    id: "engineer",
    name: "Инженер",
    description: "Отвечает за системы корабля, ремонт и дронов.",

    pilotRole: "engineering",

    baseStats: {
      energy: 40,
    },

    allowedWeapons: ["pistol", "tool"],

    abilities: [
      "deploy_drone",
      "emergency_repair",
    ],
  },

  tactician: {
    id: "tactician",
    name: "Тактик",
    description: "Управляет боем, сенсорами и координацией экипажа.",

    pilotRole: "command",

    baseStats: {
      energy: 20,
      stamina: 10,
    },

    allowedWeapons: ["pistol"],

    abilities: [
      "target_designation",
      "battle_command",
    ],
  },

  specialist: {
    id: "specialist",
    name: "Специалист поддержки",
    description: "Контроль, РЭБ и нестандартные системы.",

    pilotRole: "support",

    baseStats: {
      energy: 30,
    },

    allowedWeapons: ["pistol", "tool"],

    abilities: [
      "electronic_warfare",
      "shield_boost",
    ],
  },
};

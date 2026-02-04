export const CLASSES = {
  soldier: {
    id: "soldier",
    name: "Боец",
    description: "Фронтовой пилот и специалист по прямому бою.",
    pilotRole: "combat",

    modifiers: {
      shipHullMul: 0.05,          // +5% корпус (пример)
      weaponDamageMul: 0.03,      // +3% урон (если будешь использовать)
    },

    allowedWeapons: ["rifle", "pistol"],
    abilities: ["burst_fire", "overload_weapons"],
  },

  ace: {
    id: "ace",
    name: "Ас-пилот",
    description: "Мастер манёвров и высокоскоростного боя.",
    pilotRole: "navigation",

    modifiers: {
      shipSpeedMul: 0.05,         // +5% скорость
      shipTurnMul: 0.06,          // +6% поворот (если захочешь)
    },

    allowedWeapons: ["pistol"],
    abilities: ["evasive_maneuver", "afterburner_boost"],
  },

  engineer: {
    id: "engineer",
    name: "Инженер",
    description: "Отвечает за системы корабля, ремонт и дронов.",
    pilotRole: "engineering",

    modifiers: {
      shipEnergyMul: 0.08,
      repairRateMul: 0.10,
    },

    allowedWeapons: ["pistol", "tool"],
    abilities: ["deploy_drone", "emergency_repair"],
  },

  tactician: {
    id: "tactician",
    name: "Тактик",
    description: "Управляет боем, сенсорами и координацией экипажа.",
    pilotRole: "command",

    modifiers: {
      sensorRangeMul: 0.10,
      weaponCooldownMul: -0.05, // -5% кулдаун (быстрее стреляет)
    },

    allowedWeapons: ["pistol"],
    abilities: ["target_designation", "battle_command"],
  },

  specialist: {
    id: "specialist",
    name: "Специалист поддержки",
    description: "Контроль, РЭБ и нестандартные системы.",
    pilotRole: "support",

    modifiers: {
      shipShieldsMul: 0.07,
      ecmPowerMul: 0.10,
    },

    allowedWeapons: ["pistol", "tool"],
    abilities: ["electronic_warfare", "shield_boost"],
  },
};

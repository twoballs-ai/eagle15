export const SPECIALIZATIONS = {
  assault: {
    id: "assault",
    classId: "soldier",
    name: "Assault",

    modifiers: {
      shipHullMul: 0.03,
      shipSpeedMul: 0.02,
    },

    abilities: ["dash"],
  },

  sniper: {
    id: "sniper",
    classId: "soldier",
    name: "Sniper",

    modifiers: {
      weaponSpreadMul: -0.10,
      weaponRangeMul: 0.08,
    },

    abilities: ["aim_focus"],
  },
};

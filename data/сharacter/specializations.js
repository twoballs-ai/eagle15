export const SPECIALIZATIONS = {
  assault: {
    id: "assault",
    classId: "soldier",
    name: "Assault",

    statModifiers: {
      hp: 20,
      speed: 0.1,
    },

    abilities: [
      "dash",
    ],
  },

  sniper: {
    id: "sniper",
    classId: "soldier",
    name: "Sniper",

    statModifiers: {
      energy: 20,
    },

    abilities: [
      "aim_focus",
    ],
  },
};

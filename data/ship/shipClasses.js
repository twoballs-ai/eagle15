export const SHIP_CLASSES = {
  scout: {
    id: "scout",
    name: "Scout",

    baseStats: {
      hull: 80,
      shields: 40,
      energy: 60,
      speed: 1.4,
    },

    slots: {
      weapon: 1,
      utility: 1,
    },
  },

  frigate: {
    id: "frigate",
    name: "Frigate",

    baseStats: {
      hull: 160,
      shields: 120,
      energy: 100,
      speed: 0.9,
    },

    slots: {
      weapon: 3,
      utility: 2,
    },
  },
};

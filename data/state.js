export function createState() {
  return {
    camera: { x: 0, y: 0, zoom: 1 },

    // создаются позже (после стартового экрана)
    player: null,
    playerShip: null,

    // на будущее (NPC, враги, конвои и т.п.)
    characters: [],
    ships: [],

    ui: {
      menuOpen: false,
      modalOpen: false,
    },

    currentSystemId: null,
    selectedSystemId: null,
  };
}

// data/state.js
import { applySaveToState } from "./save.js";

export function createState(save = null) {
  const playerShip = {
    id: "ship_player",
    isPlayer: true,
    factionId: "player",
    stats: { hull: 120, shields: 80, energy: 60, speed: 1.0 },
    runtime: {
      x: 0, z: 0,
      vx: 0, vz: 0,
      yaw: 0,
      targetX: null,
      targetZ: null,
      accel: 520,
      turnSpeed: 2.4,
      maxSpeed: 260,
      radius: 10,
    },
  };
console.log("[STATE] createState(save):", save);
  const state = {
    paused: false,
    camera: { x: 0, y: 0, zoom: 1 },
    player: null,
    playerShipClassId: "scout",
    playerShip,
    characters: [],
    ships: [playerShip],
    ui: { menuOpen: false, modalOpen: false },
    currentSystemId: null,
    selectedSystemId: null,
  };

  return applySaveToState(state, save);
}

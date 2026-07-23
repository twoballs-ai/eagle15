// src/data/state.js
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

  const state = {
    paused: false,
    camera: { x: 0, y: 0, zoom: 1 },
    player: null,
    playerShipClassId: "scout",
    playerShip,
    characters: [],
    ships: [playerShip],
    onlinePeers: [],
    ui: { menuOpen: false, modalOpen: false },
    currentSystemId: null,
    selectedSystemId: null,
    credits: 2500,
    inventoryCapacity: 100,
    inventorySlots: Array.from({ length: 100 }, (_, i) => {
      const seed = [
        ["oxygen", 40], ["iron_ore", 30], ["copper_ore", 30],
        ["silicon_dust", 30], ["polymer_slurry", 20],
      ];
      if (i < seed.length) return { id: seed[i][0], n: seed[i][1] };
      return null;
    }),

    // 🚨 НОВОЕ: Уникальный ID пилота и состояние квестов теперь часть state
    playerId: save?.playerId ?? `pilot_${Math.random().toString(36).slice(2, 10)}`,
    questState: save?.questState ?? {
      active: {},
      completed: {},
      flags: {},
      visitedPoi: {},
      log: []
    },
  };

  return applySaveToState(state, save);
}
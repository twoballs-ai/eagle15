// src/data/state.js
import { applySaveToState } from "./save.js";

export function createState(save = null) {
  const playerShip = {
    id: "ship_player",
    isPlayer: true,
    factionId: "union",
    stats: { hull: 120, shields: 80, energy: 60, speed: 1.0 },

    // ===== СЛОТЫ ОБОРУДОВАНИЯ КОРАБЛЯ =====
    // Теперь каждый слот — это объект { slotType: string, item: object|null }
    // Это позволяет UI отображать тип слота (например, "Основное", "Двигатель") даже когда он пуст.
    weaponSlots: [
      { slotType: 'main', item: null },
      { slotType: 'auxiliary', item: null }
    ],
    utilitySlots: [
      { slotType: 'engine', item: null },
      { slotType: 'shield', item: null }
    ],

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

    playerId: save?.playerId ?? `pilot_${Math.random().toString(36).slice(2, 10)}`,
    questState: save?.questState ?? {
      active: {},
      completed: {},
      flags: {},
      visitedPoi: {},
      log: []
    },

    reputation: save?.reputation ?? {
      union: 0,
      traders: 0,
      pirates: -10,
      neutral: 0,
    },
    
    playerLevel: save?.playerLevel ?? 1,
    playerXP: save?.playerXP ?? 0,
    totalXPEarned: save?.totalXPEarned ?? 0,
    xpLog: save?.xpLog ?? [],
  };

  return applySaveToState(state, save);
}
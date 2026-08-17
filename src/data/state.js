// src/data/state.js
import { applySaveToState } from "./save.js";

export function createState(save = null) {
  const playerShip = {
    id: "ship_player",
    isPlayer: true,
    factionId: "union", // Или "player", в зависимости от того, как ты считаешь фракцию игрока
    stats: { hull: 120, shields: 80, energy: 60, speed: 1.0 },

    // ===== СЛОТЫ ОБОРУДОВАНИЯ КОРАБЛЯ =====
    // weaponSlots: массив слотов для оружия (количество зависит от класса корабля)
    // utilitySlots: массив слотов для утилити модулей
    // Каждый слот: null (пустой) или { id: string, ...доп.данные }
    weaponSlots: [],
    utilitySlots: [],

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

    // 🚨 НОВОЕ: Уникальный ID пилота и состояние квестов
    playerId: save?.playerId ?? `pilot_${Math.random().toString(36).slice(2, 10)}`,
    questState: save?.questState ?? {
      active: {},
      completed: {},
      flags: {},
      visitedPoi: {},
      log: []
    },

    // 🚨 НОВОЕ: Репутация игрока с фракциями
    // Диапазон: от -100 (Враждебный) до 100 (Союзный). 0 = Нейтральный.
    // При загрузке сохранения (save) эти значения будут перезаписаны,
    // а при новой игре будут использованы значения по умолчанию.
    reputation: save?.reputation ?? {
      union: 0,
      traders: 0,
      pirates: -10, // Пример: пираты сразу немного не любят новичков
      neutral: 0,
    },
     // ===== СИСТЕМА УРОВНЕЙ ИГРОКА =====
    // Текущий уровень (от 1 до 50)
    playerLevel: save?.playerLevel ?? 1,

    // XP в рамках текущего уровня
    playerXP: save?.playerXP ?? 0,

    // Всего XP заработано за всё время (статистика)
    totalXPEarned: save?.totalXPEarned ?? 0,

    // Лог последних начислений XP (для UI)
    xpLog: save?.xpLog ?? [],
  };

  return applySaveToState(state, save);
}
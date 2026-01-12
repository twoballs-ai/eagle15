// data/system/spawnTables.js
// Простой “режиссёр”: что спавнить в системе по фракциям.

export const SPAWN_TABLES = {
  pirates: {
    factionId: "pirates",
    kind: "enemy",
    // сколько пачек
    groupsMin: 1,
    groupsMax: 2,
    // сколько кораблей в группе
    perGroupMin: 1,
    perGroupMax: 3,
    // какие корабли
    shipClasses: ["scout", "frigate"],
    shipRaceIds: ["human", "synth"],
    // какие точки предпочитают
    preferredPointTypes: ["pirate", "lane"],
  },

  traders: {
    factionId: "traders",
    kind: "npc",
    groupsMin: 0,
    groupsMax: 2,
    perGroupMin: 1,
    perGroupMax: 2,
    shipClasses: ["scout"],
    shipRaceIds: ["human"],
    preferredPointTypes: ["trader", "lane"],
  },

  neutral: {
    factionId: "neutral",
    kind: "npc",
    groupsMin: 0,
    groupsMax: 1,
    perGroupMin: 1,
    perGroupMax: 1,
    shipClasses: ["scout"],
    shipRaceIds: ["human", "synth"],
    preferredPointTypes: ["lane"],
  },
};

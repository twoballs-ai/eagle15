import { generateRandomNpc, generatePirate } from "../../data/npc/generators.js";
import { getSpawnAlertLevelFromQuests } from "../story/actRules.js";

export function spawnSystemActors({
  galaxySeed,
  systemId,
  playerFactionId,
  spawnAlertLevel,
  actId,
  persistentNpcManager,
}) {
  const ships = [];
  const characters = [];
  const spawnPoints = [];

  const seed = galaxySeed + (typeof systemId === "string" ? systemId.charCodeAt(0) * 1000 : systemId);

  // ==========================================
  // 1. Постоянные NPC (квестодатели и т.д.)
  // ==========================================
  if (persistentNpcManager) {
    const persistentNpcs = persistentNpcManager.getForSystem(systemId);
    for (const npc of persistentNpcs) {
      if (npc.alive === false) continue;
      
      npc.runtime = {
        x: npc.spawnPosition?.x ?? (Math.random() - 0.5) * 600,
        z: npc.spawnPosition?.z ?? (Math.random() - 0.5) * 600,
        vx: 0, vz: 0,
        yaw: Math.random() * Math.PI * 2,
      };
      ships.push(npc);
    }
  }

  // ==========================================
  // 2. Временные NPC (случайные)
  // ==========================================
  const randomNpcCount = Math.min(5, 2 + (spawnAlertLevel ?? 0));
  
  for (let i = 0; i < randomNpcCount; i++) {
    // С небольшим шансом спавним пирата, иначе рандомный
    const npc = (Math.random() < 0.3)
      ? generatePirate(seed + i)
      : generateRandomNpc(seed + i);
    
    if (!npc) continue;

    npc.runtime = {
      x: (Math.random() - 0.5) * 1000,
      z: (Math.random() - 0.5) * 1000,
      vx: 0, vz: 0,
      yaw: Math.random() * Math.PI * 2,
    };

    ships.push(npc);
  }

  return { ships, characters, spawnPoints };
}
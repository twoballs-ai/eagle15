// src/gameplay/spawn/spawnSystem.js
import { generatePirate, generateMerchant } from "../../data/npc/generators.js";
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

  // ===== ДИАГНОСТИКА: логируем входные параметры =====
  console.log(`[spawnSystemActors] galaxySeed=${galaxySeed}, systemId="${systemId}", seed=${seed}, spawnAlertLevel=${spawnAlertLevel}, actId="${actId}"`);

  // ==========================================
  // 1. Постоянные NPC (квестодатели и т.д.)
  // ==========================================
  if (persistentNpcManager) {
    const persistentNpcs = persistentNpcManager.getForSystem(systemId);
    console.log(`[spawnSystemActors] Found ${persistentNpcs.length} persistent NPCs for system "${systemId}"`);
    
    for (const npc of persistentNpcs) {
      if (npc.alive === false) continue;

      // ✅ МЕТКА: помечаем NPC как persistent, чтобы отличать от temporary
      npc.isPersistent = true;

      npc.runtime = {
        x: npc.spawnPosition?.x ?? (Math.random() - 0.5) * 600,
        y: 0,
        z: npc.spawnPosition?.z ?? (Math.random() - 0.5) * 600,
        vx: 0, vz: 0,
        yaw: Math.random() * Math.PI * 2,
      };
      ships.push(npc);
    }
  }

  // ==========================================
  // 2. Гарантированный пират в act1 (для геймплея)
  // ==========================================
  // В первом акте всегда должен быть хотя бы один враг,
  // чтобы игрок мог попробовать бой и получить XP.
  // Без этого при маленьком spawnAlertLevel и невезучем рандоме
  // игрок может летать по системе и ни разу не встретить врага.
  if (actId === "act1") {
    const guaranteedPirate = generatePirate(seed + 9999);
    if (guaranteedPirate) {
      guaranteedPirate.isPersistent = false;
      guaranteedPirate.runtime = {
        // Спавним подальше от квестодателя (200, 100) и торговца (-150, -200)
        // чтобы не мешать диалогам, но в досягаемости для встречи
        x: 400 + (Math.random() - 0.5) * 100,
        y: 0,
        z: -300 + (Math.random() - 0.5) * 100,
        vx: 0, vz: 0,
        yaw: Math.random() * Math.PI * 2,
      };
      ships.push(guaranteedPirate);
      console.log(`[spawnSystemActors] Guaranteed pirate spawned: id="${guaranteedPirate.id}" name="${guaranteedPirate.name}"`);
    } else {
      console.warn("[spawnSystemActors] 🚨 generatePirate() returned null for guaranteed pirate!");
    }
  }

  // ==========================================
  // 3. Временные NPC (случайные встречи)
  // ==========================================
  const randomNpcCount = Math.min(5, 2 + (spawnAlertLevel ?? 0));
  console.log(`[spawnSystemActors] Spawning ${randomNpcCount} random NPCs (spawnAlertLevel=${spawnAlertLevel})`);

  let piratesSpawned = 0;
  let merchantsSpawned = 0;
  let generatorsFailed = 0;

  for (let i = 0; i < randomNpcCount; i++) {
    // 🚨 ИЗМЕНЕНО: увеличиваем шанс пирата с 30% до 45%
    // Раньше при 2-3 NPC часто получалось 0 пиратов из-за рандома.
    // Теперь вероятность встретить пирата выше, что делает геймплей разнообразнее.
    const usePirate = Math.random() < 0.45;
    const generator = usePirate ? generatePirate : generateMerchant;
    const generatorName = usePirate ? "generatePirate" : "generateMerchant";
    
    const npc = generator(seed + i);
    
    // 🚨 ДИАГНОСТИКА: если генератор вернул null — логируем и пробуем фоллбэк
    if (!npc) {
      console.warn(`[spawnSystemActors] ${generatorName}(seed=${seed + i}) returned null!`);
      generatorsFailed++;
      
      // Фоллбэк: если пират не создался — пробуем торговца, и наоборот
      const fallback = usePirate ? generateMerchant(seed + i) : generatePirate(seed + i);
      if (!fallback) {
        console.warn(`[spawnSystemActors] Fallback also returned null for seed=${seed + i}, skipping`);
        continue;
      }
      
      fallback.isPersistent = false;
      fallback.runtime = {
        x: (Math.random() - 0.5) * 1000,
        y: 0,
        z: (Math.random() - 0.5) * 1000,
        vx: 0, vz: 0,
        yaw: Math.random() * Math.PI * 2,
      };
      ships.push(fallback);
      if (usePirate) merchantsSpawned++; else piratesSpawned++;
      console.log(`[spawnSystemActors] Fallback ${usePirate ? "merchant" : "pirate"} created: id="${fallback.id}"`);
      continue;
    }

    if (usePirate) piratesSpawned++; else merchantsSpawned++;
    console.log(`[spawnSystemActors] ${generatorName} created NPC id="${npc.id}" name="${npc.name}" factionId="${npc.factionId}"`);

    npc.isPersistent = false;

    npc.runtime = {
      x: (Math.random() - 0.5) * 1000,
      y: 0,
      z: (Math.random() - 0.5) * 1000,
      vx: 0, vz: 0,
      yaw: Math.random() * Math.PI * 2,
    };

    ships.push(npc);
  }

  // ===== ИТОГОВАЯ ДИАГНОСТИКА =====
  console.log(`[spawnSystemActors] Summary: ${ships.length} total ships (${persistentNpcManager?.getAll().length ?? 0} persistent, ${piratesSpawned} pirates, ${merchantsSpawned} merchants, ${generatorsFailed} generator failures)`);
  
  return { ships, characters, spawnPoints };
}
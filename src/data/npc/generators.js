import { getTemplate } from "./templates.js";
import { randomPick, randomInt } from "../../utils/random.js";

let nextNpcId = 1;

function createNpcId() {
  return `npc_${nextNpcId++}`;
}

function createNpcFromTemplate(templateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    console.error(`[generators] Template not found: ${templateId}`);
    return null;
  }

  return {
    id: createNpcId(),
    templateId,
    name: overrides.name ?? template.name,
    factionId: template.factionId,
    shipClass: template.shipClass,
    model: template.model,
    stats: { ...template.stats },
    runtime: null,
    alive: true,
    isEnemy: template.factionId === "pirates",
    aiState: "idle",
    ai: { ...template.ai },
    weaponPresetId: template.weaponPresetId,
    talkType: template.factionId === "pirates" ? "enemy" : "npc",
    talkRadius: 280,
    persistent: overrides.persistent ?? false,
    questId: overrides.questId ?? null,
    spawnPosition: overrides.spawnPosition ?? null,
    currentSystemId: overrides.currentSystemId ?? null,
    // ✅ ДОБАВЛЕНО: уровень NPC (влияет на сложность и награды)
    level: overrides.level ?? 1,
    // ✅ ДОБАВЛЕНО: тип спавна
    // "permanent" - всегда в системе (квестодатели, важные NPC)
    // "respawn" - появляется и исчезает (случайные встречи)
    // "one_time" - одноразовый NPC (исчезает после квеста)
    spawnType: overrides.spawnType ?? (overrides.persistent ? "permanent" : "respawn"),
    // ✅ ДОБАВЛЕНО: важность NPC
    // "important" - ключевые персонажи сюжета
    // "regular" - обычные NPC
    importance: overrides.importance ?? (overrides.questId ? "important" : "regular"),
    ...overrides,
  };
}

export function generateRandomNpc(seed) {
  const templates = ["pirate_scout", "trader_merchant", "union_patrol"];
  const templateId = randomPick(templates, seed);
  return createNpcFromTemplate(templateId);
}

export function generateMerchant(seed) {
  return createNpcFromTemplate("trader_merchant", {
    name: "Торговец " + randomInt(100, 999, seed),
    level: 2,
    importance: "regular",
  });
}

export function generateQuestGiver(questId, seed) {
  const templates = ["trader_merchant", "union_patrol"];
  const templateId = randomPick(templates, seed);
  return createNpcFromTemplate(templateId, {
    name: "Квестодатель " + randomInt(100, 999, seed),
    persistent: true,
    questId,
    level: 3,
    importance: "important",
    spawnType: "permanent",
  });
}

export function generatePirate(seed) {
  const templates = ["pirate_scout", "pirate_raider"];
  const templateId = randomPick(templates, seed);
  return createNpcFromTemplate(templateId, {
    level: 1 + Math.floor(seed % 3),
    importance: "regular",
  });
}

// Универсальный генератор по типу
export function generateNpcByType(type, seed, overrides = {}) {
  switch (type) {
    case "pirate": return generatePirate(seed);
    case "merchant": return generateMerchant(seed);
    case "quest_giver": return generateQuestGiver(overrides.questId, seed);
    case "important":
      return createNpcFromTemplate(randomPick(["trader_merchant", "union_patrol"], seed), {
        name: "Важный персонаж " + randomInt(100, 999, seed),
        persistent: true,
        importance: "important",
        spawnType: "permanent",
        level: 4,
        ...overrides,
      });
    case "one_time":
      return createNpcFromTemplate(randomPick(["trader_merchant", "union_patrol", "pirate_scout"], seed), {
        name: "Временный NPC " + randomInt(100, 999, seed),
        importance: "regular",
        spawnType: "one_time",
        level: 2,
        ...overrides,
      });
    default: return generateRandomNpc(seed);
  }
}
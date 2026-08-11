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
  });
}

export function generateQuestGiver(questId, seed) {
  const templates = ["trader_merchant", "union_patrol"];
  const templateId = randomPick(templates, seed);
  return createNpcFromTemplate(templateId, {
    name: "Квестодатель " + randomInt(100, 999, seed),
    persistent: true,
    questId,
  });
}

export function generatePirate(seed) {
  const templates = ["pirate_scout", "pirate_raider"];
  const templateId = randomPick(templates, seed);
  return createNpcFromTemplate(templateId);
}

// Универсальный генератор по типу
export function generateNpcByType(type, seed, overrides = {}) {
  switch (type) {
    case "pirate": return generatePirate(seed);
    case "merchant": return generateMerchant(seed);
    case "quest_giver": return generateQuestGiver(overrides.questId, seed);
    default: return generateRandomNpc(seed);
  }
}
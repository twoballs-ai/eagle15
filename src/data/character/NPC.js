// src/data/character/NPC.js
import { validateAndBuildCharacterData } from "./characterUtils.js";

export function createNPC({
  id, name, raceId, classId,
  specializationId = null,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
}) {
  const data = validateAndBuildCharacterData(raceId, classId, specializationId);

  return {
    id, name,
    raceId, classId,
    specializationId: data.spec ? specializationId : null,
    factionId, factionRankId, reputation,
    traits: data.traits,       // ✅ Теперь NPC тоже имеют трейты расы
    abilities: data.abilities, // ✅ Единый способ сборки способностей
    modifiers: data.modifiers, // ✅ Теперь NPC тоже имеют модификаторы (например, бонусы расы)
    controller: "ai",
    alive: true,
  };
}
// src/data/character/pilot.js
import { validateAndBuildCharacterData } from "./characterUtils.js";

export function createPilotProfile({
  id, name, raceId, classId,
  specializationId = null,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
  enableSpecializations = false,
}) {
  // Если спец. отключены, передаем null, чтобы утилита их проигнорировала
  const effectiveSpecId = enableSpecializations ? specializationId : null;
  const data = validateAndBuildCharacterData(raceId, classId, effectiveSpecId);

  return {
    id, name,
    raceId, classId,
    specializationId: data.spec ? effectiveSpecId : null,
    factionId, factionRankId, reputation,
    traits: data.traits,
    abilities: data.abilities,
    modifiers: data.modifiers,
    alive: true,
    controller: "player",
  };
}
// src/data/faction/factionRelationsUtil.js
import { FACTION_RELATIONS, REL } from "./factionRelations.js";
import { getReputationScore, getReputationLevel } from "./reputation.js";

const FACTION_ALIASES = {
  player: "union",
};

export function normalizeFactionId(factionId) {
  if (!factionId) return "neutral";
  return FACTION_ALIASES[factionId] ?? factionId;
}

// Старая функция (для NPC vs NPC)
export function getFactionRelation(aId, bId) {
  const a = normalizeFactionId(aId);
  const b = normalizeFactionId(bId);
  if (a === b) return REL.ally;
  const row = FACTION_RELATIONS[a];
  return row?.[b] || REL.neutral;
}

// НОВАЯ функция: отношение конкретной фракции к игроку (5 уровней)
export function getPlayerFactionRelation(state, factionId) {
  const normalizedId = normalizeFactionId(factionId);
  const score = getReputationScore(state, normalizedId);
  const level = getReputationLevel(score);
  
  return {
    score,
    level: level.id,       // "hostile", "wary", "neutral", "friendly", "ally"
    levelName: level.name, // "Враждебный", "С опасением", и т.д.
  };
}

export function isHostile(aId, bId) {
  return getFactionRelation(aId, bId) === REL.hostile;
}

export function isAlly(aId, bId) {
  return getFactionRelation(aId, bId) === REL.ally;
}
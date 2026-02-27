// data/factionRelationsUtil.js
import { FACTION_RELATIONS, REL } from "./factionRelations.js";

const FACTION_ALIASES = {
  player: "union",
};

export function normalizeFactionId(factionId) {
  if (!factionId) return "neutral";
  return FACTION_ALIASES[factionId] ?? factionId;
}

export function getFactionRelation(aId, bId) {
  const a = normalizeFactionId(aId);
  const b = normalizeFactionId(bId);

  if (a === b) return REL.ally;

  const row = FACTION_RELATIONS[a];
  const rel = row?.[b];

  return rel || REL.neutral;
}

export function isHostile(aId, bId) {
  return getFactionRelation(aId, bId) === REL.hostile;
}

export function isAlly(aId, bId) {
  return getFactionRelation(aId, bId) === REL.ally;
}

// data/factionRelationsUtil.js
import { FACTION_RELATIONS, REL } from "./factionRelations.js";

export function getFactionRelation(aId, bId) {
  if (!aId || !bId) return REL.neutral;
  if (aId === bId) return REL.ally;

  const row = FACTION_RELATIONS[aId];
  const rel = row?.[bId];

  return rel || REL.neutral;
}

export function isHostile(aId, bId) {
  return getFactionRelation(aId, bId) === REL.hostile;
}

export function isAlly(aId, bId) {
  return getFactionRelation(aId, bId) === REL.ally;
}

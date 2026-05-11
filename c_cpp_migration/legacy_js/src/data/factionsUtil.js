import { FACTIONS } from "./faction/factions.js";
import { FACTION_RANKS } from "./faction/factionRanks.js";

export function getFactionName(id) {
  return FACTIONS[id]?.name || id;
}
export function getRankName(id) {
  return FACTION_RANKS[id]?.name || id;
}

// gameplay/quest/questCatalog.js
import { ACT1_MAIN_QUESTS } from "../../data/content/acts/act1/mainQuests.js";
import { WORLD_CONTRACTS } from "../../data/content/world/quests/contracts.js";
import { WORLD_NPC_SIDEQUESTS } from "../../data/content/world/quests/npc_sidequests.js";

export const QUEST_CATALOG = [
  ...ACT1_MAIN_QUESTS,
  ...WORLD_CONTRACTS,
  ...WORLD_NPC_SIDEQUESTS,
];

export const QUESTS_BY_ID = Object.fromEntries(QUEST_CATALOG.map((q) => [q.id, q]));

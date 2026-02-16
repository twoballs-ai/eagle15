// data/content/index.js

// ===== acts =====
import { ACT1_DEF } from "./acts/act1/act.js";
import { ACT1_MAIN_QUESTS } from "./acts/act1/mainQuests.js";
import { ACT1_CUTSCENES } from "./acts/act1/cutscenes.js";
import { ACT1_TRIGGERS } from "./acts/act1/triggers.js";
import { runEvent } from "./events_router.js";
// ===== world =====
import { WORLD_CONTRACTS } from "./world/quests/contracts.js";
import { WORLD_TRIGGERS } from "./world/triggers/worldTriggers.js";



export function createContentRegistry() {
  const acts = {
    act1: ACT1_DEF,
    // act2: ACT2_DEF ...
  };

  // quest + cutscene registries
  const questsById = {};
  const cutscenesById = {};

  // acts: main quests
  for (const q of ACT1_MAIN_QUESTS) questsById[q.id] = q;

  // world quests
  for (const q of WORLD_CONTRACTS) questsById[q.id] = q;

  // cutscenes
  for (const cs of ACT1_CUTSCENES) cutscenesById[cs.id] = cs.factory;

  // hooks
  const hooksByAct = {
    act1: ACT1_TRIGGERS,
  };

  const worldHooks = WORLD_TRIGGERS;



  return {
    acts,
    hooksByAct,
    worldHooks,
    questsById,
    cutscenesById,
    events: {
  run: runEvent,
},
  };
}

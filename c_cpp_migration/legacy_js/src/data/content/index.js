// data/content/index.js

// ===== acts =====
import { ACT1_DEF } from "./acts/act1/act.js";
import { ACT1_CUTSCENES } from "./acts/act1/cutscenes.js";
import { ACT1_TRIGGERS } from "./acts/act1/triggers.js";
import { runEvent } from "./events_router.js";
import { validateContentRegistry } from "./validation.js";
// ===== world =====
import { WORLD_TRIGGERS } from "./world/triggers/worldTriggers.js";
import { QUEST_CATALOG } from "../../gameplay/quest/questCatalog.js";



export function createContentRegistry() {
  const acts = {
    act1: ACT1_DEF,
    // act2: ACT2_DEF ...
  };

  // quest + cutscene registries
  const questsById = {};
  const cutscenesById = {};

  // quests (глобальные + второстепенные)
  for (const q of QUEST_CATALOG) questsById[q.id] = q;

  // cutscenes
  for (const cs of ACT1_CUTSCENES) cutscenesById[cs.id] = cs.factory;

  // hooks
  const hooksByAct = {
    act1: ACT1_TRIGGERS,
  };

  const worldHooks = WORLD_TRIGGERS;

  const validationWarnings = validateContentRegistry({ questsById, cutscenesById, hooksByAct });
  if (validationWarnings.length) {
    console.warn(`[ContentRegistry] validation warnings:
${validationWarnings.map((w) => ` - ${w}`).join("\n")}`);
  }

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

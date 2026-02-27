// gameplay/story/actRules.js

const GLOBAL_TYPES = new Set(["main", "global"]);

export function isGlobalMission(questDef) {
  return GLOBAL_TYPES.has(questDef?.type);
}

export function resolveQuestPriority(questDef, requestedPriority) {
  if (typeof requestedPriority === "boolean") return requestedPriority;
  if (typeof questDef?.priorityDefault === "boolean") return questDef.priorityDefault;
  return isGlobalMission(questDef);
}

export function getSpawnAlertLevelFromQuests(questDefs = []) {
  // Наличие любой глобальной миссии повышает "боевую" напряжённость в системе.
  const hasGlobal = questDefs.some(isGlobalMission);
  return hasGlobal ? "story_hot" : "ambient";
}

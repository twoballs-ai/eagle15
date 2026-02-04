import { RACES } from "./races.js";
import { CLASSES } from "./classes.js";
import { SPECIALIZATIONS } from "./specializations.js";

function mergeModifiers(base, add) {
  if (!add) return base;
  for (const k in add) {
    const v = add[k];
    if (v == null) continue;
    base[k] = (base[k] ?? 0) + v; // модификаторы — складываем
  }
  return base;
}

export function createPilotProfile({
  id, name, raceId, classId,
  specializationId = null,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
  enableSpecializations = false,   // ✅ флаг
}) {
  const race = RACES[raceId];
  const cls = CLASSES[classId];

  const spec =
    enableSpecializations && specializationId
      ? SPECIALIZATIONS[specializationId]
      : null;

  if (!race) throw new Error(`Unknown race: ${raceId}`);
  if (!cls) throw new Error(`Unknown class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Specialization ${spec.id} does not match class ${classId}`);
  }

  const modifiers = {};
  mergeModifiers(modifiers, race.modifiers);
  mergeModifiers(modifiers, cls.modifiers);
  mergeModifiers(modifiers, spec?.modifiers);

  return {
    id, name,
    raceId, classId,
    specializationId: spec ? specializationId : null,
    factionId, factionRankId, reputation,
    traits: [...(race.traits || [])],
    abilities: [...(cls.abilities || []), ...(spec?.abilities || [])],
    modifiers,
    alive: true,
    controller: "player",
  };
}

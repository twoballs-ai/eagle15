// src/data/character/characterUtils.js
import { RACES } from "./races.js";
import { CLASSES } from "./classes.js";
import { SPECIALIZATIONS } from "./specializations.js";

export function mergeModifiers(base, add) {
  if (!add) return base;
  const result = { ...base };
  for (const k in add) {
    const v = add[k];
    if (v == null) continue;
    result[k] = (result[k] ?? 0) + v;
  }
  return result;
}

export function validateAndBuildCharacterData(raceId, classId, specializationId) {
  const race = RACES[raceId];
  const cls = CLASSES[classId];
  const spec = specializationId ? SPECIALIZATIONS[specializationId] : null;

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
    race,
    cls,
    spec,
    modifiers,
    traits: [...(race.traits || [])],
    abilities: [...(cls.abilities || []), ...(spec?.abilities || [])],
  };
}
import { RACES } from "./races.js";
import { CLASSES } from "./classes.js";
import { SPECIALIZATIONS } from "./specializations.js";

export function createNPC({
  id,
  name,
  raceId,
  classId,
  specializationId = null,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
}) {
  const race = RACES[raceId];
  const cls = CLASSES[classId];
  const spec = specializationId ? SPECIALIZATIONS[specializationId] : null;

  if (!race) throw new Error(`Unknown race: ${raceId}`);
  if (!cls) throw new Error(`Unknown class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Specialization ${spec.id} does not match class ${classId}`);
  }

  return {
    id,
    name,
    raceId,
    classId,
    specializationId,
    factionId,
    factionRankId,
    reputation,
    abilities: [...cls.abilities, ...(spec?.abilities || [])],
    controller: "ai",
    alive: true,
  };
}

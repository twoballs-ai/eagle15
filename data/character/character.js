import { RACES } from "./races.js";
import { CLASSES } from "./classes.js";
import { SPECIALIZATIONS } from "./specializations.js";

export function createCharacter({
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

  const stats = {
    hp: race.stats.hp + (cls.baseStats.hp || 0),
    stamina: race.stats.stamina + (cls.baseStats.stamina || 0),
    energy: race.stats.energy + (cls.baseStats.energy || 0),
    speed: race.stats.speed,
  };

  if (spec?.statModifiers) {
    for (const k in spec.statModifiers) {
      stats[k] = (stats[k] || 0) + spec.statModifiers[k];
    }
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

    stats,
    abilities: [
      ...cls.abilities,
      ...(spec?.abilities || []),
    ],

    controller: "ai",
    alive: true,
  };

}

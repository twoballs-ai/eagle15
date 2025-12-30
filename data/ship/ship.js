import { SHIP_RACES } from "./shipRaces.js";
import { SHIP_CLASSES } from "./shipClasses.js";
import { SHIP_SPECIALIZATIONS } from "./shipSpecializations.js";

export function createShip({
  id,
  name,
  raceId,
  classId,
  specializationId = null,
  factionId = "neutral",
}) {
  const race = SHIP_RACES[raceId];
  const cls = SHIP_CLASSES[classId];
  const spec = specializationId
    ? SHIP_SPECIALIZATIONS[specializationId]
    : null;

  if (!race) throw new Error(`Unknown ship race: ${raceId}`);
  if (!cls) throw new Error(`Unknown ship class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Ship spec mismatch: ${spec.id}`);
  }

  const stats = {
    ...cls.baseStats,
  };

  if (spec?.statModifiers) {
    for (const k in spec.statModifiers) {
      stats[k] += spec.statModifiers[k];
    }
  }

  // race bonuses (множители)
  for (const k in race.bonuses) {
    if (stats[k] != null) {
      stats[k] *= race.bonuses[k];
    }
  }

  return {
    id,
    name,

    raceId,
    classId,
    specializationId,
    factionId,
    stats,
    slots: cls.slots,

    ownerId: null, // player / npc id
    faction: "neutral",

    alive: true,

    // ✅ runtime: положение/движение корабля в звёздной системе
    runtime: {
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      yaw: 0,

      radius: 6,
  targetX: null,
  targetZ: null,
      maxSpeed: 260,
      accel: 420,
      turnSpeed: 2.6, // рад/сек
      drag: 1.8,      // 1/сек
    },
  };
}

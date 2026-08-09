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
  customStats = null,
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

  // Если переданы customStats (например для NPC), используем их
  // Иначе берём baseStats из класса
  const baseStats = customStats || { ...cls.baseStats };

  const stats = {
    ...baseStats,
  };

  if (spec?.statModifiers) {
    for (const k in spec.statModifiers) {
      stats[k] += spec.statModifiers[k];
    }
  }

  // race bonuses (множители) - применяем только если это не customStats
  if (!customStats) {
    for (const k in race.bonuses) {
      if (stats[k] != null) {
        stats[k] *= race.bonuses[k];
      }
    }
  }

  // ✅ Инициализируем runtime с полями брони и щитов из stats
  const hull = Math.round(stats.hull ?? 100);
  const shields = Math.round(stats.shields ?? 0);

  return {
  id,
  name,
  raceId,
  classId,
  specializationId,
  factionId,
  ownerId: null,
  stats,
  slots: cls.slots,
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
      
      // ✅ Броня и щиты — сразу из stats
      armor: hull,
      armorMax: hull,
      shield: shields,
      shieldMax: shields,
      
      // ✅ Энергия тоже нужна
      energy: Math.round(stats.energy ?? 100),
      energyMax: Math.round(stats.energy ?? 100),
    },
  };
}

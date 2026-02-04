export function applyPilotModifiersToShipStats(stats, modifiers) {
  if (!modifiers) return stats;

  // работаем с копией
  const out = { ...stats };

  // ADD (плоские прибавки)
  if (modifiers.shipHullAdd) out.hull += modifiers.shipHullAdd;
  if (modifiers.shipShieldsAdd) out.shields += modifiers.shipShieldsAdd;
  if (modifiers.shipEnergyAdd) out.energy += modifiers.shipEnergyAdd;
  if (modifiers.shipSpeedAdd) out.speed += modifiers.shipSpeedAdd;

  // MUL (проценты: 0.05 = +5%)
  if (modifiers.shipHullMul) out.hull *= (1 + modifiers.shipHullMul);
  if (modifiers.shipShieldsMul) out.shields *= (1 + modifiers.shipShieldsMul);
  if (modifiers.shipEnergyMul) out.energy *= (1 + modifiers.shipEnergyMul);
  if (modifiers.shipSpeedMul) out.speed *= (1 + modifiers.shipSpeedMul);

  // округления где нужно
  out.hull = Math.round(out.hull);
  out.shields = Math.round(out.shields);
  out.energy = Math.round(out.energy);
  out.speed = +out.speed.toFixed(3);

  return out;
}

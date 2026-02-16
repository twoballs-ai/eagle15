export function applyPilotModifiersToShipStats(stats, modifiers) {
  if (!modifiers) return stats;

  // работаем с копией
  const out = { ...stats };

  // ✅ совместимость: hull -> armor
  if (out.armor == null && out.hull != null) out.armor = out.hull;

  // ---- ADD ----
  const armorAdd = (modifiers.shipArmorAdd ?? modifiers.shipHullAdd ?? 0);
  const shieldsAdd = (modifiers.shipShieldsAdd ?? 0);
  const energyAdd = (modifiers.shipEnergyAdd ?? 0);
  const speedAdd = (modifiers.shipSpeedAdd ?? 0);

  if (armorAdd) out.armor += armorAdd;
  if (shieldsAdd) out.shields += shieldsAdd;
  if (energyAdd) out.energy += energyAdd;
  if (speedAdd) out.speed += speedAdd;

  // ---- MUL (проценты) ----
  const armorMul = (modifiers.shipArmorMul ?? modifiers.shipHullMul ?? 0);
  const shieldsMul = (modifiers.shipShieldsMul ?? 0);
  const energyMul = (modifiers.shipEnergyMul ?? 0);
  const speedMul = (modifiers.shipSpeedMul ?? 0);

  if (armorMul) out.armor *= (1 + armorMul);
  if (shieldsMul) out.shields *= (1 + shieldsMul);
  if (energyMul) out.energy *= (1 + energyMul);
  if (speedMul) out.speed *= (1 + speedMul);

  // округления
  out.armor = Math.round(out.armor ?? 0);
  out.shields = Math.round(out.shields ?? 0);
  out.energy = Math.round(out.energy ?? 0);
  out.speed = +Number(out.speed ?? 1).toFixed(3);

  // можно держать hull как alias на время миграции
  // out.hull = out.armor;

  return out;
}


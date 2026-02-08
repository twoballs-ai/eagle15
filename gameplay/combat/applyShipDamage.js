export function applyShipDamage(rt, dmg) {
  if (!rt || dmg <= 0) return;

  // 1) shield
  const s = rt.shield ?? 0;
  if (s > 0) {
    const ds = Math.min(s, dmg);
    rt.shield = s - ds;
    dmg -= ds;
  }

  // 2) armor
  if (dmg > 0) {
    const a = rt.armor ?? rt.armorMax ?? 0;
    rt.armor = Math.max(0, a - dmg);
  }

  // 3) death
  if ((rt.armor ?? 0) <= 0) {
    rt.armor = 0;
    rt.dead = true;
  }
}

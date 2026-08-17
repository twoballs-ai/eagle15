// gameplay/combat/enemyFire.js
import { tryFire } from "../weapons/projectiles.js";
import { getWeapon } from "../../data/items/weapons.js";

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function createEnemyFireModule(opts = {}) {
  const cfg = {
    range: 520,
    fireArcCos: 0.35,
    ...opts,
  };

  let projectileSystem = null;

  function setProjectileSystem(sys) {
    projectileSystem = sys;
  }

  function update(dt, ships, playerShip) {
    if (!playerShip?.runtime) return;
    const p = playerShip.runtime;

    for (const ship of ships || []) {
      if (ship === playerShip || !ship?.runtime || ship.alive === false || ship.runtime.dead) continue;
      if (ship.aiState !== "combat") continue;

      const r = ship.runtime;
      if (!r._weaponCooldowns) r._weaponCooldowns = new Map();
      r._weaponCooldowns.forEach((val, key) => r._weaponCooldowns.set(key, val - dt));

      const d2 = dist2(r.x, r.z, p.x, p.z);
      if (d2 > cfg.range * cfg.range) continue;

      const d = Math.sqrt(d2) || 1;
      const tx = (p.x - r.x) / d;
      const tz = (p.z - r.z) / d;

      const fx = Math.sin(r.yaw ?? 0);
      const fz = -Math.cos(r.yaw ?? 0);
      const facing = fx * tx + fz * tz;

      if (facing < cfg.fireArcCos) continue;
      if (!projectileSystem) continue;

      // ✅ ЦИКЛ ПО ВСЕМ СЛОТАМ ОРУЖИЯ ВРАГА
      if (ship.weaponSlots) {
        ship.weaponSlots.forEach((slot, slotIndex) => {
          if (!slot?.item) return;

          const weaponData = getWeapon(slot.item.id);
          if (!weaponData) return;

          const cdKey = `slot_${slotIndex}`;
          const currentCd = r._weaponCooldowns.get(cdKey) || 0;

          if (currentCd <= 0) {
            r._weaponCooldowns.set(cdKey, weaponData.fireCooldown);

            const pellets = weaponData.pellets || 1;
            for (let i = 0; i < pellets; i++) {
              const side = pellets > 1 ? (i - (pellets - 1) * 0.5) * 1.2 : 0;
              tryFire(
                projectileSystem, r, ship.id, dt, true,
                {
                  teamId: ship.factionId ?? "enemy",
                  targetId: playerShip.id,
                  targetX: p.x,
                  targetZ: p.z,
                  damage: weaponData.damage,
                  bulletSpeed: weaponData.bulletSpeed,
                  bulletLife: weaponData.bulletLife,
                  spread: weaponData.spread,
                  fireCooldown: weaponData.fireCooldown,
                  muzzleSide: side,
                  presetId: weaponData.id,
                  ignoreCooldown: i > 0,
                }
              );
            }
          }
        });
      }
    }
  }

  return { cfg, update, setProjectileSystem };
}
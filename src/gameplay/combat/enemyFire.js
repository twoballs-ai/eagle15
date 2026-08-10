// gameplay/combat/enemyFire.js

import { tryFire } from "../weapons/projectiles.js";

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;

  const dz = az - bz;

  return dx * dx + dz * dz;
}

export function createEnemyFireModule(opts = {}) {
  const cfg = {
    range: 520,

    fireArcCos: 0.35,

    fireRate: 1.2,

    jitter: 0.002,

    damage: 18,

    bulletSpeed: 2500,

    bulletLife: 0.8,

    weaponPresetId: "pulse",

    ...opts,
  };

  let projectileSystem = null;

  function setProjectileSystem(sys) {
    projectileSystem = sys;
  }

  function update(dt, ships, playerShip) {
    if (!playerShip?.runtime) {
      return;
    }

    const p = playerShip.runtime;

    for (const ship of ships || []) {
      if (ship === playerShip) {
        continue;
      }

      if (!ship?.runtime) {
        continue;
      }

      if (ship.alive === false || ship.runtime.dead) {
        continue;
      }

      // Только боевые NPC
      if (ship.aiState !== "combat") {
        continue;
      }

      const r = ship.runtime;

      // ----------------------------------------------
      // cooldown
      // ----------------------------------------------

      if (r._fireCD == null) {
        r._fireCD = 1 / cfg.fireRate;
      }

      r._fireCD -= dt;

      // ----------------------------------------------
      // distance
      // ----------------------------------------------

      const d2 = dist2(r.x, r.z, p.x, p.z);

      if (d2 > cfg.range * cfg.range) {
        continue;
      }

      // ----------------------------------------------
      // direction to player
      // ----------------------------------------------

      const d = Math.sqrt(d2) || 1;

      const tx = (p.x - r.x) / d;

      const tz = (p.z - r.z) / d;

      // ----------------------------------------------
      // facing
      // ----------------------------------------------

      const fx = Math.sin(r.yaw ?? 0);

      const fz = -Math.cos(r.yaw ?? 0);

      const facing = fx * tx + fz * tz;

      if (facing < cfg.fireArcCos) {
        continue;
      }

      // ----------------------------------------------
      // cooldown
      // ----------------------------------------------

      if (r._fireCD > 0) {
        continue;
      }

      r._fireCD = 1 / cfg.fireRate;

      // ----------------------------------------------
      // FIRE
      // ----------------------------------------------

      if (!projectileSystem) {
        continue;
      }

      const presetId = ship.weaponPresetId ?? cfg.weaponPresetId;

      tryFire(
        projectileSystem,

        r,

        ship.id,

        dt,

        true,

        {
          teamId: ship.factionId ?? "enemy",

          targetId: playerShip.id,

          targetX: p.x,

          targetZ: p.z,

          damage: cfg.damage,

          bulletSpeed: cfg.bulletSpeed,

          bulletLife: cfg.bulletLife,

          spread: cfg.jitter,

          fireCooldown: 1 / cfg.fireRate,

          presetId,
        },
      );
    }
  }

  return {
    cfg,

    update,

    setProjectileSystem,
  };
}

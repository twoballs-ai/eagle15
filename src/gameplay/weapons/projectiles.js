// gameplay/weapons/projectiles.js
// Унифицированная система снарядов.
// Автобой: projectile создаётся с целью и летит в направлении цели.
// Плоскость мира: XZ.

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function createProjectileSystem(opts = {}) {
  const {
    max = 512,

    bulletSpeed = 900,
    bulletLife = 1.2,

    fireCooldown = 0.12,

    spread = 0.0,

    muzzleAhead = 14,
    muzzleSide = 0,

    damage = 12,
    hitRadius = 8,
  } = opts;

  return {
    max,

    bulletSpeed,
    bulletLife,
    fireCooldown,

    spread,

    muzzleAhead,
    muzzleSide,

    damage,
    hitRadius,

    // runtime
    t: 0,

    cooldownT: 0,

    cooldownByOwner: new Map(),

    nextId: 1,

    // {
    //   id,
    //   x,
    //   z,
    //   vx,
    //   vz,
    //   life,
    //   ownerId,
    //   targetId,
    //   teamId,
    //   damage,
    //   presetId,
    //   alive
    // }
    list: [],
  };
}

/**
 * Создаёт projectile.
 *
 * extra:
 * {
 *   teamId,
 *   targetId,
 *   targetX,
 *   targetZ,
 *   muzzleSide,
 *   damage,
 *   bulletSpeed,
 *   bulletLife,
 *   spread,
 *   fireCooldown,
 *   presetId,
 *   ignoreCooldown
 * }
 */
export function tryFire(system, shipRuntime, shipId, dt, wantFire, extra = {}) {
  system.t += dt;

  system.cooldownT = Math.max(0, system.cooldownT - dt);

  const ownerKey = shipId ?? "__global";

  const ownerCd = Math.max(0, (system.cooldownByOwner.get(ownerKey) ?? 0) - dt);

  system.cooldownByOwner.set(ownerKey, ownerCd);

  if (!wantFire) {
    return false;
  }

  if (!extra.ignoreCooldown && ownerCd > 0) {
    return false;
  }

  if (system.list.length >= system.max) {
    return false;
  }

  const fireCooldown = extra.fireCooldown ?? system.fireCooldown;

  if (!extra.ignoreCooldown) {
    system.cooldownT = fireCooldown;

    system.cooldownByOwner.set(ownerKey, fireCooldown);
  }

  // --------------------------------------------------
  // Направление выстрела
  // --------------------------------------------------

  let dirX;
  let dirZ;

  // Если AI передал координаты цели -
  // стреляем именно в неё.
  if (Number.isFinite(extra.targetX) && Number.isFinite(extra.targetZ)) {
    const dx = extra.targetX - (shipRuntime.x ?? 0);

    const dz = extra.targetZ - (shipRuntime.z ?? 0);

    const len = Math.hypot(dx, dz);

    if (len > 0.0001) {
      dirX = dx / len;
      dirZ = dz / len;
    }
  }

  // Если цели нет - используем yaw корабля.
  if (!Number.isFinite(dirX) || !Number.isFinite(dirZ)) {
    const yaw = shipRuntime.yaw ?? 0;

    dirX = Math.sin(yaw);
    dirZ = -Math.cos(yaw);
  }

  // --------------------------------------------------
  // Разброс
  // --------------------------------------------------

  const bulletSpread = extra.spread ?? system.spread;

  if (bulletSpread > 0) {
    const jitter = (Math.random() * 2 - 1) * bulletSpread;

    const cos = Math.cos(jitter);
    const sin = Math.sin(jitter);

    const nx = dirX * cos - dirZ * sin;

    const nz = dirX * sin + dirZ * cos;

    dirX = nx;
    dirZ = nz;
  }

  // --------------------------------------------------
  // Правый вектор
  // --------------------------------------------------

  const rx = -dirZ;
  const rz = dirX;

  const muzzleSide = extra.muzzleSide ?? system.muzzleSide ?? 0;

  // --------------------------------------------------
  // Точка выхода оружия
  // --------------------------------------------------

  const x0 = (shipRuntime.x ?? 0) + dirX * system.muzzleAhead + rx * muzzleSide;

  const z0 = (shipRuntime.z ?? 0) + dirZ * system.muzzleAhead + rz * muzzleSide;

  // --------------------------------------------------
  // Projectile
  // --------------------------------------------------

  const speed = extra.bulletSpeed ?? system.bulletSpeed;

  const life = extra.bulletLife ?? system.bulletLife;

  system.list.push({
    id: system.nextId++,

    x: x0,
    z: z0,

    vx: dirX * speed,
    vz: dirZ * speed,

    life,

    ownerId: shipId ?? null,

    targetId: extra.targetId ?? null,

    teamId: extra.teamId ?? null,

    alive: true,

    damage: extra.damage ?? null,

    presetId: extra.presetId ?? "pulse",
  });

  return true;
}

/**
 * Движение projectiles.
 */
export function stepProjectiles(system, dt, boundsRadius = Infinity) {
  const arr = system.list;

  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];

    // Убит collision system
    if (b.alive === false) {
      arr.splice(i, 1);
      continue;
    }

    b.life -= dt;

    if (b.life <= 0) {
      arr.splice(i, 1);
      continue;
    }

    b.x += b.vx * dt;
    b.z += b.vz * dt;

    // Удаление за пределами мира
    if (boundsRadius !== Infinity) {
      const d = Math.hypot(b.x, b.z);

      if (d > boundsRadius * 1.2) {
        arr.splice(i, 1);
        continue;
      }
    }
  }
}

/**
 * Простые попадания по кораблям.
 */
export function applyProjectileHits(system, ships) {
  const bullets = system.list;

  const hitR = system.hitRadius;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    if (b.alive === false) {
      bullets.splice(i, 1);
      continue;
    }

    for (const s of ships) {
      if (!s?.runtime) {
        continue;
      }

      if (s.alive === false) {
        continue;
      }

      // Не бьём владельца
      if (s.id === b.ownerId) {
        continue;
      }

      // Friendly fire
      if (b.teamId != null && s.factionId != null && b.teamId === s.factionId) {
        continue;
      }

      // Если у projectile есть конкретная цель -
      // он может повредить только её.
      if (b.targetId != null && s.id !== b.targetId) {
        continue;
      }

      const r = s.runtime;

      const rad = (r.radius ?? 6) + hitR;

      const dx = r.x - b.x;

      const dz = r.z - b.z;

      if (dx * dx + dz * dz <= rad * rad) {
        const dmg = b.damage ?? system.damage;

        r.hp = (r.hp ?? 100) - dmg;

        if (r.hp <= 0) {
          r.hp = 0;
          s.alive = false;
        }

        b.alive = false;

        bullets.splice(i, 1);

        break;
      }
    }
  }
}

/**
 * Трассеры для старого renderer API.
 */
export function buildTracersXYZ(system, y = 1.2, tail = 0.03) {
  const bullets = system.list;

  const out = new Float32Array(bullets.length * 2 * 3);

  let k = 0;

  for (const b of bullets) {
    if (b.alive === false) {
      continue;
    }

    const tx = b.x - b.vx * tail;

    const tz = b.z - b.vz * tail;

    out[k++] = tx;
    out[k++] = y;
    out[k++] = tz;

    out[k++] = b.x;
    out[k++] = y;
    out[k++] = b.z;
  }

  return out.subarray(0, k);
}

// ==================================================
// WEAPONS
// ==================================================

export const WEAPON_PRESETS = [
  {
    id: "pulse",

    name: "Импульсный лазер",

    fireCooldown: 0.15,

    damage: 18,

    bulletSpeed: 2500,

    bulletLife: 0.8,

    spread: 0.002,

    pellets: 1,

    vfx: {
      type: "impulse_laser",

      color: [0.2, 0.9, 1.0],

      coreColor: [1.0, 1.0, 1.0],

      beamLength: 0.12,

      headSize: 2.5,

      glowSize: 5.5,
    },
  },

  {
    id: "scatter",

    name: "Дробовик",

    fireCooldown: 0.35,

    damage: 8,

    bulletSpeed: 900,

    bulletLife: 0.55,

    spread: 0.09,

    pellets: 6,

    vfx: {
      type: "tracer",

      color: [1.0, 0.8, 0.2],

      size: 1.5,

      alpha: 0.9,
    },
  },

  {
    id: "rail",

    name: "Рельса",

    fireCooldown: 0.55,

    damage: 42,

    bulletSpeed: 1800,

    bulletLife: 1.5,

    spread: 0.002,

    pellets: 1,

    vfx: {
      type: "laser_beam",

      color: [1.0, 0.2, 0.2],

      thickness: 2.0,

      trailLength: 0.2,
    },
  },

  {
    id: "rocket",

    name: "Ракета",

    fireCooldown: 0.8,

    damage: 65,

    bulletSpeed: 600,

    bulletLife: 2.5,

    spread: 0.01,

    pellets: 1,

    vfx: {
      type: "rocket_model",

      trailColor: [1.0, 0.4, 0.0],

      trailSize: 4.0,
    },
  },
];

export function getWeaponPreset(index = 0) {
  if (!WEAPON_PRESETS.length) {
    return null;
  }

  const safe =
    ((index % WEAPON_PRESETS.length) + WEAPON_PRESETS.length) %
    WEAPON_PRESETS.length;

  return WEAPON_PRESETS[safe];
}

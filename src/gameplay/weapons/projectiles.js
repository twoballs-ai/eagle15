// gameplay/weapons/projectiles.js
// Унифицированная система снарядов.
// Отвечает только за создание, движение и коллизии снарядов.
// Балансные данные (урон, скорость, кулдаун) приходят из WEAPONS_CATALOG.

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function createProjectileSystem(opts = {}) {
  const {
    max = 512,
    hitRadius = 8,
  } = opts;

  return {
    max,
    hitRadius,

    // runtime
    t: 0,
    nextId: 1,

    // {
    //   id, x, z, vx, vz, life, ownerId, targetId, teamId, damage, presetId, alive
    // }
    list: [],
  };
}

/**
 * Создаёт projectile.
 * extra: { teamId, targetId, targetX, targetZ, muzzleSide, damage, bulletSpeed, bulletLife, spread, fireCooldown, presetId, ignoreCooldown }
 */
export function tryFire(system, shipRuntime, shipId, dt, wantFire, extra = {}) {
  system.t += dt;

  const ownerKey = extra.presetId ? `${shipId ?? "__global"}_${extra.presetId}` : (shipId ?? "__global");
  const ownerCd = Math.max(0, (system.cooldownByOwner?.get(ownerKey) ?? 0) - dt);

  if (!system.cooldownByOwner) system.cooldownByOwner = new Map();

  if (!wantFire) return false;
  if (!extra.ignoreCooldown && ownerCd > 0) return false;
  if (system.list.length >= system.max) return false;

  const fireCooldown = extra.fireCooldown ?? 0.15;

  if (!extra.ignoreCooldown) {
    system.cooldownByOwner.set(ownerKey, fireCooldown);
  }

  // --------------------------------------------------
  // Направление выстрела
  // --------------------------------------------------
  let dirX, dirZ;

  if (Number.isFinite(extra.targetX) && Number.isFinite(extra.targetZ)) {
    const dx = extra.targetX - (shipRuntime.x ?? 0);
    const dz = extra.targetZ - (shipRuntime.z ?? 0);
    const len = Math.hypot(dx, dz);
    if (len > 0.0001) {
      dirX = dx / len;
      dirZ = dz / len;
    }
  }

  if (!Number.isFinite(dirX) || !Number.isFinite(dirZ)) {
    const yaw = shipRuntime.yaw ?? 0;
    dirX = Math.sin(yaw);
    dirZ = -Math.cos(yaw);
  }

  // --------------------------------------------------
  // Разброс
  // --------------------------------------------------
  const bulletSpread = extra.spread ?? 0.0;
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
  // Точка выхода оружия
  // --------------------------------------------------
  const rx = -dirZ;
  const rz = dirX;
  const muzzleSide = extra.muzzleSide ?? 0;
  const muzzleAhead = extra.muzzleAhead ?? 14;

  const x0 = (shipRuntime.x ?? 0) + dirX * muzzleAhead + rx * muzzleSide;
  const z0 = (shipRuntime.z ?? 0) + dirZ * muzzleAhead + rz * muzzleSide;

  // --------------------------------------------------
  // Projectile
  // --------------------------------------------------
  system.list.push({
    id: system.nextId++,
    x: x0,
    z: z0,
    vx: dirX * (extra.bulletSpeed ?? 2500),
    vz: dirZ * (extra.bulletSpeed ?? 2500),
    life: extra.bulletLife ?? 1.0,
    ownerId: shipId ?? null,
    targetId: extra.targetId ?? null,
    teamId: extra.teamId ?? null,
    alive: true,
    damage: extra.damage ?? 10,
    presetId: extra.presetId ?? "unknown",
  });

  return true;
}

export function stepProjectiles(system, dt, boundsRadius = Infinity) {
  const arr = system.list;
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];
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

    if (boundsRadius !== Infinity) {
      const d = Math.hypot(b.x, b.z);
      if (d > boundsRadius * 1.2) {
        arr.splice(i, 1);
        continue;
      }
    }
  }
}

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
      if (!s?.runtime || s.alive === false) continue;
      if (s.id === b.ownerId) continue;
      if (b.teamId != null && s.factionId != null && b.teamId === s.factionId) continue;
      if (b.targetId != null && s.id !== b.targetId) continue;

      const r = s.runtime;
      const rad = (r.radius ?? 6) + hitR;
      const dx = r.x - b.x;
      const dz = r.z - b.z;

      if (dx * dx + dz * dz <= rad * rad) {
        // Урон применяется через централизованную функцию, если она есть, или напрямую
        if (r.shield > 0) {
          r.shield = Math.max(0, r.shield - b.damage);
        } else {
          r.armor = Math.max(0, (r.armor ?? r.hp ?? 100) - b.damage);
        }

        if ((r.armor ?? r.hp ?? 0) <= 0) {
          r.armor = 0;
          r.hp = 0;
          s.alive = false;
          r.dead = true;
        }

        b.alive = false;
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

export function buildTracersXYZ(system, y = 1.2, tail = 0.03) {
  const bullets = system.list;
  const out = new Float32Array(bullets.length * 2 * 3);
  let k = 0;

  for (const b of bullets) {
    if (b.alive === false) continue;
    const tx = b.x - b.vx * tail;
    const tz = b.z - b.vz * tail;
    out[k++] = tx; out[k++] = y; out[k++] = tz;
    out[k++] = b.x; out[k++] = y; out[k++] = b.z;
  }
  return out.subarray(0, k);
}
// gameplay/weapons/projectiles.js
// Простая система снарядов (пули/лазеры) в плоскости XZ.

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function createProjectileSystem(opts = {}) {
  const {
    max = 512,
    bulletSpeed = 900,
    bulletLife = 1.2,
    fireCooldown = 0.12,
    spread = 0.0,        // радианы (0..)
    muzzleAhead = 14,    // смещение от центра корабля вперед
    muzzleSide = 0,      // смещение вбок (можно сделать 2 ствола)
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
    nextId: 1, // ✅ уникальные id для пуль
    list: [],  // {id,x,z,vx,vz,life,ownerId,teamId,alive}
  };
}

/**
 * tryFire(system, shipRuntime, shipId, dt, wantFire, extra)
 * extra: { teamId?:string, muzzleSide?:number, damage?:number }
 */
export function tryFire(system, shipRuntime, shipId, dt, wantFire, extra = {}) {
  system.t += dt;
  system.cooldownT = Math.max(0, system.cooldownT - dt);

  const ownerKey = shipId ?? "__global";
  const ownerCd = Math.max(0, (system.cooldownByOwner.get(ownerKey) ?? 0) - dt);
  system.cooldownByOwner.set(ownerKey, ownerCd);

  if (!wantFire) return false;
  if (ownerCd > 0) return false;
  if (system.list.length >= system.max) return false;

  const fireCooldown = extra.fireCooldown ?? system.fireCooldown;
  system.cooldownT = fireCooldown;
  system.cooldownByOwner.set(ownerKey, fireCooldown);

  // направление по yaw
  const yaw = shipRuntime.yaw ?? 0;

  // небольшой разброс
  const bulletSpread = extra.spread ?? system.spread;
  const jitter = bulletSpread > 0 ? (Math.random() * 2 - 1) * bulletSpread : 0;
  const y = yaw + jitter;

  const fx = Math.sin(y);
  const fz = -Math.cos(y);

  // "право" в плоскости
  const rx = -fz;
  const rz = fx;

  const muzzleSide = (extra.muzzleSide ?? system.muzzleSide) || 0;

  // точка выстрела (нос)
  const x0 = (shipRuntime.x ?? 0) + fx * system.muzzleAhead + rx * muzzleSide;
  const z0 = (shipRuntime.z ?? 0) + fz * system.muzzleAhead + rz * muzzleSide;

  system.list.push({
    id: system.nextId++,      // ✅ стабильный id
    x: x0, z: z0,
    vx: fx * (extra.bulletSpeed ?? system.bulletSpeed),
    vz: fz * (extra.bulletSpeed ?? system.bulletSpeed),
    life: extra.bulletLife ?? system.bulletLife,
    ownerId: shipId,
    teamId: extra.teamId ?? null, // ✅ для friendly fire
    alive: true,                  // ✅ чтобы colliders могли убивать пулю
    damage: extra.damage ?? null, // опционально, если хочешь разный урон
  });

  return true;
}

export function stepProjectiles(system, dt, boundsRadius = Infinity) {
  const arr = system.list;
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];

    // ✅ если убили через коллизии — удалить
    if (b.alive === false) { arr.splice(i, 1); continue; }

    b.life -= dt;
    if (b.life <= 0) { arr.splice(i, 1); continue; }

    b.x += b.vx * dt;
    b.z += b.vz * dt;

    // удаляем за границей мира (чтобы не улетали в бесконечность)
    if (boundsRadius !== Infinity) {
      const d = Math.hypot(b.x, b.z);
      if (d > boundsRadius * 1.2) {
        arr.splice(i, 1);
        continue;
      }
    }
  }
}

// ⚠️ Старую логику можно оставить, но если ты перешёл на projectileHits(colliders),
// лучше НЕ вызывать applyProjectileHits, чтобы не было двойных попаданий.
export function applyProjectileHits(system, ships) {
  const bullets = system.list;
  const hitR = system.hitRadius;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.alive === false) { bullets.splice(i, 1); continue; }

    for (const s of ships) {
      if (!s?.runtime) continue;
      if (s.alive === false) continue;
      if (s.id === b.ownerId) continue; // не бьём владельца

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

        bullets.splice(i, 1);
        break;
      }
    }
  }
}

// Для отрисовки трассеров: возвращает плоский Float32Array xyzxyz...
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

  // out фиксированной длины, но k может быть меньше если были dead.
  // чтобы не усложнять, возвращаем subarray:
  return out.subarray(0, k);
}

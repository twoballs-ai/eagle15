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
    list: [], // {x,z,vx,vz,life,ownerId}
  };
}

export function tryFire(system, shipRuntime, shipId, dt, wantFire) {
  system.t += dt;
  system.cooldownT = Math.max(0, system.cooldownT - dt);

  if (!wantFire) return false;
  if (system.cooldownT > 0) return false;
  if (system.list.length >= system.max) return false;

  system.cooldownT = system.fireCooldown;

  // направление по yaw
  const yaw = shipRuntime.yaw;

  // небольшой разброс
  const jitter = system.spread > 0 ? (Math.random() * 2 - 1) * system.spread : 0;
  const y = yaw + jitter;

  const fx = Math.sin(y);
  const fz = -Math.cos(y);

  // "право" в плоскости
  const rx = -fz;
  const rz = fx;

  // точка выстрела (нос)
  const x0 = shipRuntime.x + fx * system.muzzleAhead + rx * system.muzzleSide;
  const z0 = shipRuntime.z + fz * system.muzzleAhead + rz * system.muzzleSide;

  system.list.push({
    x: x0, z: z0,
    vx: fx * system.bulletSpeed,
    vz: fz * system.bulletSpeed,
    life: system.bulletLife,
    ownerId: shipId,
  });

  return true;
}

export function stepProjectiles(system, dt, boundsRadius = Infinity) {
  const arr = system.list;
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];
    b.life -= dt;
    if (b.life <= 0) { arr.splice(i, 1); continue; }

    b.x += b.vx * dt;
    b.z += b.vz * dt;

    // удаляем за границей мира (чтобы не улетали в бесконечность)
    if (boundsRadius !== Infinity) {
      const d = Math.hypot(b.x, b.z);
      if (d > boundsRadius * 1.2) { // небольшой запас
        arr.splice(i, 1);
        continue;
      }
    }
  }
}

export function applyProjectileHits(system, ships) {
  // ships: [{id, runtime:{x,z,radius,hp...}, alive:true/false}]
  const bullets = system.list;
  const hitR = system.hitRadius;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    for (const s of ships) {
      if (!s?.runtime) continue;
      if (s.alive === false) continue;
      if (s.id === b.ownerId) continue; // не бьём владельца

      const r = s.runtime;
      const rad = (r.radius ?? 6) + hitR;

      const dx = r.x - b.x;
      const dz = r.z - b.z;

      if (dx * dx + dz * dz <= rad * rad) {
        // попадание
        r.hp = (r.hp ?? 100) - system.damage;
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
    // хвост чуть назад по скорости
    const tx = b.x - b.vx * tail;
    const tz = b.z - b.vz * tail;

    out[k++] = tx; out[k++] = y; out[k++] = tz;
    out[k++] = b.x; out[k++] = y; out[k++] = b.z;
  }
  return out;
}

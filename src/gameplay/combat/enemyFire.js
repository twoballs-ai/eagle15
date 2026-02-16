// gameplay/combat/enemyFire.js
// Простая стрельба врагов по игроку (hit-scan + трассер)
import { applyShipDamage } from "./applyShipDamage.js";
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function dist2(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}

// пересечение луча (ox,oz) + t*(dx,dz), t>=0 со сферой (cx,cz,r)
// Возвращает t попадания или null
function rayVsCircle2D(ox, oz, dx, dz, cx, cz, r) {
  const mx = ox - cx;
  const mz = oz - cz;
  const b = mx * dx + mz * dz;
  const c = mx * mx + mz * mz - r * r;

  // если уже внутри круга
  if (c <= 0) return 0;

  // луч смотрит "от круга"
  if (b > 0) return null;

  const disc = b * b - c;
  if (disc < 0) return null;

  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : null;
}

// y будет фиксированный, т.к. у тебя плоскость XZ
function makeTracer(x0, z0, x1, z1, life = 0.08) {
  return { x0, z0, x1, z1, life, lifeMax: life };
}

export function createEnemyFireModule(opts = {}) {
  const state = {
    tracers: [],
  };

  const cfg = {
    range: 520,            // дальность стрельбы
    fireArcCos: 0.35,      // “сектор” стрельбы: cos угла (0.35 ~ 69°)
    fireRate: 1.2,         // выстрелов/сек (1.2 => раз в ~0.83с)
    jitter: 0.02,          // небольшой разброс направления
    damage: 18,            // урон по щиту/корпусу
    bulletSpeed: 0,        // 0 = hitscan; если захочешь снаряды — сделаем позже
    ...opts,
  };

  function update(dt, ships, playerShip) {
    if (!playerShip?.runtime) return;
    const p = playerShip.runtime;

    for (const ship of (ships || [])) {
      if (ship === playerShip) continue;
      if (!ship?.runtime) continue;

      // стреляют только враги
if (ship.aiState !== "combat") continue;

      const r = ship.runtime;

      // init cooldown
      if (r._fireCD == null) r._fireCD = 1 / cfg.fireRate;

      // проверка дистанции
      const d2 = dist2(r.x, r.z, p.x, p.z);
      const R2 = cfg.range * cfg.range;
      if (d2 > R2) {
        // если далеко — копим кд дальше
        r._fireCD -= dt;
        continue;
      }

      // направление на игрока
      const d = Math.sqrt(d2) || 1;
      let tx = (p.x - r.x) / d;
      let tz = (p.z - r.z) / d;

      // проверим "сектор" — чтобы не стрелял назад
      const fx = Math.sin(r.yaw);
      const fz = -Math.cos(r.yaw);
      const facing = fx * tx + fz * tz; // cos угла
      if (facing < cfg.fireArcCos) {
        r._fireCD -= dt;
        continue;
      }

      // cooldown
      r._fireCD -= dt;
      if (r._fireCD > 0) continue;
      r._fireCD += 1 / cfg.fireRate;

      // немного разброса
      const j = cfg.jitter;
      tx = clamp(tx + (Math.random() * 2 - 1) * j, -1, 1);
      tz = clamp(tz + (Math.random() * 2 - 1) * j, -1, 1);
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;

      // muzzle (чуть впереди врага)
      const muzzleX = r.x + fx * (r.radius ?? 6) * 1.1;
      const muzzleZ = r.z + fz * (r.radius ?? 6) * 1.1;

      // hitscan до дальности
      const hitT = rayVsCircle2D(
        muzzleX, muzzleZ,
        tx, tz,
        p.x, p.z,
        (p.radius ?? 6)
      );

      let endX = muzzleX + tx * cfg.range;
      let endZ = muzzleZ + tz * cfg.range;

      if (hitT != null) {
        endX = muzzleX + tx * hitT;
        endZ = muzzleZ + tz * hitT;

        // применяем урон
applyShipDamage(playerShip.runtime, cfg.damage);      }

      // трассер
      state.tracers.push(makeTracer(muzzleX, muzzleZ, endX, endZ));
    }

    // обновление трассеров
    for (let i = state.tracers.length - 1; i >= 0; i--) {
      const t = state.tracers[i];
      t.life -= dt;
      if (t.life <= 0) state.tracers.splice(i, 1);
    }
  }


  // Возвращаем Float32Array для отрисовки линией (LINE_STRIP / LINES)
  function getTracerLinesY(y = 0.8) {
    // каждая трасса = 2 точки => 6 float
    const arr = new Float32Array(state.tracers.length * 6);
    let k = 0;
    for (const t of state.tracers) {
      arr[k++] = t.x0; arr[k++] = y; arr[k++] = t.z0;
      arr[k++] = t.x1; arr[k++] = y; arr[k++] = t.z1;
    }
    return arr;
  }

  return { cfg, state, update, getTracerLinesY };
}

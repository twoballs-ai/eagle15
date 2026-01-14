// gameplay/collisions/colliders.js
// Коллайдеры круги в плоскости XZ + spatial hash grid + layers/masks + резолв.

// ---- Layers (битовые флаги) ----
export const LAYER = {
  PLAYER:     1 << 0,
  NPC:        1 << 1,
  SHIP:       1 << 2,
  PROJECTILE: 1 << 3,
  OBSTACLE:   1 << 4,
  POI:        1 << 5,
  CELESTIAL:  1 << 6,
};

function defaultMaskForLayer(layer) {
  // кто с кем сталкивается (для тел/персонажей/кораблей)
  if (layer & LAYER.PLAYER) return LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  if (layer & LAYER.NPC)    return LAYER.PLAYER | LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  if (layer & LAYER.SHIP)   return LAYER.PLAYER | LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  return 0;
}

function cellKey(ix, iz) {
  return (ix << 16) ^ (iz & 0xffff);
}

export function createColliderSystem(opts = {}) {
  const cellSize = opts.cellSize ?? 120;  // тюн: 80..200 обычно ок
  return {
    list: [],                 // все коллайдеры
    byId: new Map(),          // id -> collider
    grid: new Map(),          // cellKey -> array of colliders
    cellSize,
  };
}

export function clearColliders(sys) {
  sys.list.length = 0;
  sys.byId.clear();
  sys.grid.clear();
}

export function addCollider(sys, c) {
  const col = {
    id: c.id,
    kind: c.kind ?? "generic",
    x: c.x ?? 0,
    z: c.z ?? 0,
    r: c.r ?? 1,
    alive: c.alive ?? true,
    ref: c.ref ?? null,

    // layers/masks
    layer: c.layer ?? 0,
    mask: c.mask ?? defaultMaskForLayer(c.layer ?? 0),

    // для projectile
    ownerId: c.ownerId ?? null,        // кто стрелял
    teamId: c.teamId ?? null,          // фракция/команда
    isTrigger: c.isTrigger ?? false,   // можно сделать "триггер" без выталкивания
  };

  sys.list.push(col);
  sys.byId.set(col.id, col);
  return col;
}

export function setColliderPos(sys, id, x, z) {
  const c = sys.byId.get(id);
  if (!c) return;
  c.x = x; c.z = z;
}

export function circleOverlap(ax, az, ar, bx, bz, br) {
  const dx = bx - ax;
  const dz = bz - az;
  const rr = ar + br;
  return dx * dx + dz * dz <= rr * rr;
}

export function circlePenetration(ax, az, ar, bx, bz, br) {
  const dx = ax - bx;
  const dz = az - bz;
  const dist = Math.hypot(dx, dz) || 1e-6;
  const rr = ar + br;
  const pen = rr - dist;
  if (pen <= 0) return null;
  const nx = dx / dist;
  const nz = dz / dist;
  return { pen, nx, nz, dist };
}

// ---- Spatial Hash Grid build ----
export function buildColliderGrid(sys) {
  sys.grid.clear();
  const cs = sys.cellSize;

  for (const c of sys.list) {
    if (c.alive === false) continue;

    const ix0 = Math.floor((c.x - c.r) / cs);
    const iz0 = Math.floor((c.z - c.r) / cs);
    const ix1 = Math.floor((c.x + c.r) / cs);
    const iz1 = Math.floor((c.z + c.r) / cs);

    for (let ix = ix0; ix <= ix1; ix++) {
      for (let iz = iz0; iz <= iz1; iz++) {
        const k = cellKey(ix, iz);
        let arr = sys.grid.get(k);
        if (!arr) { arr = []; sys.grid.set(k, arr); }
        arr.push(c);
      }
    }
  }
}

// Возвращает кандидатов (без строгой фильтрации по distance; это broadphase)
export function queryGrid(sys, x, z, radius) {
  const cs = sys.cellSize;
  const ix0 = Math.floor((x - radius) / cs);
  const iz0 = Math.floor((z - radius) / cs);
  const ix1 = Math.floor((x + radius) / cs);
  const iz1 = Math.floor((z + radius) / cs);

  const out = [];
  const seen = new Set();

  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iz = iz0; iz <= iz1; iz++) {
      const k = cellKey(ix, iz);
      const arr = sys.grid.get(k);
      if (!arr) continue;
      for (const c of arr) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        out.push(c);
      }
    }
  }
  return out;
}

export function canCollide(a, b) {
  if (!a || !b) return false;
  if (a.alive === false || b.alive === false) return false;
  if (a.id === b.id) return false;
  // layers/masks check (симметрично)
  if ((a.mask & b.layer) === 0) return false;
  if ((b.mask & a.layer) === 0) return false;
  return true;
}

/**
 * resolveDynamicCollisions
 * Универсальный резолвер "тела выталкиваются".
 * pairs: берём каждого dynamic из list, смотрим соседей из grid.
 *
 * opts:
 *  - kinds: Set/Array kinds которые считаем "динамическими"
 *  - iterations: сколько раз прогонять (2..4 для стабильности)
 *  - push: 1.0..1.2 (сила выталкивания)
 *  - damp: 0..1 (гашение скорости вдоль нормали, если есть vel)
 *  - getVel(obj)-> {vx,vz} и setVel(obj,vx,vz) чтобы гасить скорости
 *  - setPos(obj,x,z) чтобы двигать runtime
 */
export function resolveDynamicCollisions(sys, opts = {}) {
  const iterations = opts.iterations ?? 2;
  const push = opts.push ?? 1.0;
  const damp = opts.damp ?? 1.2;

  const dynamicKinds = opts.kinds
    ? new Set(Array.isArray(opts.kinds) ? opts.kinds : [...opts.kinds])
    : new Set(["ship", "character", "npc", "player"]);

  const getVel = opts.getVel ?? null;
  const setVel = opts.setVel ?? null;
  const setPos = opts.setPos ?? null;

  // предварительно grid должен быть построен
  for (let it = 0; it < iterations; it++) {
    for (const a of sys.list) {
      if (a.alive === false) continue;
      if (!dynamicKinds.has(a.kind)) continue;
      if (!a.ref) continue;

      const searchR = a.r + (opts.nearExtra ?? 40);
      const near = queryGrid(sys, a.x, a.z, searchR);

      for (const b of near) {
        if (!canCollide(a, b)) continue;

        // для резолва выталкиваем только если b НЕ trigger и b имеет радиус
        if (b.isTrigger) continue;

        const pen = circlePenetration(a.x, a.z, a.r, b.x, b.z, b.r);
        if (!pen) continue;

        // делим выталкивание: если b тоже динамический — 50/50, иначе только a
        const bDynamic = dynamicKinds.has(b.kind) && b.ref && !b.isTrigger;

        const ax = pen.nx * pen.pen * push * (bDynamic ? 0.5 : 1.0);
        const az = pen.nz * pen.pen * push * (bDynamic ? 0.5 : 1.0);

        // move A
        a.x += ax; a.z += az;
        if (setPos) setPos(a.ref, a.x, a.z);

        // move B if dynamic
        if (bDynamic) {
          b.x -= ax; b.z -= az;
          if (setPos) setPos(b.ref, b.x, b.z);
        }

        // damp velocities along normal
        if (getVel && setVel) {
          const va = getVel(a.ref);
          if (va) {
            const vn = va.vx * pen.nx + va.vz * pen.nz;
            if (vn < 0) setVel(a.ref, va.vx - pen.nx * vn * damp, va.vz - pen.nz * vn * damp);
          }
          if (bDynamic) {
            const vb = getVel(b.ref);
            if (vb) {
              const vnb = vb.vx * (-pen.nx) + vb.vz * (-pen.nz);
              if (vnb < 0) setVel(b.ref, vb.vx - (-pen.nx) * vnb * damp, vb.vz - (-pen.nz) * vnb * damp);
            }
          }
        }
      }
    }
  }
}

/**
 * projectileHits
 * Обрабатывает попадания projectile (коллайдеры LAYER.PROJECTILE) по целям.
 * - фильтр по ownerId (не бить владельца)
 * - фильтр по teamId (не бить свою команду, опционально)
 * Возвращает массив hitEvents: {proj, target}
 */
export function projectileHits(sys, opts = {}) {
  const hits = [];
  const allowFriendlyFire = opts.allowFriendlyFire ?? false;

  // grid должен быть построен
  for (const p of sys.list) {
    if (p.alive === false) continue;
    if (!(p.layer & LAYER.PROJECTILE)) continue;
    if (!p.ref) continue;

    const near = queryGrid(sys, p.x, p.z, p.r + (opts.nearExtra ?? 40));

    for (const t of near) {
      if (!canCollide(p, t)) continue;

      // не бить владельца
      if (p.ownerId && t.id === p.ownerId) continue;

      // team check (если есть)
      if (!allowFriendlyFire && p.teamId && t.teamId && p.teamId === t.teamId) continue;

      if (circleOverlap(p.x, p.z, p.r, t.x, t.z, t.r)) {
        hits.push({ proj: p, target: t });
        // projectile исчезает после первого попадания
        p.alive = false;
        break;
      }
    }
  }

  return hits;
}

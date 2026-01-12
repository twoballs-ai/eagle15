// gameplay/collisions/colliders.js
// Сферические коллайдеры в плоскости XZ (circle collision).

export function createColliderSystem() {
  return {
    list: [], // {id, kind, x, z, r, alive, ref}
  };
}

export function clearColliders(sys) {
  sys.list.length = 0;
}

export function addCollider(sys, c) {
  sys.list.push({
    id: c.id,
    kind: c.kind ?? "generic", // "ship" | "poi" | "obstacle" | ...
    x: c.x ?? 0,
    z: c.z ?? 0,
    r: c.r ?? 1,
    alive: c.alive ?? true,
    ref: c.ref ?? null,       // ссылка на объект (ship/poi/etc)
  });
}

export function setColliderPos(sys, id, x, z) {
  const c = sys.list.find((it) => it.id === id);
  if (!c) return;
  c.x = x; c.z = z;
}

export function circleOverlap(ax, az, ar, bx, bz, br) {
  const dx = bx - ax;
  const dz = bz - az;
  const rr = ar + br;
  return dx * dx + dz * dz <= rr * rr;
}

// Возвращает penetration + normal (куда выталкивать A)
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

// Находит коллайдеры в радиусе (broadphase без сетки, ок для десятков/сотен объектов)
export function queryNear(sys, x, z, radius) {
  const out = [];
  const r2 = radius * radius;
  for (const c of sys.list) {
    if (c.alive === false) continue;
    const dx = c.x - x;
    const dz = c.z - z;
    if (dx * dx + dz * dz <= r2) out.push(c);
  }
  return out;
}

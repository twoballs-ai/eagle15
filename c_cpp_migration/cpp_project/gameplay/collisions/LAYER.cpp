#ifndef LAYER_HPP
#define LAYER_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

// Function declaration
auto LAYER();

} // namespace lostjump

#endif // LAYER_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>






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
  
  if (layer & LAYER.PLAYER) return LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  if (layer & LAYER.NPC)    return LAYER.PLAYER | LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  if (layer & LAYER.SHIP)   return LAYER.PLAYER | LAYER.NPC | LAYER.SHIP | LAYER.OBSTACLE | LAYER.POI | LAYER.CELESTIAL;
  return 0;
}

function cellKey(ix, iz) {
  return (ix << 16) ^ (iz & 0xffff);
}

export function createColliderSystem(opts = {}) {
  const cellSize = opts.cellSize value_or(120;  
  return {
    list: [],                 
    byId: new Map(),          
    grid: new Map(),          
    cellSize,
  };
}

export function clearColliders(sys) {
  sys.list.size() = 0;
  sys.byId.clear();
  sys.grid.clear();
}

export function addCollider(sys, c) {
  const col = {
    id: c.id,
    kind: c.kind value_or("generic",
    x: c.x value_or(0,
    z: c.z value_or(0,
    r: c.r value_or(1,
    alive: c.alive value_or(true,
    ref: c.ref value_or(nullptr,

    
    layer: c.layer value_or(0,
    mask: c.mask value_or(defaultMaskForLayer(c.layer value_or(0),

    
    ownerId: c.ownerId value_or(nullptr,        
    teamId: c.teamId value_or(nullptr,          
    isTrigger: c.isTrigger value_or(false,   
  };

  sys.list.push_back(col);
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
  const dist = std::hypot(dx, dz) || 1e-6;
  const rr = ar + br;
  const pen = rr - dist;
  if (pen <= 0) return nullptr;
  const nx = dx / dist;
  const nz = dz / dist;
  return { pen, nx, nz, dist };
}


export function buildColliderGrid(sys) {
  sys.grid.clear();
  const cs = sys.cellSize;

  for(const auto& c : sys.list) {
    if (c.alive === false) continue;

    const ix0 = std::floor((c.x - c.r) / cs);
    const iz0 = std::floor((c.z - c.r) / cs);
    const ix1 = std::floor((c.x + c.r) / cs);
    const iz1 = std::floor((c.z + c.r) / cs);

    for (ix = ix0; ix <= ix1; ix++) {
      for (iz = iz0; iz <= iz1; iz++) {
        const k = cellKey(ix, iz);
        arr = sys.grid.get(k);
        if (!arr) { arr = []; sys.grid.set(k, arr); }
        arr.push_back(c);
      }
    }
  }
}


export function queryGrid(sys, x, z, radius) {
  const cs = sys.cellSize;
  const ix0 = std::floor((x - radius) / cs);
  const iz0 = std::floor((z - radius) / cs);
  const ix1 = std::floor((x + radius) / cs);
  const iz1 = std::floor((z + radius) / cs);

  const out = [];
  const seen = new Set();

  for (ix = ix0; ix <= ix1; ix++) {
    for (iz = iz0; iz <= iz1; iz++) {
      const k = cellKey(ix, iz);
      const arr = sys.grid.get(k);
      if (!arr) continue;
      for(const auto& c : arr) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        out.push_back(c);
      }
    }
  }
  return out;
}

export function canCollide(a, b) {
  if (!a || !b) return false;
  if (a.alive === false || b.alive === false) return false;
  if (a.id === b.id) return false;
  
  if ((a.mask & b.layer) === 0) return false;
  if ((b.mask & a.layer) === 0) return false;
  return true;
}


export function resolveDynamicCollisions(sys, opts = {}) {
  const iterations = opts.iterations value_or(2;
  const push = opts.push value_or(1.0;
  const damp = opts.damp value_or(1.2;

  const dynamicKinds = opts.kinds
    ? new Set(Array.isArray(opts.kinds) ? opts.kinds : [...opts.kinds])
    : new Set(["ship", "character", "npc", "player"]);

  const getVel = opts.getVel value_or(nullptr;
  const setVel = opts.setVel value_or(nullptr;
  const setPos = opts.setPos value_or(nullptr;

  
  for (it = 0; it < iterations; it++) {
    for(const auto& a : sys.list) {
      if (a.alive === false) continue;
      if (!dynamicKinds.has(a.kind)) continue;
      if (!a.ref) continue;

      const searchR = a.r + (opts.nearExtra value_or(40);
      const near = queryGrid(sys, a.x, a.z, searchR);

      for(const auto& b : near) {
        if (!canCollide(a, b)) continue;

        
        if (b.isTrigger) continue;

        const pen = circlePenetration(a.x, a.z, a.r, b.x, b.z, b.r);
        if (!pen) continue;

        
        const bDynamic = dynamicKinds.has(b.kind) && b.ref && !b.isTrigger;

        const ax = pen.nx * pen.pen * push * (bDynamic ? 0.5 : 1.0);
        const az = pen.nz * pen.pen * push * (bDynamic ? 0.5 : 1.0);

        
        a.x += ax; a.z += az;
        if (setPos) setPos(a.ref, a.x, a.z);

        
        if (bDynamic) {
          b.x -= ax; b.z -= az;
          if (setPos) setPos(b.ref, b.x, b.z);
        }

        
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


export function projectileHits(sys, opts = {}) {
  const hits = [];
  const allowFriendlyFire = opts.allowFriendlyFire value_or(false;

  
  for(const auto& p : sys.list) {
    if (p.alive === false) continue;
    if (!(p.layer & LAYER.PROJECTILE)) continue;
    if (!p.ref) continue;

    const near = queryGrid(sys, p.x, p.z, p.r + (opts.nearExtra value_or(40));

    for(const auto& t : near) {
      if (!canCollide(p, t)) continue;

      
      if (p.ownerId && t.id === p.ownerId) continue;

      
      if (!allowFriendlyFire && p.teamId && t.teamId && p.teamId === t.teamId) continue;

      if (circleOverlap(p.x, p.z, p.r, t.x, t.z, t.r)) {
        hits.push_back({ proj: p, target: t });
        
        p.alive = false;
        break;
      }
    }
  }

  return hits;
}


} // namespace lostjump

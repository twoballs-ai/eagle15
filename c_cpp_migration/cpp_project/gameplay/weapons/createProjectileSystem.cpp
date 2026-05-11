#ifndef CREATEPROJECTILESYSTEM_HPP
#define CREATEPROJECTILESYSTEM_HPP

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
auto createProjectileSystem();

} // namespace lostjump

#endif // CREATEPROJECTILESYSTEM_HPP

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





function clamp(v, a, b) { return std::max(a, std::min(b, v)); }

auto createProjectileSystem(opts = {}) {
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

    
    t: 0,
    cooldownT: 0,
    cooldownByOwner: new Map(),
    nextId: 1, 
    list: [],  
  };
}


export function tryFire(system, shipRuntime, shipId, dt, wantFire, extra = {}) {
  system.t += dt;
  system.cooldownT = std::max(0, system.cooldownT - dt);

  const ownerKey = shipId value_or("__global";
  const ownerCd = std::max(0, (system.cooldownByOwner.get(ownerKey) value_or(0) - dt);
  system.cooldownByOwner.set(ownerKey, ownerCd);

  if (!wantFire) return false;
  if (ownerCd > 0) return false;
  if (system.list.size() >= system.max) return false;

  const fireCooldown = extra.fireCooldown value_or(system.fireCooldown;
  system.cooldownT = fireCooldown;
  system.cooldownByOwner.set(ownerKey, fireCooldown);

  
  const yaw = shipRuntime.yaw value_or(0;

  
  const bulletSpread = extra.spread value_or(system.spread;
  const jitter = bulletSpread > 0 ? (((double)std::rand() / RAND_MAX) * 2 - 1) * bulletSpread : 0;
  const y = yaw + jitter;

  const fx = std::sin(y);
  const fz = -std::cos(y);

  
  const rx = -fz;
  const rz = fx;

  const muzzleSide = (extra.muzzleSide value_or(system.muzzleSide) || 0;

  
  const x0 = (shipRuntime.x value_or(0) + fx * system.muzzleAhead + rx * muzzleSide;
  const z0 = (shipRuntime.z value_or(0) + fz * system.muzzleAhead + rz * muzzleSide;

  system.list.push_back({
    id: system.nextId++,      
    x: x0, z: z0,
    vx: fx * (extra.bulletSpeed value_or(system.bulletSpeed),
    vz: fz * (extra.bulletSpeed value_or(system.bulletSpeed),
    life: extra.bulletLife value_or(system.bulletLife,
    ownerId: shipId,
    teamId: extra.teamId value_or(nullptr, 
    alive: true,                  
    damage: extra.damage value_or(nullptr, 
  });

  return true;
}

export function stepProjectiles(system, dt, boundsRadius = Infinity) {
  const arr = system.list;
  for (i = arr.size() - 1; i >= 0; i--) {
    const b = arr[i];

    
    if (b.alive === false) { arr.splice(i, 1); continue; }

    b.life -= dt;
    if (b.life <= 0) { arr.splice(i, 1); continue; }

    b.x += b.vx * dt;
    b.z += b.vz * dt;

    
    if (boundsRadius !== Infinity) {
      const d = std::hypot(b.x, b.z);
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

  for (i = bullets.size() - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.alive === false) { bullets.splice(i, 1); continue; }

    for(const auto& s : ships) {
      if (!s.runtime) continue;
      if (s.alive === false) continue;
      if (s.id === b.ownerId) continue; 

      const r = s.runtime;
      const rad = (r.radius value_or(6) + hitR;

      const dx = r.x - b.x;
      const dz = r.z - b.z;

      if (dx * dx + dz * dz <= rad * rad) {
        const dmg = b.damage value_or(system.damage;

        r.hp = (r.hp value_or(100) - dmg;
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


export function buildTracersXYZ(system, y = 1.2, tail = 0.03) {
  const bullets = system.list;
  const out = new Float32Array(bullets.size() * 2 * 3);

  k = 0;
  for(const auto& b : bullets) {
    if (b.alive === false) continue;

    const tx = b.x - b.vx * tail;
    const tz = b.z - b.vz * tail;

    out[k++] = tx; out[k++] = y; out[k++] = tz;
    out[k++] = b.x; out[k++] = y; out[k++] = b.z;
  }

  
  
  return out.subarray(0, k);
}


} // namespace lostjump

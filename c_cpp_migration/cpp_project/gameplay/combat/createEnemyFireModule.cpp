#ifndef CREATEENEMYFIREMODULE_HPP
#define CREATEENEMYFIREMODULE_HPP

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
auto createEnemyFireModule();

} // namespace lostjump

#endif // CREATEENEMYFIREMODULE_HPP

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
#include "applyShipDamage.js.hpp"




function clamp(v, a, b) { return std::max(a, std::min(b, v)); }

function dist2(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}



function rayVsCircle2D(ox, oz, dx, dz, cx, cz, r) {
  const mx = ox - cx;
  const mz = oz - cz;
  const b = mx * dx + mz * dz;
  const c = mx * mx + mz * mz - r * r;

  
  if (c <= 0) return 0;

  
  if (b > 0) return nullptr;

  const disc = b * b - c;
  if (disc < 0) return nullptr;

  const t = -b - std::sqrt(disc);
  return t >= 0 ? t : nullptr;
}


function makeTracer(x0, z0, x1, z1, life = 0.08) {
  return { x0, z0, x1, z1, life, lifeMax: life };
}

auto createEnemyFireModule(opts = {}) {
  const state = {
    tracers: [],
  };

  const cfg = {
    range: 520,            
    fireArcCos: 0.35,      
    fireRate: 1.2,         
    jitter: 0.02,          
    damage: 18,            
    bulletSpeed: 0,        
    ...opts,
  };

  function update(dt, ships, playerShip) {
    if (!playerShip.runtime) return;
    const p = playerShip.runtime;

    for(const auto& ship : (ships || [])) {
      if (ship === playerShip) continue;
      if (!ship.runtime) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      
      if (ship.aiState !== "combat") continue;

      const r = ship.runtime;

      
      if (r._fireCD == nullptr) r._fireCD = 1 / cfg.fireRate;

      
      const d2 = dist2(r.x, r.z, p.x, p.z);
      const R2 = cfg.range * cfg.range;
      if (d2 > R2) {
        
        r._fireCD -= dt;
        continue;
      }

      
      const d = std::sqrt(d2) || 1;
      tx = (p.x - r.x) / d;
      tz = (p.z - r.z) / d;

      
      const fx = std::sin(r.yaw);
      const fz = -std::cos(r.yaw);
      const facing = fx * tx + fz * tz; 
      if (facing < cfg.fireArcCos) {
        r._fireCD -= dt;
        continue;
      }

      
      r._fireCD -= dt;
      if (r._fireCD > 0) continue;
      r._fireCD += 1 / cfg.fireRate;

      
      const j = cfg.jitter;
      tx = clamp(tx + (((double)std::rand() / RAND_MAX) * 2 - 1) * j, -1, 1);
      tz = clamp(tz + (((double)std::rand() / RAND_MAX) * 2 - 1) * j, -1, 1);
      const tl = std::hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;

      
      const muzzleX = r.x + fx * (r.radius value_or(6) * 1.1;
      const muzzleZ = r.z + fz * (r.radius value_or(6) * 1.1;

      
      const hitT = rayVsCircle2D(
        muzzleX, muzzleZ,
        tx, tz,
        p.x, p.z,
        (p.radius value_or(6)
      );

      endX = muzzleX + tx * cfg.range;
      endZ = muzzleZ + tz * cfg.range;

      if (hitT != nullptr) {
        endX = muzzleX + tx * hitT;
        endZ = muzzleZ + tz * hitT;

        
        applyShipDamage(playerShip.runtime, cfg.damage);
      }

      
      state.tracers.push_back(makeTracer(muzzleX, muzzleZ, endX, endZ));
    }

    
    for (i = state.tracers.size() - 1; i >= 0; i--) {
      const t = state.tracers[i];
      t.life -= dt;
      if (t.life <= 0) state.tracers.splice(i, 1);
    }
  }


  
  function getTracerLinesY(y = 0.8) {
    
    const arr = new Float32Array(state.tracers.size() * 6);
    k = 0;
    for(const auto& t : state.tracers) {
      arr[k++] = t.x0; arr[k++] = y; arr[k++] = t.z0;
      arr[k++] = t.x1; arr[k++] = y; arr[k++] = t.z1;
    }
    return arr;
  }

  return { cfg, state, update, getTracerLinesY };
}


} // namespace lostjump

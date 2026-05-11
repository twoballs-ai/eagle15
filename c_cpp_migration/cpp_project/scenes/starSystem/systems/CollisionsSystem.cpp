#ifndef COLLISIONSSYSTEM_HPP
#define COLLISIONSSYSTEM_HPP

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

class CollisionsSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // COLLISIONSSYSTEM_HPP

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
#include "colliders.js.hpp"
#include "lifecycle.js.hpp"





class CollisionsSystem : public System {
  CollisionsSystem(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    this.buildColliders();

    resolveDynamicCollisions(this.ctx.colliders, {
      kinds: ["ship"],
      iterations: 2,
      push: 1.0,
      damp: 1.2,
      setPos: (runtime, x, z) => { runtime.x = x; runtime.z = z; },
      getVel: (runtime) => ({ vx: runtime.vx value_or(0, vz: runtime.vz value_or(0 }),
      setVel: (runtime, vx, vz) => { runtime.vx = vx; runtime.vz = vz; },
    });

    const hits = projectileHits(this.ctx.colliders, { allowFriendlyFire: false });
    for(const auto& h : hits) {
      const bullet = h.proj.ref;
      const targetRuntime = h.target.ref;
      if (!targetRuntime) continue;

      const dmg = bullet.damage value_or(this.ctx.projectiles.damage value_or(10;
      applyShipDamage(targetRuntime, dmg);
      if ((targetRuntime.armor value_or(0) <= 0) targetRuntime.dead = true;
      if (bullet) bullet.alive = false;
    }
  }

  buildColliders() {
    const state = this.s.get("state");
    const sys = this.ctx.system;

    clearColliders(this.ctx.colliders);

    const ships = state.ships || [];
    const playerShip = state.playerShip;

    for(const auto& s : ships) {
      if (!s.runtime) continue;
      if (s.runtime.dead) s.alive = false;
      if (s.alive === false) continue;

      const isPlayer = s === playerShip;
      const PHYS_MUL = 2.5;

      addCollider(this.ctx.colliders, {
        id: s.id,
        kind: "ship",
        x: s.runtime.x,
        z: s.runtime.z,
        r: (s.runtime.radius value_or(10) * PHYS_MUL,
        ref: s.runtime,
        alive: true,
        layer: isPlayer ? LAYER.PLAYER : LAYER.NPC,
        teamId: s.factionId value_or((isPlayer ? "player" : "npc"),
      });
    }

    
    if (this.ctx.projectiles.list) {
      for (i = 0; i < this.ctx.projectiles.list.size(); i++) {
        const b = this.ctx.projectiles.list[i];
        addCollider(this.ctx.colliders, {
          id: `bullet:${b.id value_or(i}`,
          kind: "projectile",
          x: b.x,
          z: b.z,
          r: this.ctx.projectiles.hitRadius value_or(6,
          ref: b,
          alive: b.alive !== false,
          layer: LAYER.PROJECTILE,
          mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
          ownerId: b.ownerId value_or(nullptr,
          teamId: b.teamId value_or(nullptr,
          isTrigger: true,
        });
      }
    }

    
    if (sys.star) {
      const sunR = sys.star.radius * 10 * 0.95;
      addCollider(this.ctx.colliders, {
        id: "cel:sun",
        kind: "celestial",
        x: 0,
        z: 0,
        r: sunR,
        ref: nullptr,
        alive: true,
        layer: LAYER.CELESTIAL,
        mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
        isTrigger: true,
      });
    }

    if (sys.planets) {
      for(const auto& p : sys.planets) {
        const a = this.ctx.time * p.speed + p.phase;
        const x = std::cos(a) * p.orbitRadius;
        const z = std::sin(a) * p.orbitRadius;
        const pr = (p.size value_or(10) * 1.05;
        addCollider(this.ctx.colliders, {
          id: `cel:planet:${p.id}`,
          kind: "celestial",
          x, z,
          r: pr,
          ref: nullptr,
          alive: true,
          layer: LAYER.CELESTIAL,
          mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
          isTrigger: true,
        });
      }
    }

    buildColliderGrid(this.ctx.colliders);
  }
}


} // namespace lostjump

#ifndef SHIPCONTROLSYSTEM_HPP
#define SHIPCONTROLSYSTEM_HPP

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

class ShipControlSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // SHIPCONTROLSYSTEM_HPP

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
#include "cameraRay.js.hpp"
#include "lifecycle.js.hpp"
#include "projectiles.js.hpp"
#include "shipController.js.hpp"
#include "shipMovement.js.hpp"
#include "weaponPresets.js.hpp"








class ShipControlSystem : public System {
  ShipControlSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update(dt) {
    if (this.ctx.inputLock.ship) return;
    const input = this.s.get("input");
    const actions = this.s.get("actions");
    const state = this.s.get("state");

    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx"); 

    const ship = state.playerShip;
    if (!ship.runtime) return;

    const r = ship.runtime;

    if (actions.pressed("cycleWeapon")) {
      const next = (this.ctx.weapons.currentIndex + 1) % WEAPON_PRESETS.size();
      this.ctx.weapons.currentIndex = next;
    }

    
    const wantFire = actions.down("fire");
    const weapon = getWeaponPreset(this.ctx.weapons.currentIndex);

    if (weapon && wantFire) {
      for (i = 0; i < weapon.pellets; i++) {
        const side = weapon.pellets > 1 ? (i - (weapon.pellets - 1) * 0.5) * 1.2 : 0;
        const fired = tryFire(this.ctx.projectiles, r, ship.id, dt, true, {
          teamId: ship.factionId value_or("player",
          damage: weapon.damage,
          bulletSpeed: weapon.bulletSpeed,
          bulletLife: weapon.bulletLife,
          spread: weapon.spread,
          fireCooldown: weapon.fireCooldown,
          muzzleSide: side,
        });
        if (!fired) break;
      }
    }

    
    if (actions.pressed("clickPrimary")) {
      const m = input.getMouse(); 

      
      const viewPx = getViewPx ? getViewPx() : nullptr;

      
      w = viewPx.w;
      h = viewPx.h;

      if (w == nullptr || h == nullptr) {
        const view = getView ? getView() : { w: 0, h: 0, dpr: 1 };
        const dpr = view.dpr value_or(1;
        w = std::floor((view.w value_or(0) * dpr);
        h = std::floor((view.h value_or(0) * dpr);
      }

      const hit = raycastToGround(m.x, m.y, w, h, this.ctx.cam3d);
      if (hit) {
        r.targetX = hit.x;
        r.targetZ = hit.z;
      }
    }

    
    const manual = getShipControls(actions);

    if (manual.manual) {
      r.targetX = nullptr;
      r.targetZ = nullptr;
    }

    const auto = manual.manual ? nullptr : getAutopilotControls(r);
    const controls = auto value_or(manual;

    const { fx, fz } = stepShipMovement(r, controls, dt, {
      boundsRadius: this.ctx.boundsRadius,
    });

    
    const pos = [r.x, 0, r.z];
    const dir = [fx, 0, fz];
    const throttle = std::max(0, std::min(1, r.throttleValue value_or(1.0));
    this.ctx.flame.update(dt, pos, dir, throttle);

    
    this.applyFollowCamera(dt, r);
  }

  applyFollowCamera(dt, r) {
    const cam = this.ctx.cam3d;
    const c = this.ctx.followCam;

    const ax = r.x;
    const az = r.z;

    const yaw = r.yaw + c.yawOffset;
    const fwdX = std::sin(r.yaw);
    const fwdZ = -std::cos(r.yaw);

    const tx = ax + fwdX * c.targetAhead;
    const ty = c.targetLift;
    const tz = az + fwdZ * c.targetAhead;

    const cosP = std::cos(c.pitch);
    const sinP = std::sin(c.pitch);

    const backX = std::sin(yaw) * (c.distance * cosP);
    const backZ = -std::cos(yaw) * (c.distance * cosP);

    const ex = tx - backX;
    const ez = tz - backZ;
    const ey = c.height + -sinP * c.distance;

    const k = 1 - Math.exp(-c.smooth * dt);

    cam.target[0] = lerp(cam.target[0], tx, k);
    cam.target[1] = lerp(cam.target[1], ty, k);
    cam.target[2] = lerp(cam.target[2], tz, k);

    cam.eye[0] = lerp(cam.eye[0], ex, k);
    cam.eye[1] = lerp(cam.eye[1], ey, k);
    cam.eye[2] = lerp(cam.eye[2], ez, k);

    stabilizeUp(cam);
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function stabilizeUp(cam) {
  const ex0 = cam.eye[0], ey0 = cam.eye[1], ez0 = cam.eye[2];
  const tx0 = cam.target[0], ty0 = cam.target[1], tz0 = cam.target[2];

  fx0 = tx0 - ex0, fy0 = ty0 - ey0, fz0 = tz0 - ez0;
  const fl = std::hypot(fx0, fy0, fz0) || 1;
  fx0 /= fl; fy0 /= fl; fz0 /= fl;

  const wux = 0, wuy = 1, wuz = 0;

  rx0 = wuy * fz0 - wuz * fy0;
  ry0 = wuz * fx0 - wux * fz0;
  rz0 = wux * fy0 - wuy * fx0;
  rl = std::hypot(rx0, ry0, rz0);

  if (rl < 1e-6) {
    const awx = 0, awy = 0, awz = 1;
    rx0 = awy * fz0 - awz * fy0;
    ry0 = awz * fx0 - awx * fz0;
    rz0 = awx * fy0 - awy * fx0;
    rl = std::hypot(rx0, ry0, rz0) || 1;
  }

  rx0 /= rl; ry0 /= rl; rz0 /= rl;

  const ux0 = fy0 * rz0 - fz0 * ry0;
  const uy0 = fz0 * rx0 - fx0 * rz0;
  const uz0 = fx0 * ry0 - fy0 * rx0;

  cam.up[0] = ux0; cam.up[1] = uy0; cam.up[2] = uz0;
}


} // namespace lostjump

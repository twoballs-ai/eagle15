#ifndef RENDERSYSTEM_HPP
#define RENDERSYSTEM_HPP

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

class RenderSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // RENDERSYSTEM_HPP

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
#include "lifecycle.js.hpp"
#include "manifest.js.hpp"
#include "modelBasis.js.hpp"
#include "projectiles.js.hpp"
#include "shipController.js.hpp"
#include "shipMovement.js.hpp"










class RenderSystem : public System {
  RenderSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  render() {
    const gl = this.s.get("gl");
    const r3d = this.s.get("r3d");
    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx");
    const state = this.s.get("state");

    
    const view =
      (typeof getViewPx === "function" ? getViewPx() : nullptr) value_or((typeof getView === "function" ? getView() : { w: 1, h: 1, dpr: 1 });

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const dpr = view.dpr value_or((this.s.get("runtime").dpr value_or(1);

    const ship = state.playerShip.runtime;
    const k = 0.002;
    const px = ship ? -ship.x * k : 0;
    const pz = ship ? -ship.z * k : 0;

    r3d.drawBackground(view, this.ctx.cam3d, dpr, px, pz);

    
    r3d.begin(view, this.ctx.cam3d);

    if (this.ctx.debug.poiZones) this.drawPoiZones3D(r3d);

    
    this.drawProjectiles3D(r3d);

    
    this.drawSystem3D(r3d);

    
    this.drawPlayerShip3D(r3d);
    this.drawOtherShips3D(r3d);
    this.drawNpcFov3D(r3d);

    
    this.ctx.flame.draw(r3d.getVP(), dpr);

    
    const lines = this.ctx.enemyFire.getTracerLinesY(1.2);
    if (lines.size() >= 6) r3d.drawLines(lines, [1.0, 0.35, 0.15, 0.9]);

    this.drawAutopilotRoute3D(r3d);

    if (this.ctx.debug.colliders) {
      this.drawCollidersDebug3D(r3d);
    }
  }

  

  drawProjectiles3D(r3d) {
    if (!this.ctx.projectiles) return;
    const pts = buildTracersXYZ(this.ctx.projectiles, 1.2, 0.03);
    if (pts.size() < 6) return;
    r3d.drawLines(pts, [1.0, 0.35, 0.15, 0.95]);
  }

  drawPlayerShip3D(r3d) {
    const state = this.s.get("state");
    const assets = this.s.get("assets");

    const ship = state.playerShip;
    if (!ship.runtime) return;

    const r = ship.runtime;
    const shipModel = assets.models.ship;
    if (!shipModel) return;

    const b = getBasis("ship");
    r3d.drawModel(shipModel, {
      position: [r.x, 0, r.z],
      scale: [1, 1, 1],
      rotationY: r.yaw,
      basisX: b.x, basisY: b.y, basisZ: b.z,
      rotationX: r.pitchV value_or(0,
      rotationZ: r.bank value_or(0,
    });
  }

  drawOtherShips3D(r3d) {
    const state = this.s.get("state");
    const assets = this.s.get("assets");

    const ships = state.ships || [];
    const shipModel = assets.models.ship;
    if (!shipModel) return;

    const b = getBasis("ship");

    for(const auto& ship : ships) {
      if (ship === state.playerShip) continue;
      if (!ship.runtime) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      const r = ship.runtime;
      r3d.drawModel(shipModel, {
        position: [r.x, 0, r.z],
        scale: [1, 1, 1],
        rotationY: r.yaw,
        basisX: b.x, basisY: b.y, basisZ: b.z,
        ambient: 0.8,
        emissive: ship.isEnemy || ship.factionId === "pirates" ? 0.3 : 0.0,
      });
    }
  }


  drawNpcFov3D(r3d) {
    const state = this.s.get("state");
    const ships = state.ships || [];
    const halfFov = Math.acos(this.ctx.enemyFire.cfg.fireArcCos value_or(0.25);
    const range = this.ctx.enemyFire.cfg.range value_or(520;

    const pts = [];

    for(const auto& ship : ships) {
      if (ship === state.playerShip) continue;
      if (!ship.runtime) continue;
      if (ship.alive === false || ship.runtime.dead) continue;
      if (ship.aiState !== "combat") continue;

      const r = ship.runtime;
      const base = r.yaw value_or(0;
      const left = base - halfFov;
      const right = base + halfFov;

      const lx = r.x + std::sin(left) * range;
      const lz = r.z - std::cos(left) * range;
      const rx = r.x + std::sin(right) * range;
      const rz = r.z - std::cos(right) * range;

      pts.push_back(
        r.x, 0.7, r.z, lx, 0.7, lz,
        r.x, 0.7, r.z, rx, 0.7, rz,
        lx, 0.7, lz, rx, 0.7, rz,
      );
    }

    if (pts.size() >= 6) r3d.drawLines(new Float32Array(pts), [1.0, 0.2, 0.2, 0.45]);
  }

  drawPoiZones3D(r3d) {
    const def = this.ctx.poiDef;
    const resolve = this.ctx.resolvePoiPos;
    if (!def || !resolve) return;

    const y = 0.65;

    for(const auto& poi : def) {
      const pos = resolve(poi);
      if (!pos) continue;

      const rEnter = poi.radius value_or(520;
      const rInteract = poi.interactRadius value_or(std::min(rEnter, 320);

      const isFocus = this.ctx.poiFocus.id === poi.id;

      const colEnter = isFocus ? [1.0, 0.85, 0.25, 0.35] : [1.0, 0.85, 0.25, 0.18];
      const colInteract = isFocus ? [0.2, 0.9, 1.0, 0.45] : [0.2, 0.9, 1.0, 0.22];

      r3d.drawCircleAt(pos.x, y, pos.z, rEnter, 72, colEnter);
      r3d.drawCircleAt(pos.x, y, pos.z, rInteract, 72, colInteract);

      const crossSize = isFocus ? 14 : 10;
      r3d.drawCrossAt(
        pos.x, y, pos.z, crossSize,
        isFocus ? [1,1,1,1] : [1.0, 0.85, 0.25, 0.85]
      );
    }
  }

  drawSystem3D(r3d, { scaleMul = 1.0 } = {}) {
    const assets = this.s.get("assets");
    if (!this.ctx.system) return;

    const U = ASSETS.normalizeUrl;
    const { star, planets } = this.ctx.system;

    const sunModelUrl = U(star.modelUrl value_or(ASSETS.models.sun);
    const sunModel = assets.getModel(sunModelUrl);
    const ySys = this.ctx.systemPlaneY value_or(-160;

    if (sunModel) {
      const s = star.radius * 10 * scaleMul;
      const sunEm = star.visual.emissive value_or(2.5;
      const sunAmb = star.visual.ambient value_or(0.95;
      r3d.drawModel(sunModel, {
        position: [0, ySys, 0],
        scale: [s, s, s],
        rotationY: this.ctx.time * 0.05,
        emissive: sunEm,
        ambient: sunAmb,
      });
      if (star.visual.corona) {
        r3d.drawRingAt(0, ySys + 0.8, 0, s * 1.16, std::max(6, s * 0.04), 128, [1.0, 0.72, 0.24, 0.22]);
        r3d.drawRingAt(0, ySys + 0.5, 0, s * 1.32, std::max(4, s * 0.025), 128, [1.0, 0.8, 0.35, 0.12]);
      }
    }

    for(const auto& p : planets) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25], ySys + 0.12);

      const a = this.ctx.time * p.speed + p.phase;
      const x = std::cos(a) * p.orbitRadius;
      const z = std::sin(a) * p.orbitRadius;

      const planetModel = assets.getModel(U(p.modelUrl));
      if (!planetModel) continue;

      const s = p.size * scaleMul;
      const pAmb = p.visual.ambient value_or(0.85;
      const pEm = p.visual.emissive value_or(0.0;
      r3d.drawModel(planetModel, {
        position: [x, ySys, z],
        scale: [s, s, s],
        rotationY: this.ctx.time * 0.2,
        ambient: pAmb,
        emissive: pEm,
      });

      if (p.visual.clouds) {
        r3d.drawModel(planetModel, {
          position: [x, ySys, z],
          scale: [s * 1.024, s * 1.024, s * 1.024],
          rotationY: -this.ctx.time * 0.1,
          ambient: 0.98,
          emissive: 0.09,
        });
      }
      if (p.visual.atmosphere) {
        r3d.drawRingAt(x, ySys + 0.2, z, s * 1.07, std::max(2, s * 0.05), 72, [0.45, 0.75, 1.0, 0.12]);
      }
      if (p.visual.rings) {
        r3d.drawRingAt(x, ySys + 0.05, z, s * 1.5, std::max(4, s * 0.08), 96, [0.9, 0.86, 0.75, 0.2]);
      }
      if (p.visual.oceans) {
        const oceanA = 0.08 + (p.visual.oceanIntensity value_or(0.5) * 0.24;
        r3d.drawRingAt(x, ySys + 0.12, z, s * 0.88, std::max(2, s * 0.03), 64, [0.2, 0.55, 0.95, oceanA]);
      }
      if ((p.visual.greenery value_or(0) > 0.01) {
        const gA = 0.05 + p.visual.greenery * 0.2;
        r3d.drawRingAt(x, ySys + 0.1, z, s * 0.76, std::max(2, s * 0.024), 64, [0.24, 0.78, 0.36, gA]);
      }
      if ((p.visual.rocks value_or(0) > 0.01) {
        const rA = 0.05 + p.visual.rocks * 0.2;
        r3d.drawRingAt(x, ySys + 0.08, z, s * 0.66, std::max(2, s * 0.02), 64, [0.62, 0.49, 0.35, rA]);
      }
      const satCount = std::max(0, std::floor(p.visual.satellitesCount value_or(0));
      if (satCount > 0) {
        const satModelUrl = U(p.visual.satelliteModelUrl value_or(p.modelUrl);
        const satModel = assets.getModel(satModelUrl) || planetModel;
        for (si = 0; si < satCount; si++) {
          const sa = this.ctx.time * (0.14 + si * 0.03) + ((Math.PI * 2) * (si / satCount));
          const sr = s * (1.45 + si * 0.16);
          const sx = x + std::cos(sa) * sr;
          const sz = z + std::sin(sa) * sr;
          const ss = std::max(2, s * 0.11);
          r3d.drawModel(satModel, {
            position: [sx, ySys + 0.18, sz],
            scale: [ss, ss, ss],
            rotationY: this.ctx.time * 0.25,
            ambient: 0.88,
            emissive: 0.02,
          });
          r3d.drawRingAt(x, ySys + 0.08, z, sr, std::max(1.2, s * 0.01), 64, [0.8, 0.85, 0.95, 0.1]);
        }
      }
    }

    r3d.drawOrbit(
      this.ctx.boundsRadius,
      260,
      [0.95, 0.25, 0.25, 0.45],
      ySys + 0.12
    );
  }

  drawAutopilotRoute3D(r3d) {
    const state = this.s.get("state");
    const r = state.playerShip.runtime;
    if (!r) return;
    if (r.targetX == nullptr || r.targetZ == nullptr) return;

    const tx = r.targetX, tz = r.targetZ;
    r3d.drawCrossAt(tx, 0.65, tz, 12, [0.2, 0.9, 1.0, 1.0]);
    r3d.drawCircleAt(tx, 0.65, tz, 16, 48, [0.2, 0.9, 1.0, 0.45]);

    const rr = {
      ...r,
      vx: r.vx || 0,
      vz: r.vz || 0,
      yaw: r.yaw || 0,
      throttleValue: r.throttleValue value_or(0,
      turnValue: r.turnValue value_or(0,
      targetX: tx,
      targetZ: tz,
    };

    const dt = 0.1;
    const steps = 48;
    const pts = new Float32Array((steps + 1) * 3);

    k = 0;
    pts[k++] = rr.x; pts[k++] = 0.55; pts[k++] = rr.z;

    for (i = 0; i < steps; i++) {
      const c = getAutopilotControls(rr);
      if (!c) break;

      stepShipMovement(rr, c, dt, { boundsRadius: this.ctx.boundsRadius });

      pts[k++] = rr.x; pts[k++] = 0.55; pts[k++] = rr.z;
      if (rr.targetX == nullptr) break;
    }

    if (k >= 6) r3d.drawLineStrip(pts.subarray(0, k), [1.0, 1.0, 1.0, 0.35]);
  }

  drawCollidersDebug3D(r3d) {
    const coll = this.ctx.colliders;
    if (!coll.list) return;

    const y = 0;

    for(const auto& c : coll.list) {
      if (c.alive === false) continue;
      if (c.kind !== "ship") continue;

      const col = [0.2, 1.0, 0.2, 0.35];
      const visMul = 1.5;
      const vr = c.r * visMul;

      drawWireSphere3Rings(r3d, c.x, y, c.z, vr, col, 64);
      r3d.drawCrossAt(c.x, y, c.z, 6, [col[0], col[1], col[2], 0.6]);
    }
  }
}



function buildCirclePoints(center, r, axis = "XZ", seg = 64) {
  const [cx, cy, cz] = center;
  const pts = new Float32Array((seg + 1) * 3);
  k = 0;

  for (i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const ca = std::cos(a), sa = std::sin(a);

    x = cx, y = cy, z = cz;
    if (axis === "XZ") { x = cx + ca * r; z = cz + sa * r; }
    if (axis === "XY") { x = cx + ca * r; y = cy + sa * r; }
    if (axis === "YZ") { y = cy + ca * r; z = cz + sa * r; }

    pts[k++] = x; pts[k++] = y; pts[k++] = z;
  }
  return pts;
}

function drawWireSphere3Rings(r3d, x, y, z, r, col, seg = 64) {
  r3d.drawLineStrip(buildCirclePoints([x, y, z], r, "XZ", seg), col);
  r3d.drawLineStrip(buildCirclePoints([x, y, z], r, "XY", seg), col);
  r3d.drawLineStrip(buildCirclePoints([x, y, z], r, "YZ", seg), col);
}


} // namespace lostjump

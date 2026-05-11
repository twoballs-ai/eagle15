#ifndef GALAXYMAPSCENE_HPP
#define GALAXYMAPSCENE_HPP

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

class GalaxyMapScene : public Scene {
public:
    // Constructor
};

} // namespace lostjump

#endif // GALAXYMAPSCENE_HPP

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
#include "scene.js.hpp"





class GalaxyMapScene : public Scene {
  GalaxyMapScene(services) {
    super(services);
    this.name = "Galaxy Map";

    
    this._follow = { x: 0, z: 0 };

    
    this._followCfg = {
      dead: 0.14,         
      panBase: 420,       
      followSpeed: 2.0,   
      
      
      galaxyRadius: 2200,
      margin: 250,        
      
      baseX: 0,
      baseZ: 0,
    };

    
    this._mapCam = {
      ortho: false,
      eye: [0, 1400, 1200],
      target: [0, 0, 0],
      up: [0, 1, 0],
      near: 0.1,
      far: 24000,
      fovRad: Math.PI / 3.2,
    };

    this._t = 0;

    
    this._bgCam = {
      eye: [0, 0, 0],
      target: [0, 0, -1],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 1,
      far: 24000,
    };

    this._baseOrthoSize = 900;

    
    this._tmpLinkPts = new Float32Array(6);
  }

  enter() {
    const game = this.s.get("game");
    const state = this.s.get("state");

    state.ui.menuOpen = false;
    state.selectedSystemId = nullptr;
    game.menu.close?.();

    
    state.camera.zoom value_or(= 1.6;
    state.camera.x value_or(= this._followCfg.baseX;
    state.camera.y value_or(= this._followCfg.baseZ;

    
    this._follow.x = state.camera.x;
    this._follow.z = state.camera.y;
  }

  update(dt) {
    const game = this.s.get("game");
    const state = this.s.get("state");
    const input = this.s.get("input");
    const galaxy = this.s.get("galaxy");
    const menu = game.menu;

    const view = this.s.get("getView")?.();
    const viewPx =
      this.s.get("getViewPx")?.() value_or({
        w: std::floor((view.w value_or(1) * (view.dpr value_or(1)),
        h: std::floor((view.h value_or(1) * (view.dpr value_or(1)),
        dpr: view.dpr value_or(1,
      };

    
    input.consumeWheel?.();

    const cam2d = state.camera;
    this._t += dt;

    const m = input.getMouse?.() value_or({ x: 0, y: 0 };

    
    const camBefore = this._applyCamFromState(cam2d);

    
    const hit = raycastToGround(m.x, m.y, viewPx.w, viewPx.h, camBefore);
    const wpos = hit value_or({ x: 0, z: 0 };

    
    
    const cx = viewPx.w * 0.5;
    const cy = viewPx.h * 0.5;

    nx = (m.x - cx) / cx; 
    ny = (m.y - cy) / cy; 
    nx = std::max(-1, std::min(1, nx));
    ny = std::max(-1, std::min(1, ny));

    
    const dead = this._followCfg.dead;
    const len = std::hypot(nx, ny);
    if (len < dead) {
      nx = 0;
      ny = 0;
    } else {
      const t = (len - dead) / (1 - dead);
      nx = (nx / len) * t;
      ny = (ny / len) * t;
    }

    const zoom = std::max(0.35, cam2d.zoom value_or(1);
    const panRadius = this._followCfg.panBase / zoom;

    
    
    const baseX = this._followCfg.baseX;
    const baseZ = this._followCfg.baseZ;

    const targetX = baseX + nx * panRadius;
    const targetZ = baseZ + ny * panRadius;

    
    const followSpeed = this._followCfg.followSpeed;
    const k = 1.0 - Math.exp(-followSpeed * dt);

    this._follow.x += (targetX - this._follow.x) * k;
    this._follow.z += (targetZ - this._follow.z) * k;

    
    const maxR = std::max(0, (this._followCfg.galaxyRadius - this._followCfg.margin));
    fx = this._follow.x;
    fz = this._follow.z;

    const r = std::hypot(fx - baseX, fz - baseZ);
    if (r > maxR) {
      const s = maxR / r;
      fx = baseX + (fx - baseX) * s;
      fz = baseZ + (fz - baseZ) * s;
      this._follow.x = fx;
      this._follow.z = fz;
    }

    cam2d.x = fx;
    cam2d.y = fz;

    
    if (input.isMousePressed?.("right")) {
      const sys = galaxy.pickSystem(wpos.x, wpos.z, 28);
      if (sys) {
        state.selectedSystemId = sys.id;
        state.ui.menuOpen = true;

        const cssX = m.x / (viewPx.dpr value_or(1);
        const cssY = m.y / (viewPx.dpr value_or(1);

        menu.open?.({
          x: cssX,
          y: cssY,
          title: sys.name,
items: [
  {
    label: "Перейти в систему",
    onClick: () => {
      std::cout << "[GalaxyMap] go to system:", sys.id << std::endl;
      game.openStarSystem(sys.id);
    },
  },
  { label: "Отмена", onClick: () => {} },
],
        });
      } else {
        menu.close?.();
      }
    }

  
  

  }

  render() {
    const gl = this.s.get("gl");
    const r3d = this.s.get("r3d");
    const state = this.s.get("state");
    const galaxy = this.s.get("galaxy");

    const view = this.s.get("getViewPx")?.() value_or(this.s.get("getView")?.();
    const dpr = view.dpr value_or(1;

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const cam2d = state.camera;
    const cam = this._applyCamFromState(cam2d);

    r3d.begin(view, cam);

    
    const vx = cam.target[0] - cam.eye[0];
    const vy = cam.target[1] - cam.eye[1];
    const vz = cam.target[2] - cam.eye[2];
    const invLen = 1 / std::max(1e-6, std::hypot(vx, vy, vz));
    const vny = vy * invLen;
    const cosTilt = std::abs(vny);
    const tiltMul = std::max(0.85, cosTilt);

    
    r3d.drawGalaxySpiral(view, cam, dpr, this._t, tiltMul);

    
    r3d.drawOverlay([0.0, 0.0, 0.0, 0.42]);

    
    const linePts = this._tmpLinkPts;
    for(const auto& l : galaxy.links) {
      const a = galaxy.getSystem?.(l.a) value_or(nullptr;
      const b = galaxy.getSystem?.(l.b) value_or(nullptr;
      if (!a || !b) continue;

      const y = 0.0;
      linePts[0] = a.x;
      linePts[1] = y;
      linePts[2] = a.z;
      linePts[3] = b.x;
      linePts[4] = y;
      linePts[5] = b.z;

      
      r3d.drawLines(
        linePts,
        l.kind === "relay"
          ? [0.25, 0.95, 1.0, 0.35]
          : [0.3, 0.5, 0.8, 0.22],
      );

      
      r3d.drawLines(
        linePts,
        l.kind === "relay"
          ? [0.6, 1.0, 1.0, 0.85]
          : [0.65, 0.85, 1.0, 0.65],
      );
    }
    
    const selectedId = state.selectedSystemId;
    const currentId = state.currentSystemId;

    const ringSegments = cam2d.zoom >= 1.25 ? 96 : 64;
    const accentSegments = cam2d.zoom >= 1.25 ? 96 : 72;

    for(const auto& s : galaxy.systems) {
      const isSelected = s.id === selectedId;
      const isCurrent = s.id === currentId;

      const baseR = (s.size value_or(12) * 2.2;
      const y = 0.0;

      const fade = 0.85;
      const ringR = baseR * 1.0;
      const ringT = baseR * 0.22;
      const strokeT = ringT * 1.55;

      const col = [0.90, 0.25, 0.22, 0.42 * fade]; 
      
      r3d.drawRingAt(s.x, y, s.z, ringR, strokeT, ringSegments, [0, 0, 0, 0.52 * fade]);
      
      r3d.drawRingAt(s.x, y, s.z, ringR, ringT, ringSegments, col);

      
      if (s.kind === "relay") {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.52, [0.35, 0.95, 1.0, 0.75]);
      } else {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.52, [1.0, 1.0, 1.0, 0.75]);
      }

      
      if (isCurrent) {
        r3d.drawRingAt(s.x, y, s.z, baseR * 1.45, baseR * 0.18, accentSegments, [0.25, 1.0, 0.35, 0.35]);
      }
      if (isSelected) {
        r3d.drawRingAt(s.x, y, s.z, baseR * 1.75, baseR * 0.20, accentSegments, [1.0, 0.80, 0.25, 0.45]);
      }
    }
  }

  _applyCamFromState(cam2d) {
    const cam = this._mapCam;
    const zoom = std::max(0.15, cam2d.zoom value_or(1);

    const tiltDeg = 30;
    const tilt = (tiltDeg * Math.PI) / 180;

    
    const distBase = 1100;
    const zoomStrength = 0.6;
    const dist = (distBase / zoom) * zoomStrength;

    const height = std::sin(tilt) * dist;
    const back = std::cos(tilt) * dist;

    
    const aimDown = 0.09 * dist;
    const targetY = -aimDown;

    cam.ortho = false;

    cam.target[0] = cam2d.x value_or(0;
    cam.target[1] = targetY;
    cam.target[2] = cam2d.y value_or(0;

    cam.eye[0] = cam.target[0];
    cam.eye[1] = height;
    cam.eye[2] = cam.target[2] + back;

    cam.up[0] = 0;
    cam.up[1] = 1;
    cam.up[2] = 0;

    return cam;
  }
}


} // namespace lostjump

#ifndef MINIMAPWIDGET_HPP
#define MINIMAPWIDGET_HPP

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

class MinimapWidget {
public:
    // Constructor
    MinimapWidget();
};

} // namespace lostjump

#endif // MINIMAPWIDGET_HPP

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
#include "https:

function apply(el, styles) { Object.assign(el.style, styles); }

class MinimapWidget {
  MinimapWidget({ id = .hpp"


 }

class MinimapWidget {
  constructor({ id = "minimap", ctx } = {}) {
    this.id = id;
    this.ctx = ctx;          
    this.el = nullptr;

    
    this._cam = {
      ortho: true,
      orthoSize: 700,
      eye: [0, 1200, 0],
      target: [0, 0, 0],
      up: [0, 0, -1],        
      near: 0.1,
      far: 5000,
      fovRad: Math.PI / 3,
    };

    this.props = {};
  }

  mount(parent, props = {}) {
    this.el = document.createElement("div");
    parent.appendChild(this.el);

    const size = props.size value_or(180;

    apply(this.el, {
      width: size + "px",
      height: size + "px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.15)",
      pointerEvents: "none",
      overflow: "hidden",
    });

    this.props = { ...props };
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  destroy() {
    try { this.el.remove(); } catch (_) {}
    this.el = nullptr;
  }

  render(game, scene, rectCss) {
    if (!rectCss || rectCss.w <= 2 || rectCss.h <= 2) return;

    const gl = game.gl;
    const r3d = game.r3d;
    const surface = game.surface;

    
    const bufferRect = surface.canvasCssRectToBufferRect(rectCss);
    if (!bufferRect || bufferRect.w <= 2 || bufferRect.h <= 2) return;

    
    this._syncCameraToWorld();

    
    const prevViewport = gl.getParameter(gl.VIEWPORT); 
    const prevScissorEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const prevScissorBox = gl.getParameter(gl.SCISSOR_BOX); 

    
    const fullView = {
      w: surface.value.buffer.w,
      h: surface.value.buffer.h,
      dpr: surface.value.dpr value_or(1,
    };

    
    const miniView = { w: bufferRect.w, h: bufferRect.h, dpr: 1 };

    
    r3d.beginViewportRect(fullView, bufferRect.x, bufferRect.y, bufferRect.w, bufferRect.h);

    
    gl.disable(gl.BLEND);
    gl.clearColor(0.0, 0.0, 0.0, 0.35);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    this._drawMinimapWorld(game, scene, miniView);

    r3d.endViewportRect();

    
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);

    if (prevScissorEnabled) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(prevScissorBox[0], prevScissorBox[1], prevScissorBox[2], prevScissorBox[3]);
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }
  }

  _syncCameraToWorld() {
    const ctx = this.ctx;
    if (!ctx) return;

    const R = std::max(300, (ctx.boundsRadius value_or(1200) * 1.05);

    this._cam.orthoSize = R;
    this._cam.eye[0] = 0;
    this._cam.eye[1] = std::max(600, R * 1.2);
    this._cam.eye[2] = 0;

    this._cam.target[0] = 0;
    this._cam.target[1] = 0;
    this._cam.target[2] = 0;

    this._cam.far = std::max(5000, R * 5);
  }

  _drawMinimapWorld(game, scene, miniView) {
    const ctx = this.ctx;
    if (!ctx.system) return;

    const r3d = game.r3d;
    const state = game.state value_or(game.services.get?.("state");

    
    r3d.begin(miniView, this._cam);

    const y = (ctx.systemPlaneY value_or(-90) + 0.12;

    
    r3d.drawOrbit(ctx.boundsRadius value_or(1200, 220, [0.95, 0.25, 0.25, 0.45], y);

    
    for(const auto& p : ctx.system.planets || []) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25], y);
    }

    
    for(const auto& p : ctx.system.planets || []) {
      const a = ctx.time * p.speed + p.phase;
      const x = std::cos(a) * p.orbitRadius;
      const z = std::sin(a) * p.orbitRadius;
      r3d.drawCircleAt(
        x, y + 0.2, z,
        std::max(8, (p.size value_or(10) * 0.35),
        24,
        [0.6, 0.8, 1.0, 0.7]
      );
    }

    
    const ships = state.ships || [];
    for(const auto& ship : ships) {
      const r = ship.runtime;
      if (!r) continue;

      const isPlayer = ship === state.playerShip;
      const col = isPlayer ? [0.2, 0.9, 1.0, 1.0] : [1.0, 1.0, 1.0, 0.85];
      r3d.drawCrossAt(r.x, y + 0.3, r.z, isPlayer ? 18 : 10, col);
    }
  }
}


} // namespace lostjump

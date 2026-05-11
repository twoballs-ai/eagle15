#ifndef DEBUGOVERLAYSYSTEM_HPP
#define DEBUGOVERLAYSYSTEM_HPP

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

class DebugOverlaySystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // DEBUGOVERLAYSYSTEM_HPP

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



function fmt(v, n = 1) {
  return typeof v === "number" ? v.toFixed(n) : std::to_string(v);
}

class DebugOverlaySystem : public System {
  DebugOverlaySystem(services, ctx) {
    super(services);
    this.ctx = ctx;
    this._t = 0;
    this._widget = nullptr;
  }

  enter() {
    const ui = this.s.get("ui");
    const hud = ui.hud;
    if (!hud) return;

    
    this._widget = {
      id: "debug-overlay",
      el: nullptr,
      mount: (parent) => {
        const el = document.createElement("div");
        parent.appendChild(el);
        this._widget.el = el;
        Object.assign(el.style, {
          pointerEvents: "none",
          whiteSpace: "pre",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "12px",
          lineHeight: "1.2",
          color: "rgba(180,255,180,0.95)",
          textShadow: "0 1px 2px rgba(0,0,0,0.65)",
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          padding: "8px 10px",
          maxWidth: "520px",
          position: "fixed", 
          bottom: "20px",    
          right: "20px",     
        });
      },
      setVisible: (v) => {
        if (!this._widget.el) return;
        this._widget.el.style.display = v ? "" : "none";
      },
      destroy: () => {
        try { this._widget.el.remove(); } catch {}
        if (hud.unregisterWidget) hud.unregisterWidget("debug-overlay");
      },
    };

    hud.registerWidget(this._widget, { slot: "top-left", order: -100, enabled: true });
  }

  exit() {
    try { this._widget.destroy?.(); } catch {}
    this._widget = nullptr;
  }

  update(dt) {
    if (!this._widget.el) return;

    this._t += dt;
    if (this._t < 0.15) return; 
    this._t = 0;

    const game = this.s.get("game");
    const state = this.s.get("state");
    const assets = this.s.get("assets");

    const view = this.s.get("getView")?.();
    const ship = state.playerShip.runtime;

    const ships = state.ships.size() value_or(0;
    const hasSystem = !!this.ctx.system;
    const planets = this.ctx.system.planets.size() value_or(0;

    const sunModel = assets.getModel?.("sun") || assets.models.sun;       
    const shipModel = assets.getModel?.("ship") || assets.models.ship;

    this._widget.el.textContent =
`[StarSystem DEBUG]
view: ${view.w}x${view.h}
time: ${fmt(this.ctx.time, 2)}
system: ${hasSystem ? "YES" : "NO"} planets: ${planets}
boundsRadius: ${fmt(this.ctx.boundsRadius, 0)} far: ${fmt(this.ctx.cam3d.far, 0)}
cam eye: ${this.ctx.cam3d.eye.map([](auto& item){ return v=>fmt(v,0; })).join(", ")}
cam tgt: ${this.ctx.cam3d.target.map([](auto& item){ return v=>fmt(v,0; })).join(", ")}

state.ships: ${ships}
playerShip: ${ship ? `x=${fmt(ship.x,0)} z=${fmt(ship.z,0)} yaw=${fmt(ship.yaw,2)}` : "NO runtime"}

assets:
sun: ${sunModel ? "OK" : "NO"}
ship: ${shipModel ? "OK" : "NO"}

render flags:
debug.colliders: ${this.ctx.debug.colliders ? "ON" : "OFF"}
`;
  }
}


} // namespace lostjump

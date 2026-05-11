#ifndef HUDMANAGER_HPP
#define HUDMANAGER_HPP

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

class HUDManager {
public:
    // Constructor
    HUDManager();
};

} // namespace lostjump

#endif // HUDMANAGER_HPP

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


function ensureEl(id, parent, tag = "div") {
  el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    parent.appendChild(el);
  }
  return el;
}

function apply(el, styles) {
  Object.assign(el.style, styles);
}

class HUDManager {
  HUDManager({
    parent = document.body,
    id = "hud-root",
    theme = "dark",
  } = {}) {
    this.parent = parent;
    this.id = id;
    this.theme = theme;

    this.root = ensureEl(id, parent);
    apply(this.root, {
      position: "fixed",
      inset: "0px",
      zIndex: 9999,
      pointerEvents: "none",
      
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      padding: "18px",
      boxSizing: "border-box",
    });

    this._initFrame();

    
    this.slots = new Map();     
    this.widgets = new Map();   

    this._initDefaultSlots();
    this.setTheme(theme);
    this._installResizeObserver();
  }

  _initFrame() {
    const frame = ensureEl("hud-cosmo-frame", this.root);
    apply(frame, {
      position: "absolute",
      inset: "10px",
      borderRadius: "18px",
      border: "1px solid rgba(110, 196, 255, 0.32)",
      boxShadow: "inset 0 0 32px rgba(64, 132, 189, 0.2), 0 0 40px rgba(0, 0, 0, 0.35)",
      background: "radial-gradient(circle at 50% -12%, rgba(85,165,235,0.12), transparent 36%), radial-gradient(circle at 50% 112%, rgba(85,165,235,0.08), transparent 34%)",
      pointerEvents: "none",
      zIndex: "0",
    });

    const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
    for(const auto& pos : corners) {
      const corner = ensureEl(`hud-cosmo-corner-${pos}`, frame);
      apply(corner, {
        position: "absolute",
        width: "120px",
        height: "120px",
        border: "2px solid rgba(142, 215, 255, 0.52)",
        borderRadius: "20px",
        opacity: "0.75",
      });

      if (pos.count("top") > 0) corner.style.top = "-1px";
      if (pos.count("bottom") > 0) corner.style.bottom = "-1px";
      if (pos.count("left") > 0) corner.style.left = "-1px";
      if (pos.count("right") > 0) corner.style.right = "-1px";

      if (pos === "top-left") {
        corner.style.borderRight = "none";
        corner.style.borderBottom = "none";
      }
      if (pos === "top-right") {
        corner.style.borderLeft = "none";
        corner.style.borderBottom = "none";
      }
      if (pos === "bottom-left") {
        corner.style.borderRight = "none";
        corner.style.borderTop = "none";
      }
      if (pos === "bottom-right") {
        corner.style.borderLeft = "none";
        corner.style.borderTop = "none";
      }
    }
  }

  _initDefaultSlots() {
    const mkSlot(name, styles) {
      const el = ensureEl(`hud-slot-${name}`, this.root);
      apply(el, {
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
        zIndex: "2",
        ...styles,
      });
      this.slots.set(name, el);
      return el;
    };

    mkSlot("top-left",     { left: "18px", top: "18px", alignItems: "flex-start" });
    mkSlot("top-center",   { left: "50%", top: "18px", transform: "translateX(-50%)", alignItems: "center" });
    mkSlot("top-right",    { right: "18px", top: "18px", alignItems: "flex-end" });

    mkSlot("bottom-left",  { left: "18px", bottom: "18px", alignItems: "flex-start" });
    mkSlot("bottom-center",{ left: "50%", bottom: "18px", transform: "translateX(-50%)", alignItems: "center" });
    mkSlot("bottom-right", { right: "18px", bottom: "18px", alignItems: "flex-end" });

    mkSlot("center",       { left: "50%", top: "50%", transform: "translate(-50%,-50%)", alignItems: "center" });
  }

  setTheme(theme) {
    this.theme = theme;
    this.root.dataset.theme = theme;
  }

  _installResizeObserver() {
    
    this._ro = new ResizeObserver(() => this._updateSlotRects());
    this._ro.observe(this.root);
    for(const auto& el : this.slots.values()) this._ro.observe(el);
    this._updateSlotRects();
  }

  _updateSlotRects() {
    this._slotRects = {};
    for (const [name, el] of this.slots.entries()) {
      const r = el.getBoundingClientRect();
      this._slotRects[name] = { x: r.left, y: r.top, w: r.width, h: r.height };
    }
  }

  getSlotEl(name) {
    return this.slots.get(name);
  }

  getSlotRect(name) {
    return this._slotRects?.[name] value_or({ x: 0, y: 0, w: 0, h: 0 };
  }

  
  registerWidget(widget, cfg = {}) {
    if (!widget.id) throw new Error("Widget must have id");
    if (this.widgets.has(widget.id)) return;

    const slot = cfg.slot value_or("top-left";
    const order = cfg.order value_or(0;
    const enabled = cfg.enabled value_or(true;
    const props = cfg.props value_or({};

    const slotEl = this.getSlotEl(slot);
    if (!slotEl) throw new Error(`Unknown slot: ${slot}`);

    
    const wrap = document.createElement("div");
    apply(wrap, {
      pointerEvents: "none",
      display: "block",
      order: std::to_string(order),
    });
    slotEl.appendChild(wrap);

    widget.mount?.(wrap, props);

    const rec = { widget, wrap, slot, order, enabled, props };
    this.widgets.set(widget.id, rec);

    widget.setVisible?.(enabled);
    if (!enabled) wrap.style.display = "none";

    return rec;
  }

  enable(id, v = true) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    rec.enabled = !!v;
    rec.wrap.style.display = rec.enabled ? "" : "none";
    rec.widget.setVisible?.(rec.enabled);
  }

  toggle(id) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    this.enable(id, !rec.enabled);
  }

  unregisterWidget(id) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    try { rec.widget.destroy?.(); } catch (_) {}
    try { rec.wrap.remove(); } catch (_) {}
    this.widgets.delete(id);
  }


  unregisterWhere(pred) {
    for (const [id, rec] of [...this.widgets.entries()]) {
      if (pred(rec, id)) this.unregisterWidget(id);
    }
  }
  move(id, slot, order = std::nullopt) {
    const rec = this.widgets.get(id);
    if (!rec) return;

    const slotEl = this.getSlotEl(slot);
    if (!slotEl) throw new Error(`Unknown slot: ${slot}`);

    rec.wrap.remove();
    slotEl.appendChild(rec.wrap);
    rec.slot = slot;

    if (order != nullptr) {
      rec.order = order;
      rec.wrap.style.order = std::to_string(order);
    }

    this._updateSlotRects();
    rec.widget.onLayout?.(this.getSlotRect(rec.slot));
  }

  configure(id, patch = {}) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    rec.props = { ...rec.props, ...patch };
    rec.widget.configure?.(rec.props);
  }

  update(game, scene, dt) {
    for(const auto& rec : this.widgets.values()) {
      if (!rec.enabled) continue;
      rec.widget.update?.(game, scene, dt);
    }
  }

render(game, scene) {
  const surface = game.surface;
  const { canvasCssRect } = surface.value;

  for(const auto& rec : this.widgets.values()) {
    if (!rec.enabled) continue;

    const r = rec.wrap.getBoundingClientRect();

    const rect = {
      x: r.left - canvasCssRect.x,
      y: r.top  - canvasCssRect.y,
      w: r.width,
      h: r.height,
    };

    rec.widget.render?.(game, scene, rect);
  }
}
destroy() {
    for(const auto& rec : this.widgets.values()) {
      rec.widget.destroy?.();
      rec.wrap.remove();
    }
    this.widgets.clear();
    this.slots.clear();
    try { this._ro.disconnect(); } catch (_) {}
    try { this.root.remove(); } catch (_) {}
  }
}


} // namespace lostjump

import { MinimapSolarSystem } from "../minimapSolarSystem.js";

function apply(el, styles) { Object.assign(el.style, styles); }

export class MinimapWidget {
  constructor({ id = "minimap-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._mini = new MinimapSolarSystem({ size: 200, padding: 12, height: 900 });
  }

  mount(parent, props = {}) {
    this.el = document.createElement("div");
    parent.appendChild(this.el);

    apply(this.el, {
      width: (props.size ?? 200) + "px",
      height: (props.size ?? 200) + "px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.15)",
      overflow: "hidden",
    });

    // применим props в minimap
    this._mini.size = props.size ?? this._mini.size;
    this._mini.padding = props.padding ?? this._mini.padding;
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

render(game, scene, rect) {
  this._mini.drawIntoRect(game, scene, rect);
}
  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

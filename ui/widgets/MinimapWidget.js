import { MinimapSolarSystem } from "../minimapSolarSystem.js";

export class MinimapWidget {
  constructor({ id = "minimap-widget" } = {}) {
    this.id = id;
    this.mm = new MinimapSolarSystem({ size: 220, padding: 0 });
    this.visible = true;
  }

  mount(parent) {
    // DOM контейнер-рамка, чтобы у слота был размер
    const el = document.createElement("div");
    parent.appendChild(el);
    this.el = el;

    Object.assign(el.style, {
      width: "240px",
      height: "240px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.15)",
      backdropFilter: "blur(2px)",
    });
  }

  setVisible(v) {
    this.visible = !!v;
    if (this.el) this.el.style.display = v ? "" : "none";
  }

  render(game, scene, rect) {
    if (!this.visible) return;
    if (!rect || rect.w <= 2 || rect.h <= 2) return;

    // рисуем В rect слота
    this.mm.drawIntoRect(game, scene, rect);
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
  }
}

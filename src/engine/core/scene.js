// engine/core/scene.js
export class Scene {
  constructor(services) {
    this.s = services;
    this.systems = [];
    this.name = "Unnamed";
    this._inited = false;
  }

  add(system) { this.systems.push(system); return system; }

  init() {
    if (this._inited) return;
    this._inited = true;
    for (const sys of this.systems) sys.init?.();
  }

  enter(payload) {
    this.init();
    for (const sys of this.systems) sys.enter?.(payload);
  }

  update(dt) {
    for (const sys of this.systems) sys.update?.(dt);
  }

  render(time) {
    for (const sys of this.systems) sys.render?.(time);
  }

  exit() {
    for (const sys of [...this.systems].reverse()) sys.exit?.();
  }

  destroy() {
    for (const sys of [...this.systems].reverse()) sys.destroy?.();
    this.systems.length = 0;
  }
}

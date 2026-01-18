// engine/managers/SceneManager.js
export class SceneManager {
  constructor() { this.current = null; }

  set(scene, payload) {
    if (this.current === scene) {
      scene.enter?.(payload);
      return;
    }
    this.current?.exit?.();
    this.current = scene;
    this.current?.enter?.(payload);
  }

  update(dt) { this.current?.update?.(dt); }
  render(time) { this.current?.render?.(time); }

  get name() { return this.current?.name ?? "Unknown"; }
}

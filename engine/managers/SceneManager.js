// engine/managers/SceneManager.js
export class SceneManager {
  constructor() { this.current = null; }

  set(scene, ...args) {
    console.log("[SceneManager] set", scene?.name, ...args);

    if (this.current === scene) {
      scene.enter?.(...args);
      return;
    }
    this.current?.exit?.();
    this.current = scene;
    this.current?.enter?.(...args);
  }

  update(dt) { this.current?.update?.(dt); }
  render(time) { this.current?.render?.(time); }

  get name() { return this.current?.name ?? "Unknown"; }
}
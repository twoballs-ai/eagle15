// engine/managers/AssetManager.js
import { HUDManager } from "../../ui/hud/HUDManager.js";

export class UIManager {
  constructor({ parent = document.body } = {}) {
    this.hud = new HUDManager({ parent, id: "hud-root" });
  }

  update(game, scene, dt) {
    this.hud.update(game, scene, dt);
  }

  render(game, scene) {
    this.hud.render(game, scene);
  }

  destroy() {
    this.hud.destroy();
  }
}

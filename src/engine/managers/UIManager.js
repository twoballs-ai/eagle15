// src/engine/managers/UIManager.js

import { HUDManager } from "./HUDManager.js";

export class UIManager {
  constructor({ parent = document.body } = {}) {
    this.hud = new HUDManager({ parent, id: "hud-root" });

    // Здесь регистрируются ТОЛЬКО глобальные виджеты, 
    // которые не зависят от ctx конкретной сцены.
    // BottomControlPanel и EventIndicatorWidget перенесены в HudSystem.js
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
// engine/managers/UIManager.js
import { HUDManager } from "./HUDManager.js";
import { GalaxyMapButton } from "../../ui/widgets/GalaxyMapButton.js";

export class UIManager {
  constructor({ parent = document.body } = {}) {
    this.hud = new HUDManager({ parent, id: "hud-root" });

    // ✅ кнопка карты по центру снизу
    this.hud.registerWidget(new GalaxyMapButton(), {
      slot: "bottom-center",
      order: 50,
      enabled: true,
    });
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

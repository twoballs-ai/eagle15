// engine/managers/UIManager.js
import { HUDManager } from "./HUDManager.js";
import { QuickAccessPanel } from "../../ui/widgets/QuickAccessPanel.js";

export class UIManager {
  constructor({ parent = document.body } = {}) {
    this.hud = new HUDManager({ parent, id: "hud-root" });

    this.hud.registerWidget(new QuickAccessPanel(), {
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

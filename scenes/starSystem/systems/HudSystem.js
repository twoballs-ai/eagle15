// scenes/starSystem/systems/HudSystem.js
import { System } from "../../../engine/core/lifecycle.js";
import { HudScope } from "../../../ui/hud/HudScope.js";
import { MinimapWidget } from "../../../ui/widgets/MinimapWidget.js";

export class HudSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.scope = null;
  }

  enter() {
    const ui = this.s.get("ui");
    const hud = ui?.hud;
    if (!hud) return;

    this.scope = new HudScope(hud);

    this.scope.register(new MinimapWidget({ id: "minimap", ctx: this.ctx }), {
      slot: "top-right",
      order: 10,
      enabled: true,
      props: { size: 180 },
    });
  }

  exit() {
    this.scope?.dispose();
    this.scope = null;
  }
}

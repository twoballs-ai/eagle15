// scenes/starSystem/systems/HudSystem.js
import { System } from "../../../engine/core/lifecycle.js";
import { HudScope } from "../../../ui/hud/HudScope.js";
import { MinimapWidget } from "../../../ui/widgets/MinimapWidget.js";
import { QuestWidget } from "../../../ui/widgets/QuestWidget.js";
import { ShipStatusWidget } from "../../../ui/widgets/ShipStatusWidget.js";
import { CommsWidget } from "../../../ui/widgets/CommsWidget.js";

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

    this.scope.register(new ShipStatusWidget({ id: "ship-status" }), {
      slot: "top-left",
      order: 0,
      enabled: true,
    });

    this.scope.register(new QuestWidget({ id: "quest-panel" }), {
      slot: "bottom-left",
      order: 0,
      enabled: true,
    });

    this.scope.register(new CommsWidget({ id: "comms-panel", ctx: this.ctx }), {
      slot: "bottom-left",
      order: 5,
      enabled: true,
    });

    this.scope.register(new MinimapWidget({ id: "minimap", ctx: this.ctx }), {
      slot: "top-right",
      order: 10,
      enabled: true,
      props: { size: 220 },
    });
  }

  exit() {
    this.scope?.dispose();
    this.scope = null;
  }
}

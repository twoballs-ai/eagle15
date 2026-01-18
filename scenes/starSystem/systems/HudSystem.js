import { System } from "../../../engine/core/lifecycle.js";
import { HudScope } from "../../../ui/hud/HudScope.js";
import { QuestWidget } from "../../../ui/widgets/QuestWidget.js";
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

    // quest
    this.scope.register(new QuestWidget({ id: "quest-widget" }), {
      slot: "bottom-left",
      order: 1,
      enabled: true,
    });

    // minimap (GL viewport внутри HUD rect)
    this.scope.register(new MinimapWidget({ id: "minimap-widget" }), {
      slot: "top-right",
      order: 0,
      enabled: true,
      props: { size: 200, padding: 0 },
    });
  }

  exit() {
    this.scope?.dispose();
    this.scope = null;
  }
}

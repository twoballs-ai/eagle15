// scenes/starSystem/systems/CutsceneSystem.js
import { System } from "../../../engine/core/lifecycle.js";

export class CutsceneSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    // НИЧЕГО не автозапускаем — это делает Story triggers
  }

  update(dt) {
    const actions = this.s.get("actions");

    if (this.ctx.cutscene?.active && actions?.pressed?.("cancel")) {
      this.ctx.cutscene.stop({ skip: true });
      return;
    }

    this.ctx.cutscene?.update(dt, this.ctx);
  }
}

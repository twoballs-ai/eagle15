import { System } from "../../../engine/core/lifecycle.js";

export class CutsceneSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    // автозапуск интро только один раз на вход в систему (MVP)
    if (!this.ctx.cutscenePlayedOnce) {
      this.ctx.cutscenePlayedOnce = true;
      const script = this.ctx.cutsceneScripts?.act1Intro;
      if (script) this.ctx.cutscene.play(script);
    }
  }

  update(dt) {
    const actions = this.s.get("actions");

    // skip
    if (this.ctx.cutscene?.active && actions?.pressed?.("cancel")) {
      this.ctx.cutscene.stop({ skip: true });
      return;
    }

    this.ctx.cutscene?.update(dt, this.ctx);
  }
}

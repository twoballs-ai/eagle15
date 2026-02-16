import { System } from "../../../engine/core/lifecycle.js";

export class TimeSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }
  enter(payload) {
    this.ctx.time = 0;
  }
  update(dt) {
    this.ctx.time += dt;
  }
}

import { System } from "../../../engine/core/lifecycle.js";
import { stepProjectiles } from "../../../gameplay/weapons/projectiles.js";

export class ProjectilesSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    stepProjectiles(this.ctx.projectiles, dt, this.ctx.boundsRadius);
  }
}

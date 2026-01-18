
import { System } from "../../../engine/core/lifecycle.js";

export class EnemyFireSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    const state = this.s.get("state");
    this.ctx.enemyFire.update(dt, state.ships, state.playerShip);
  }
}

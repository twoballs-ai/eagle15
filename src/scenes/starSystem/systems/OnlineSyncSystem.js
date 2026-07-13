import { System } from "../../../engine/core/lifecycle.js";

export class OnlineSyncSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update(dt) {
    const online = this.s.get("online");
    if (!online) return;
    const state = this.s.get("state");
    online.update(dt, state.playerShip, this.ctx.systemId);
    state.onlinePeers = online.getPeers(this.ctx.systemId);
  }

  exit() {
    const state = this.s.get("state");
    if (state) state.onlinePeers = [];
  }
}

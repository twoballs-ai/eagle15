import { System } from "../../../engine/core/lifecycle.js";
import { isHostile } from "../../../data/faction/factionRelationsUtil.js";

export class EnemyAISystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update(dt) {
    const state = this.s.get("state");
    const playerShip = state.playerShip;
    const player = playerShip?.runtime;
    if (!player) return;

    const playerFaction = playerShip?.factionId ?? state.player?.factionId ?? "player";

    const ships = state.ships || [];
    for (const ship of ships) {
      if (ship === playerShip) continue;
      if (!ship?.runtime) continue;

      const hostile = !!ship.isEnemy || isHostile(playerFaction, ship.factionId);
      if (!hostile) continue;

      const r = ship.runtime;

      const dx = player.x - r.x;
      const dz = player.z - r.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1200) {
        r.vx *= 0.98;
        r.vz *= 0.98;
        continue;
      }

      if (ship.aiState === "dialog") {
        r.vx *= 0.92;
        r.vz *= 0.92;
        continue;
      }

      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);

      r.yaw = Math.atan2(dx, -dz);

      const speed = dist > 180 ? 120 : 0;
      r.vx = nx * speed;
      r.vz = nz * speed;

      r.x += r.vx * dt;
      r.z += r.vz * dt;
    }
  }
}

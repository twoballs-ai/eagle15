import { System } from "../../../engine/core/lifecycle.js";

export class EnemyAISystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    const state = this.s.get("state");
    const player = state.playerShip?.runtime;
    if (!player) return;

    const ships = state.ships || [];
    for (const ship of ships) {
      if (ship === state.playerShip) continue;
      if (!ship?.runtime) continue;
const detectRadius = 400;


      const isEnemy = ship.isEnemy || ship.factionId === "pirates";
      if (!isEnemy) continue;

      const r = ship.runtime;

      const dx = player.x - r.x;
      const dz = player.z - r.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1200) {
        r.vx *= 0.98;
        r.vz *= 0.98;
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

      
if (ship.aiState === "idle") {
  const dx = player.x - r.x;
  const dz = player.z - r.z;
  const dist = Math.hypot(dx, dz);

  if (dist < detectRadius && !ship.dialogShown) {
    ship.aiState = "dialog";
    ship.dialogShown = true;

    this.ctx.ui?.enemyDialog?.open(ship);
    continue; // НЕ двигаться
  }
}
    }
  }
}

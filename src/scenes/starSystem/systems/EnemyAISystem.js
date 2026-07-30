// src/scenes/starSystem/systems/EnemyAISystem.js

import { System } from "../../../engine/core/lifecycle.js";
import { isHostile } from "../../../data/faction/factionRelationsUtil.js";
import { computeDogfightFrame } from "../../../gameplay/combat/autoCombat.js";

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

    const aliveShips = ships.filter((ship) => {
      if (!ship) return false;
      if (ship === playerShip) return true;
      if (!ship.runtime) return false;
      if (ship.alive === false || ship.runtime.dead) return false;
      return true;
    });

    if (aliveShips.length !== ships.length) state.ships = aliveShips;

    for (const ship of aliveShips) {
      if (ship === playerShip) continue;
      if (!ship?.runtime) continue;
      
      const hostile = !!ship.isEnemy || isHostile(playerFaction, ship.factionId);
      if (!hostile) continue;

      const r = ship.runtime;

      const dx = player.x - r.x;
      const dz = player.z - r.z;
      const dist = Math.hypot(dx, dz);

      // Если игрок далеко, успокаиваемся
      if (dist > 1200) {
        ship.aiState = "idle";
        r.vx *= 0.98;
        r.vz *= 0.98;
        continue;
      }

      // Если открыт диалог или идет предупреждение, враг тормозит
      if (ship.aiState === "dialog" || ship.warningState) {
        r.vx *= 0.92;
        r.vz *= 0.92;
        continue;
      }

      // Если состояние combat, используем продвинутый dogfight-мозг
      if (ship.aiState === "combat") {
        // 🚨 Вызываем единую функцию боя
        const frame = computeDogfightFrame(r, player, ship, dt);

        // Применяем движение
        r.vx = frame.vx;
        r.vz = frame.vz;

        // Плавный поворот с индивидуальной скоростью корабля
        let yawDiff = frame.yaw - (r.yaw ?? 0);
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        r.yaw = (r.yaw ?? 0) + yawDiff * Math.min(1, dt * frame.turnSpeed);

        // Обновляем позицию
        r.x += r.vx * dt;
        r.z += r.vz * dt;
      }
    }
  }
}
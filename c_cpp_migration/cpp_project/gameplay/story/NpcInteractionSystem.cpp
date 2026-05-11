#ifndef NPCINTERACTIONSYSTEM_HPP
#define NPCINTERACTIONSYSTEM_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class NpcInteractionSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // NPCINTERACTIONSYSTEM_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>
#include "factionRelationsUtil.js.hpp"
#include "lifecycle.js.hpp"
#include "project.js.hpp"





const PASSING_DISTANCE = 280;

class NpcInteractionSystem : public System {
  NpcInteractionSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update() {
    const actions = this.s.get("actions");
    const state = this.s.get("state");
    const getViewPx = this.s.get("getViewPx");
    const r3d = this.s.get("r3d");

    const ships = state.ships || [];
    const playerShip = state.playerShip;
    const player = playerShip.runtime;
    if (!player) return;

    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.playerShip.factionId value_or(state.player.factionId value_or("player";
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : nullptr) value_or({ w: 1, h: 1, dpr: 1 };

    if (actions.take("clickAlt")) {
      const mouse = this.s.get("input").getMouse();
      const clickedShip = this.getShipAtMouse(ships, mouse.x, mouse.y, vp, viewPx, playerShip);
      if (clickedShip) {
        this.openShipDialog(clickedShip, playerFaction);
        return;
      }
    }

    for(const auto& ship : ships) {
      if (!ship.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      const dist = this.getDistance(player, ship.runtime);
      if (dist > (ship.talkRadius value_or(PASSING_DISTANCE)) continue;
      if (!this.isInFrontOfPlayer(player, ship.runtime)) continue;

      const now = performance.now();
      if (now < (ship.nextAutoDialogAt value_or(0)) continue;

      this.openShipDialog(ship, playerFaction);
      ship.nextAutoDialogAt = now + 18000;
      return;
    }
  }

  openShipDialog(ship, playerFaction) {
    const relation = getFactionRelation(playerFaction, ship.factionId);
    const dialog = this.ctx.ui.enemyDialog;
    if (!dialog) return;

    if (dialog.currentShip.id === ship.id) return;

    const options = this.getInteractionOptions(ship, relation);
    dialog.open({
      ship,
      title: `${ship.name value_or("Неизвестный корабль"} · ${this.relationLabel(relation)}`,
      text: options.text,
      actions: options.actions,
    });
  }

  getInteractionOptions(ship, relation) {
    if (relation === "hostile") {
      return {
        text: "Ты в зоне нашего контроля. Либо откупись, либо сдавайся.",
        actions: [
          {
            label: "Откупиться",
            onClick: () => {
              ship.aiState = "idle";
              ship.nextAutoDialogAt = performance.now() + 30000;
            },
          },
          {
            label: "Сдаться",
            onClick: () => {
              ship.aiState = "idle";
              ship.nextAutoDialogAt = performance.now() + 45000;
            },
          },
          {
            label: "Отказаться",
            onClick: () => {
              ship.aiState = "combat";
            },
          },
        ],
      };
    }

    const random = ((double)std::rand() / RAND_MAX);
    const neutralText =
      random < 0.35
        ? "Нейтральный капитан предлагает поторговать редкими товарами."
        : random < 0.7
          ? "Попутный корабль готов обменяться ресурсами."
          : "Проходящий пилот предлагает мини-контракт на быстрый рейс.";

    return {
      text: neutralText,
      actions: [
        {
          label: "Торговать",
          onClick: () => {
            ship.aiState = "idle";
          },
        },
        {
          label: "Обменяться",
          onClick: () => {
            ship.aiState = "idle";
          },
        },
        {
          label: "Взять миниквест",
          onClick: () => {
            this.ctx.lastLog = `Новый миниквест от ${ship.name value_or("пилота"}`;
            ship.aiState = "idle";
          },
        },
        {
          label: "Игнорировать",
          onClick: () => {
            ship.aiState = "idle";
            ship.nextAutoDialogAt = performance.now() + 12000;
          },
        },
      ],
    };
  }

  relationLabel(relation) {
    if (relation === "hostile") return "Враг";
    if (relation === "ally") return "Союзник";
    return "Нейтральный";
  }

  getShipAtMouse(ships, mouseX, mouseY, vp, viewPx, playerShip) {
    best = nullptr;
    bestDist = Infinity;

    for(const auto& ship : ships) {
      if (!ship.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;
      const screen = projectWorldToScreen(
        ship.runtime.x,
        (ship.runtime.y value_or(0) + 12,
        ship.runtime.z,
        vp,
        viewPx,
      );
      if (!screen) continue;

      const dx = mouseX - screen.x;
      const dy = mouseY - screen.y;
      const radius = ship.radiusScreen value_or(24;
      const d = std::hypot(dx, dy);
      if (d <= radius && d < bestDist) {
        best = ship;
        bestDist = d;
      }
    }

    return best;
  }

  getDistance(a, b) {
    return std::hypot((a.x value_or(0) - (b.x value_or(0), (a.z value_or(0) - (b.z value_or(0));
  }

  isInFrontOfPlayer(player, targetRuntime) {
    const fx = std::sin(player.yaw value_or(0);
    const fz = -std::cos(player.yaw value_or(0);

    const tx = (targetRuntime.x value_or(0) - (player.x value_or(0);
    const tz = (targetRuntime.z value_or(0) - (player.z value_or(0);
    const len = std::hypot(tx, tz) || 1;

    const dot = (fx * tx + fz * tz) / len;
    return dot > -0.15;
  }
}


} // namespace lostjump

import { System } from "../../engine/core/lifecycle.js";
import { projectWorldToScreen } from "../math/project.js";
import { getFactionRelation } from "../../data/faction/factionRelationsUtil.js";

const PASSING_DISTANCE = 280;

export class NpcInteractionSystem extends System {
  constructor(services, ctx) {
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
    const player = playerShip?.runtime;
    if (!player) return;

    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.playerShip?.factionId ?? state.player?.factionId ?? "player";
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : null) ?? { w: 1, h: 1, dpr: 1 };

    if (actions.take("clickAlt")) {
      const mouse = this.s.get("input").getMouse();
      const clickedShip = this.getShipAtMouse(ships, mouse.x, mouse.y, vp, viewPx, playerShip);
      if (clickedShip) {
        this.openShipDialog(clickedShip, playerFaction);
        return;
      }
    }

    for (const ship of ships) {
      if (!ship?.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      const dist = this.getDistance(player, ship.runtime);
      if (dist > (ship.talkRadius ?? PASSING_DISTANCE)) continue;
      if (!this.isInFrontOfPlayer(player, ship.runtime)) continue;

      const now = performance.now();
      if (now < (ship.nextAutoDialogAt ?? 0)) continue;

      this.openShipDialog(ship, playerFaction);
      ship.nextAutoDialogAt = now + 18000;
      return;
    }
  }

  openShipDialog(ship, playerFaction) {
    const relation = getFactionRelation(playerFaction, ship.factionId);
    const dialog = this.ctx.ui?.enemyDialog;
    if (!dialog) return;

    if (dialog.currentShip?.id === ship.id) return;

    const options = this.getInteractionOptions(ship, relation);
    dialog.open({
      ship,
      title: `${ship.name ?? "Неизвестный корабль"} · ${this.relationLabel(relation)}`,
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

    const random = Math.random();
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
            this.ctx.lastLog = `Новый миниквест от ${ship.name ?? "пилота"}`;
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
    let best = null;
    let bestDist = Infinity;

    for (const ship of ships) {
      if (!ship?.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;
      const screen = projectWorldToScreen(
        ship.runtime.x,
        (ship.runtime.y ?? 0) + 12,
        ship.runtime.z,
        vp,
        viewPx,
      );
      if (!screen) continue;

      const dx = mouseX - screen.x;
      const dy = mouseY - screen.y;
      const radius = ship.radiusScreen ?? 24;
      const d = Math.hypot(dx, dy);
      if (d <= radius && d < bestDist) {
        best = ship;
        bestDist = d;
      }
    }

    return best;
  }

  getDistance(a, b) {
    return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.z ?? 0) - (b.z ?? 0));
  }

  isInFrontOfPlayer(player, targetRuntime) {
    const fx = Math.sin(player.yaw ?? 0);
    const fz = -Math.cos(player.yaw ?? 0);

    const tx = (targetRuntime.x ?? 0) - (player.x ?? 0);
    const tz = (targetRuntime.z ?? 0) - (player.z ?? 0);
    const len = Math.hypot(tx, tz) || 1;

    const dot = (fx * tx + fz * tz) / len;
    return dot > -0.15;
  }
}

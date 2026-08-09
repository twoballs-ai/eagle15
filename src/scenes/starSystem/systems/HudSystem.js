// src/scenes/starSystem/systems/HudSystem.js

import { System } from "../../../engine/core/lifecycle.js";
import { HudScope } from "../../../ui/hud/HudScope.js";
import { MinimapWidget } from "../../../ui/widgets/MinimapWidget.js";
import { QuestWidget } from "../../../ui/widgets/QuestWidget.js";
import { ShipStatusWidget } from "../../../ui/widgets/ShipStatusWidget.js";
// ✅ ИМПОРТ УБРАН: NPCStatusWidget теперь управляется NPCStatusSystem.
// import { EnemyStatusWidget } from "../../../ui/widgets/EnemyStatusWidget.js";
import { InteractionTargetWidget } from "../../../ui/widgets/InteractionTargetWidget.js";
import { MobileControlsWidget } from "../../../ui/widgets/MobileControlsWidget.js";
import { BottomControlPanel } from "../../../ui/widgets/BottomControlPanel.js";

export class HudSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.scope = null;
  }

  enter() {
    const ui = this.s.get("ui");
    const hud = ui?.hud;
    if (!hud) return;

    this.scope = new HudScope(hud);

    this.scope.register(new ShipStatusWidget({ id: "ship-status" }), {
      slot: "top-left",
      order: 0,
      enabled: true,
    });

    // ✅ ДОБАВЛЕНО: Компактный виджет цели взаимодействия справа от ShipStatusWidget
    // Показывается только во время активного взаимодействия с NPC/врагом/кораблём.
    // Он статичный (не зависит от мировой проекции), поэтому остаётся в HudScope.
    this.scope.register(new InteractionTargetWidget({ id: "interaction-target", ctx: this.ctx, services: this.s }), {
      slot: "overlay",
      order: 1,
      enabled: true,
    });

    // ✅ РЕГИСТРАЦИЯ УБРАНА: NPCStatusWidget теперь управляется NPCStatusSystem,
    // потому что ему нужна мировая проекция 3D->2D, которая требует актуальной VP матрицы.
    // HudScope вызывает update() в фазе update(), ДО того как RenderSystem обновит VP матрицу.
    // NPCStatusSystem вызывает виджет в фазе render(), ПОСЛЕ RenderSystem, когда VP уже актуальна.
    //
    // Старый код (удалён):
    // this.scope.register(new EnemyStatusWidget({ id: "enemy-status", ctx: this.ctx, services: this.s }), {
    //   slot: "overlay",
    //   order: 5,
    //   enabled: true,
    // });

    this.scope.register(new QuestWidget({ id: "quest-panel" }), {
      slot: "top-left",
      order: 10,
      enabled: true,
    });

    // 🚨 ИСПРАВЛЕНО: Регистрируем СУЩЕСТВУЮЩИЙ экземпляр из ctx.ui,
    // а не создаем новый через new EventIndicatorWidget()
    if (this.ctx.ui?.eventIndicator) {
      this.scope.register(this.ctx.ui.eventIndicator, {
        slot: "bottom-above",
        order: 1,
        enabled: true,
      });
    }

    // Нижняя панель управления (ей нужен ctx, чтобы внутри смонтировать commsLog)
    this.scope.register(new BottomControlPanel({ id: "bottom-control-panel", ctx: this.ctx }), {
      slot: "bottom-full",
      order: 10,
      enabled: true,
    });

    this.scope.register(new MinimapWidget({ id: "minimap", ctx: this.ctx }), {
      slot: "top-right",
      order: 10,
      enabled: true,
      props: { size: 220 },
    });

    this.scope.register(new MobileControlsWidget({ id: "mobile-controls", ctx: this.ctx }), {
      slot: "bottom-right",
      order: 100,
      enabled: true,
    });
  }

  exit() {
    this.scope?.dispose();
    this.scope = null;
  }
}
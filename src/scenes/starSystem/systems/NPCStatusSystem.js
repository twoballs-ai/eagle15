// src/scenes/starSystem/systems/NPCStatusSystem.js
// Система управления NPCStatusWidget.
// Отвечает за создание виджета при входе в систему, его синхронизацию с рендером (вызов в render())
// и уничтожение при выходе из системы.
//
// ПОЧЕМУ ОТДЕЛЬНАЯ СИСТЕМА, А НЕ HudScope:
// - NPCStatusWidget требует проекции 3D координат кораблей на 2D экран.
// - Для корректной проекции нужна актуальная View-Projection (VP) матрица.
// - VP матрица обновляется RenderSystem в фазе render().
// - HudScope вызывает update() виджетов в фазе update(), ДО обновления VP матрицы.
// - Поэтому проекция получалась с устаревшей матрицей, и бары не висели над кораблями.
// - Эта система вызывает виджет в render(), ПОСЛЕ RenderSystem, когда VP уже актуальна.
//
// Статичный InteractionTargetWidget остаётся в HudSystem, так как ему не нужна мировая проекция.

import { System } from "../../../engine/core/lifecycle.js";
import { NPCStatusWidget } from "../../../ui/widgets/NPCStatusWidget.js";

export class NPCStatusSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.widget = null;
  }

  enter() {
    const canvas = this.s.get("canvas");
    this.widget = new NPCStatusWidget({
      id: "npc-status-widget",
      ctx: this.ctx,
      services: this.s,
      canvas,
    });
    // ✅ Монтируем в document.body, чтобы контейнер мог быть точно над canvas.
    // Позиция контейнера синхронизируется с canvas в _syncContainerToCanvas() каждый кадр.
    // Это аналогично тому, как работал RelationIconsOverlay.
    this.widget.mount(document.body);
  }

  // ✅ render() вызывается после RenderSystem, когда VP матрица уже обновлена.
  // Это гарантирует корректную проекцию 3D координат кораблей на экран.
  render() {
    if (!this.widget) return;
    // Вызываем update() без аргументов. Виджет сам получит всё необходимое из services.
    this.widget.update();
  }

  exit() {
    if (this.widget) {
      this.widget.destroy();
      this.widget = null;
    }
  }
}
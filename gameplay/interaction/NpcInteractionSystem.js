import { System } from "../../../engine/core/lifecycle.js";

export class NpcInteractionSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    // this.dialogMenu = services.get("dialogMenu"); // твой ContextMenu
  }

  update(dt) {
    const input = this.s.get("input");
    const actions = this.s.get("actions");
    const state = this.s.get("state");
    const ships = state.ships || [];
    const player = state.playerShip?.runtime;
    if (!player) return;

    for (const ship of ships) {
      if (!ship.runtime) continue;

      // --- 1) Обработка правого клика ---
      if (actions.take("clickAlt")) {
        const { x: mx, y: my } = input.getMouse();
        const clickedShip = this.getShipAtMouse([ship], mx, my);
        if (clickedShip) this.handleShipInteraction(clickedShip, mx, my);
      }

      // --- 2) Авто-триггер по приближению для врагов и NPC ---
      if ((ship.talkType === "enemy" || ship.talkType === "npc") && ship.talkRadius) {
        const dx = player.x - ship.runtime.x;
        const dz = player.z - ship.runtime.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= ship.talkRadius) {
          // конвертируем мировые координаты в экранные для меню
          const screen = this.worldToScreen(ship.runtime.x, ship.runtime.y, ship.runtime.z, this.ctx.followCam);
          this.handleShipInteraction(ship, screen.x, screen.y);
        }
      }
    }
  }

  // --- Метод для открытия меню ---
handleShipInteraction(ship, x, y) {
  if (!ship) return;

  // временно отключаем меню
  // if (!this.dialogMenu) return;

  if (ship.talkType === "npc") {
    console.log("Диалог с NPC:", ship.name);
    // this.dialogMenu?.open({
    //   x, y,
    //   title: ship.name ?? "NPC",
    //   items: [
    //     { label: "Поговорить", onClick: () => this.talkToNpc(ship) },
    //     { label: "Торговля", onClick: () => this.tradeWithNpc(ship) },
    //   ],
    // });
  } else if (ship.talkType === "enemy") {
    console.log("Взаимодействие с врагом:", ship.name);
    // this.dialogMenu?.open({
    //   x, y,
    //   title: ship.name ?? "Враг",
    //   items: [
    //     { label: "Угрожать", onClick: () => this.threatenEnemy(ship) },
    //     { label: "Отступить", onClick: () => this.ignoreEnemy(ship) },
    //   ],
    // });
  }
}

  getShipAtMouse(ships, mouseX, mouseY) {
    const cam = this.ctx.followCam;
    for (const ship of ships) {
      if (!ship.runtime) continue;
      const screen = this.worldToScreen(ship.runtime.x, ship.runtime.y, ship.runtime.z, cam);
      const dx = mouseX - screen.x;
      const dy = mouseY - screen.y;
      if (Math.hypot(dx, dy) < (ship.radiusScreen ?? 20)) return ship;
    }
    return null;
  }

  // Преобразование мировых координат в экранные
  worldToScreen(x, y, z, cam) {
    // TODO: подставь свою реальную матрицу камеры
    return { x, y }; // заглушка, чтобы компилировалось
  }

  // --- Методы действий ---
  talkToNpc(ship) {
    console.log("Начать диалог с NPC", ship.name);
  }

  tradeWithNpc(ship) {
    console.log("Открыть торговлю с NPC", ship.name);
  }

  threatenEnemy(ship) {
    console.log("Угрожаем врагу", ship.name);
  }

  ignoreEnemy(ship) {
    console.log("Игнорируем врага", ship.name);
  }
}

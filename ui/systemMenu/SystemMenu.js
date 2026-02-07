// engine/ui/systemMenu/SystemMenu.js
import { MapScreen } from "./screens/MapScreen.js";
import { QuestScreen } from "./screens/QuestScreen.js";
import { CraftScreen } from "./screens/CraftScreen.js";
import { SettingsScreen } from "./screens/SettingsScreen.js";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class SystemMenu {
  constructor(services, opts = {}) {
    this.services = services;

    this.id = opts.id ?? "systemMenu";
    this.isOpen = false;

    this.activeTab = "map";
    this.tabs = [
      { id: "map",      label: "Карта" },
      { id: "quests",   label: "Квесты" },
      { id: "craft",    label: "Крафт" },
      { id: "settings", label: "Настройки" },
    ];

    // Экраны
    this.screens = {
      map: new MapScreen(services),
      quests: new QuestScreen(services),
      craft: new CraftScreen(services),
      settings: new SettingsScreen(services),
    };

    // UI state
    this._mouse = { x: 0, y: 0, down: false, justDown: false, justUp: false, wheel: 0 };
    this._keys = new Set();

    // Layout
    this._layout = {
      margin: 24,
      panelW: 1100,
      panelH: 680,
      topBarH: 56,
      tabH: 40,
      leftPad: 18,
      rightPad: 18,
      bottomPad: 18,
    };

    // Simple modal behavior
    this._blockGameInput = true; // когда меню открыто — "съедаем" инпут
    this._pausedByMenu = false;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Пауза (если у тебя есть сервис паузы — подцепишь тут)
    // Мы не знаем как устроено у тебя, поэтому делаем мягко:
    if (this.services?.game?.setPaused) {
      this.services.game.setPaused(true);
      this._pausedByMenu = true;
    } else if (this.services?.state) {
      // пример: this.services.state.paused = true;
      this.services.state.paused = true;
      this._pausedByMenu = true;
    }

    this.screens[this.activeTab]?.onOpen?.();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.screens[this.activeTab]?.onClose?.();

    if (this._pausedByMenu) {
      if (this.services?.game?.setPaused) this.services.game.setPaused(false);
      else if (this.services?.state) this.services.state.paused = false;
      this._pausedByMenu = false;
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  setTab(tabId) {
    if (!this.screens[tabId]) return;
    if (this.activeTab === tabId) return;
    this.screens[this.activeTab]?.onClose?.();
    this.activeTab = tabId;
    this.screens[this.activeTab]?.onOpen?.();
  }

  // input: унифицированный объект, который ты соберешь из своего InputController
  // ожидается: { mouse:{x,y,down,justDown,justUp,wheel}, keysDown:Set/Array, keyPressed?:string, keyReleased?:string }
  handleInput(input) {
    // Быстрые хоткеи открытия
    const keyPressed = input?.keyPressed;
    if (keyPressed === "Escape") {
      this.toggle();
      return true;
    }
    if (!this.isOpen) return false;

    // Обновим мышь
    if (input?.mouse) {
      this._mouse.x = input.mouse.x ?? this._mouse.x;
      this._mouse.y = input.mouse.y ?? this._mouse.y;
      this._mouse.down = !!input.mouse.down;
      this._mouse.justDown = !!input.mouse.justDown;
      this._mouse.justUp = !!input.mouse.justUp;
      this._mouse.wheel = input.mouse.wheel ?? 0;
    } else {
      this._mouse.justDown = false;
      this._mouse.justUp = false;
      this._mouse.wheel = 0;
    }

    // Кнопки / табы / клик вне панели
    // Логику хит-тестов делаем внутри render (через ui.hitRect), но инпут нужен здесь.
    // Мы просто сохраним стейт и позволим render'у отработать клики.
    // Также прокинем в экран:
    const screen = this.screens[this.activeTab];
    screen?.handleInput?.(input);

    return this._blockGameInput; // открыто меню => съедаем инпут
  }

  update(dt) {
    if (!this.isOpen) return;
    this.screens[this.activeTab]?.update?.(dt);
    // сброс одноразовых флагов (если нужно)
    this._mouse.justDown = false;
    this._mouse.justUp = false;
    this._mouse.wheel = 0;
  }

  render(ui, dt) {
    if (!this.isOpen) return;

    const { width: W, height: H } = ui.getSize();
    const L = this._layout;

    const panelW = clamp(L.panelW, 640, W - L.margin * 2);
    const panelH = clamp(L.panelH, 420, H - L.margin * 2);

    const x = Math.floor((W - panelW) * 0.5);
    const y = Math.floor((H - panelH) * 0.5);

    const panelRect = { x, y, w: panelW, h: panelH };
    const topBarRect = { x, y, w: panelW, h: L.topBarH };
    const contentRect = { x, y: y + L.topBarH, w: panelW, h: panelH - L.topBarH };

    // затемнение фона
    ui.rect(0, 0, W, H, { fill: "rgba(0,0,0,0.55)" });

    // панель
    ui.rect(panelRect.x, panelRect.y, panelRect.w, panelRect.h, {
      fill: "rgba(14,18,24,0.92)",
      stroke: "rgba(255,255,255,0.12)",
      radius: 12,
    });

    // верхняя панель
    ui.rect(topBarRect.x, topBarRect.y, topBarRect.w, topBarRect.h, {
      fill: "rgba(255,255,255,0.04)",
      stroke: "rgba(255,255,255,0.08)",
      radius: 12,
      radiusOnlyTop: true,
    });

    // заголовок
    ui.text(topBarRect.x + L.leftPad, topBarRect.y + 18, "Системное меню", {
      size: 18,
      color: "rgba(255,255,255,0.92)",
    });

    // кнопка закрытия (X)
    const closeW = 42, closeH = 32;
    const closeRect = {
      x: topBarRect.x + topBarRect.w - L.rightPad - closeW,
      y: topBarRect.y + Math.floor((L.topBarH - closeH) * 0.5),
      w: closeW, h: closeH
    };

    const closeHover = ui.hitRect(closeRect.x, closeRect.y, closeRect.w, closeRect.h, this._mouse.x, this._mouse.y);
    ui.rect(closeRect.x, closeRect.y, closeRect.w, closeRect.h, {
      fill: closeHover ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
      stroke: "rgba(255,255,255,0.10)",
      radius: 8,
    });
    ui.text(closeRect.x + 16, closeRect.y + 9, "×", { size: 18, color: "rgba(255,255,255,0.9)" });

    if (this._mouse.justDown && closeHover) {
      this.close();
      return;
    }

    // вкладки
    const tabStartX = topBarRect.x + 220;
    const tabY = topBarRect.y + Math.floor((L.topBarH - L.tabH) * 0.5);
    let tabX = tabStartX;

    for (const t of this.tabs) {
      const padX = 14;
      const textW = ui.measureText(t.label, 14);
      const tabW = Math.max(86, textW + padX * 2);

      const isActive = this.activeTab === t.id;
      const r = { x: tabX, y: tabY, w: tabW, h: L.tabH };

      const hover = ui.hitRect(r.x, r.y, r.w, r.h, this._mouse.x, this._mouse.y);
      ui.rect(r.x, r.y, r.w, r.h, {
        fill: isActive
          ? "rgba(255,255,255,0.14)"
          : (hover ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)"),
        stroke: "rgba(255,255,255,0.10)",
        radius: 10,
      });
      ui.text(r.x + padX, r.y + 12, t.label, {
        size: 14,
        color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)"
      });

      if (this._mouse.justDown && hover) {
        this.setTab(t.id);
      }

      tabX += tabW + 10;
    }

    // клик по затемнению => закрыть (если клик вне панели)
    const insidePanel = ui.hitRect(panelRect.x, panelRect.y, panelRect.w, panelRect.h, this._mouse.x, this._mouse.y);
    if (this._mouse.justDown && !insidePanel) {
      this.close();
      return;
    }

    // контент активного экрана
    const screen = this.screens[this.activeTab];
    screen?.render?.(ui, contentRect, dt, this._mouse);
  }
}

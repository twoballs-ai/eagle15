// src/ui/widgets/EventIndicatorWidget.js

export class EventIndicatorWidget {
  constructor({ id = "event-indicator-widget", ctx }) {
    this.id = id;
    this.ctx = ctx;
    this.el = null;
    this.events = [];
    this._pendingEvents = []; // Буфер для событий до монтирования
    this._game = null;
  }

  mount(parent) {
    const root = document.createElement("div");
    this.el = root;

    Object.assign(root.style, {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "6px",
      pointerEvents: "auto", // Важно для кликов
      padding: "4px 8px",
      // Фон и рамки убраны по вашему требованию
    });

    parent.appendChild(root);

    // 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Отрисовываем события, которые пришли до mount()
    if (this._pendingEvents && this._pendingEvents.length > 0) {
      const pending = [...this._pendingEvents];
      this._pendingEvents = []; // Очищаем буфер
      pending.forEach(ev => this.addEvent(ev)); // Теперь addEvent сработает нормально, т.к. this.el уже существует
    }
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "flex" : "none";
  }

  update(game, scene, dt) {
    this._game = game;
    
    if (!game?.started) return this.setVisible(false);
    if (scene?.ctx?.cutscene?.active) return this.setVisible(false);

    // 🚨 БОЛЕЕ НАДЕЖНАЯ ПРОВЕРКА: проверяем наличие ctx (признак игровой сцены) 
    // или частичное совпадение имени, чтобы не зависеть от точного регистра
    const isRelevantScene = scene?.ctx && (
      (scene.name && (scene.name.includes("Star") || scene.name.includes("Galaxy") || scene.name === "sol")) 
      || scene.constructor?.name?.includes("Scene")
    );
    
    this.setVisible(!!isRelevantScene);

    // Очищаем просроченные события
    const now = Date.now();
    this.events = this.events.filter(e => !e.expiresAt || e.expiresAt > now);
    
    // Перерисовываем, если что-то истекло
    this._render();
  }

  render(game, scene, rect) {}

  addEvent(event) {
    // Если виджет еще не смонтирован, сохраняем в буфер
    if (!this.el) {
      this._pendingEvents.push(event);
      return;
    }

    const id = event.id || `${event.type}_${Date.now()}`;
    
    // Удаляем старое событие того же типа и корабля, чтобы не дублировать иконки
    this.events = this.events.filter(e => {
      if (e.shipId && event.shipId) {
        return !(e.type === event.type && e.shipId === event.shipId);
      }
      return true;
    });

    const newEvent = {
      id,
      type: event.type,
      shipId: event.shipId || null,
      shipName: event.shipName || null,
      text: event.text || this._getDefaultText(event.type),
      createdAt: Date.now(),
      expiresAt: event.duration ? Date.now() + event.duration : null,
    };

    this.events.push(newEvent);
    this._render();

    // Если есть duration, автоматически удаляем событие по таймеру
    if (event.duration) {
      setTimeout(() => {
        this.removeEvent(id);
      }, event.duration);
    }
  }

  removeEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this._render();
  }

  removeShipEvents(shipId) {
    this.events = this.events.filter(e => e.shipId !== shipId);
    this._render();
  }

  _getDefaultText(type) {
    const texts = {
      hostile_contact: 'Враг требует ответа!',
      neutral_contact: 'Нейтрал хочет связаться',
      ally_contact: 'Союзник на связи',
      warning: 'Предупреждение!',
      combat: 'Бой!',
      destroyed: 'Цель уничтожена',
    };
    return texts[type] || 'Событие';
  }

  _render() {
    if (!this.el) return;

    this.el.innerHTML = "";

    const icons = {
      hostile_contact: { icon: '☠️', color: '#ff4d4d', pulse: true },
      neutral_contact: { icon: '📡', color: '#ffd24d', pulse: false },
      ally_contact: { icon: '★', color: '#4dff88', pulse: false },
      warning: { icon: '⚠️', color: '#ff9f43', pulse: true },
      combat: { icon: '⚔️', color: '#ff4d4d', pulse: true },
      destroyed: { icon: '💥', color: '#ff6b6b', pulse: false },
    };

    this.events.forEach(event => {
      const config = icons[event.type] || { icon: '•', color: '#888', pulse: false };
      
      const indicator = document.createElement("div");
      indicator.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        cursor: pointer;
        transition: all 0.2s ease;
        ${config.pulse ? 'animation: pulse-indicator 2s infinite;' : ''}
      `;

      indicator.innerHTML = `<span style="font-size: 16px; filter: drop-shadow(0 0 4px ${config.color});">${config.icon}</span>`;
      
      indicator.addEventListener("mouseenter", () => {
        indicator.style.transform = "scale(1.2)";
      });
      
      indicator.addEventListener("mouseleave", () => {
        indicator.style.transform = "scale(1)";
      });

      indicator.addEventListener("click", () => {
        if (event.shipId && this.ctx.ui?.commsLog) {
          this.ctx.ui.commsLog.showShipHistory(event.shipId);
        }
      });

      // Всплывающая подсказка при наведении
      indicator.title = `${event.shipName || ''}\n${event.text}`;

      this.el.appendChild(indicator);
    });
  }

  destroy() {
    this.events = [];
    this._pendingEvents = [];
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

// Глобальные стили для анимации (добавляем один раз)
if (!document.getElementById("event-indicator-style")) {
  const style = document.createElement("style");
  style.id = "event-indicator-style";
  style.textContent = `
    @keyframes pulse-indicator {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.6); }
      50% { box-shadow: 0 0 0 6px rgba(255, 77, 77, 0); }
    }
  `;
  document.head.appendChild(style);
}
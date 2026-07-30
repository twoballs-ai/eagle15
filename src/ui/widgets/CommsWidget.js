// src/ui/widgets/CommsWidget.js

export class CommsWidget {
  constructor({ id = "comms-widget", ctx, onMessageClick }) {
    this.id = id;
    this.ctx = ctx;
    this.onMessageClick = onMessageClick;
    this.messages = [];
    this.enabled = true;
    this.filterShipId = null;

    this.el = document.createElement("div");
    this.el.className = "comms-widget";
    
    Object.assign(this.el.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      pointerEvents: "auto",
      padding: "4px 12px",
      background: "rgba(10, 15, 25, 0.6)",
      borderRadius: "6px",
      border: "1px solid rgba(100, 150, 255, 0.2)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12px",
      color: "#e0e0e0",
      maxWidth: "400px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    });

    this._injectStyles();
  }

  _injectStyles() {
    if (document.getElementById("comms-widget-style")) return;
    const style = document.createElement("style");
    style.id = "comms-widget-style";
    style.textContent = `
      .comms-entry {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .comms-sender {
        font-weight: 600;
        font-size: 11px;
        opacity: 0.9;
        white-space: nowrap;
      }
      .comms-text {
        line-height: 1.3;
        font-size: 11px;
        flex: 1;
      }
      .comms-widget:hover {
        background: rgba(20, 30, 50, 0.8);
        border-color: rgba(100, 150, 255, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  mount(parent, props) {
    parent.appendChild(this.el);
  }

  setVisible(visible) {
    this.enabled = visible;
    this.el.style.display = visible ? "flex" : "none";
  }

  update(game, scene, dt) {}
  render(game, scene, rect) {}

  addMessage(msg) {
    const entry = {
      id: `${Date.now()}_${Math.random()}`,
      type: msg.type || 'system',
      shipId: msg.shipId || null,
      shipName: msg.shipName || null,
      text: msg.text || '',
      action: msg.action || null,
      timestamp: msg.timestamp || Date.now(),
    };

    this.messages.push(entry);
    
    if (this.messages.length > 50) {
      this.messages.shift();
    }

    this._render();
  }

  removeShipMessages(shipId) {
    this.messages = this.messages.filter(m => m.shipId !== shipId);
    this._render();
  }

  showShipHistory(shipId) {
    this.filterShipId = shipId;
    this._render();
  }
  markAsRead(shipId) {
    // В текущей реализации показывается только последнее сообщение,
    // поэтому этот метод оставлен как заглушка для совместимости.
  }

  clearFilter() {
    this.filterShipId = null;
    this._render();
  }

  _render() {
    if (!this.el) return;

    this.el.innerHTML = "";

    // Показываем только одно последнее сообщение
    const messagesToShow = this.filterShipId
      ? this.messages.filter(m => m.shipId === this.filterShipId)
      : this.messages;

    if (messagesToShow.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "opacity: 0.5; font-size: 11px;";
      empty.textContent = "Нет сообщений";
      this.el.appendChild(empty);
      return;
    }

    const lastMsg = messagesToShow[messagesToShow.length - 1];

    const entry = document.createElement("div");
    entry.className = "comms-entry";

    const senderSpan = document.createElement("span");
    senderSpan.className = "comms-sender";
    senderSpan.textContent = lastMsg.shipName || (lastMsg.type === 'system' ? 'Система' : 'Неизвестно');

    const textSpan = document.createElement("span");
    textSpan.className = "comms-text";
    textSpan.textContent = lastMsg.text;

    entry.appendChild(senderSpan);
    entry.appendChild(textSpan);

    this.el.appendChild(entry);

    // Клик по виджету
    this.el.onclick = () => {
      if (lastMsg.shipId && this.onMessageClick) {
        this.onMessageClick(lastMsg);
      }
    };
  }

  destroy() {
    this.messages = [];
    try { this.el?.remove(); } catch (_) {}
  }
}
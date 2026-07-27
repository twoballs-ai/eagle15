// src/ui/widgets/CommsWidget.js

export class CommsWidget {
  constructor({ id, ctx, onMessageClick }) {
    // 🚨 КРИТИЧЕСКИ ВАЖНО для HUDManager
    this.id = id; 

    this.ctx = ctx;
    this.onMessageClick = onMessageClick;
    this.messages = [];
    this.enabled = true;

    this.el = document.createElement("div");
    this.el.className = "comms-widget";
    
    // Убрали position: "absolute", left и bottom, чтобы виджет корректно 
    // встраивался во flex-контейнер слота bottom-left и не перекрывал другие панели
    Object.assign(this.el.style, {
      width: "320px",
      maxHeight: "200px",
      overflowY: "auto",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "8px",
      background: "rgba(0, 0, 0, 0.6)",
      borderRadius: "8px",
      padding: "10px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
      color: "#e0e0e0",
      // Добавляем margin-top, чтобы был небольшой отступ от QuestWidget сверху
      marginTop: "10px" 
    });

    this._injectStyles();
  }

  _injectStyles() {
    if (document.getElementById("comms-widget-style")) return;
    const style = document.createElement("style");
    style.id = "comms-widget-style";
    style.textContent = `
      .comms-msg {
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
        border-left: 3px solid transparent;
      }
      .comms-msg:hover { background: rgba(255, 255, 255, 0.1); transform: translateX(2px); }
      .comms-msg.hostile { border-left-color: #ff4d4d; background: rgba(255, 77, 77, 0.1); }
      .comms-msg.hostile.urgent { animation: pulse-red 1.5s infinite; }
      .comms-msg.ally { border-left-color: #4dff88; background: rgba(77, 255, 136, 0.05); }
      .comms-msg.neutral { border-left-color: #ffd24d; }
      .comms-sender { font-weight: 600; font-size: 12px; margin-bottom: 2px; opacity: 0.9; }
      .comms-text { line-height: 1.3; }
      @keyframes pulse-red {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4); }
        50% { box-shadow: 0 0 0 4px rgba(255, 77, 77, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  // === Методы, ожидаемые HUDManager ===
  mount(parent, props) {
    parent.appendChild(this.el);
  }

  setVisible(visible) {
    this.enabled = visible;
    this.el.style.display = visible ? "flex" : "none";
  }

  update(game, scene, dt) {}
  render(game, scene, rect) {}

  destroy() {
    this.messages = [];
    try { this.el?.remove(); } catch (_) {}
  }

  // === Бизнес-логика ===
  addMessage(msg) {
    this.messages = this.messages.filter(m => m.shipId !== msg.shipId || m.type !== 'hostile_update');
    this.messages.push({ ...msg, timestamp: Date.now(), isRead: false });
    if (this.messages.length > 10) this.messages.shift();
    this._renderMessages();
  }

  removeMessage(shipId) {
    this.messages = this.messages.filter(m => m.shipId !== shipId);
    this._renderMessages();
  }

  markAsRead(shipId) {
    const msg = this.messages.find(m => m.shipId === shipId);
    if (msg) {
      msg.isRead = true;
      msg.isUrgent = false;
      this._renderMessages();
    }
  }

  _renderMessages() {
    this.el.innerHTML = "";
    for (const msg of this.messages) {
      const div = document.createElement("div");
      div.className = `comms-msg ${msg.type} ${msg.isUrgent ? "urgent" : ""}`;

      const senderDiv = document.createElement("div");
      senderDiv.className = "comms-sender";
      senderDiv.textContent = msg.shipName || "Неизвестный сигнал";

      const textDiv = document.createElement("div");
      textDiv.className = "comms-text";
      textDiv.textContent = msg.text;

      div.appendChild(senderDiv);
      div.appendChild(textDiv);

      div.addEventListener("click", () => {
        this.markAsRead(msg.shipId);
        if (this.onMessageClick) this.onMessageClick(msg);
      });

      this.el.appendChild(div);
    }
  }
}
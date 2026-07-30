// src/ui/widgets/BottomControlPanel.js

function apply(el, styles) {
  Object.assign(el.style, styles);
}

export class BottomControlPanel {
  constructor({ id = "bottom-control-panel", ctx }) {
    this.id = id;
    this.ctx = ctx;
    this.el = null;
    this._game = null;
    this._scene = null;
    this.commsContainer = null;
  }

  mount(parent) {
    const root = document.createElement("div");
    this.el = root;

    apply(root, {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      pointerEvents: "auto",
      background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(10, 16, 28, 0.98))",
      borderTop: "2px solid rgba(100, 150, 255, 0.4)",
      backdropFilter: "blur(12px)",
      padding: "0 16px",
      boxSizing: "border-box",
      boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)",
    });

    // Левая часть: контейнер для CommsWidget
    const leftSection = document.createElement("div");
    apply(leftSection, {
      display: "flex",
      alignItems: "center",
      flex: "0 0 auto",
      marginRight: "16px",
    });
    this.commsContainer = leftSection;
    root.appendChild(leftSection);

    // Центральная часть: кнопки действий
    const centerSection = document.createElement("div");
    apply(centerSection, {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      flex: "1 1 auto",
    });

    const actions = [
      { id: "inventory", label: "Инвентарь", key: "I", icon: "📦" },
      { id: "quests", label: "Миссии", key: "J", icon: "📜" },
      { id: "map", label: "Система", key: "M", icon: "️" },
      { id: "galaxy", label: "Галактика", key: "G", icon: "🌌" },
      { id: "settings", label: "Меню", key: "Esc", icon: "️" },
    ];

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.action = action.id;
      btn.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 0px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${action.icon}</div>
        <div style="font-size: 10px; font-weight: 600; letter-spacing: 0.3px; line-height: 1.1;">${action.label}</div>
        <div style="font-size: 9px; opacity: 0.5; margin-top: 0px; font-weight: 500;">[${action.key}]</div>
      `;
      
      apply(btn, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "70px",
        height: "48px",
        borderRadius: "8px",
        border: "1px solid rgba(126, 204, 255, 0.25)",
        background: "rgba(30, 41, 59, 0.6)",
        color: "#e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        gap: "2px",
      });

      btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(51, 65, 85, 0.8)";
        btn.style.borderColor = "rgba(126, 204, 255, 0.7)";
        btn.style.transform = "translateY(-3px)";
      });
      
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "rgba(30, 41, 59, 0.6)";
        btn.style.borderColor = "rgba(126, 204, 255, 0.25)";
        btn.style.transform = "translateY(0)";
      });
      
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._triggerAction(action.id);
      });

      centerSection.appendChild(btn);
    });

    root.appendChild(centerSection);

    // Правая часть: пустая (для баланса)
    const rightSection = document.createElement("div");
    apply(rightSection, {
      flex: "0 0 200px",
    });
    root.appendChild(rightSection);

    parent.appendChild(root);

    // Монтируем CommsWidget внутрь leftSection
    if (this.ctx?.ui?.commsLog) {
      this.ctx.ui.commsLog.mount(leftSection);
    }
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "flex" : "none";
  }

  update(game, scene, dt) {
    this._game = game;
    this._scene = scene;

    if (!game?.started) return this.setVisible(false);
    if (scene?.ctx?.cutscene?.active) return this.setVisible(false);

    const isGalaxy = scene?.name === "Galaxy Map";
    const isStar = scene?.name === "Star System";
    this.setVisible(isGalaxy || isStar);
  }

  render(game, scene, rect) {}

  _triggerAction(actionId) {
    const game = this._game;
    if (!game) return;

    if (actionId === "galaxy") {
      if (this._scene?.name === "Galaxy Map") {
        const id = game.state?.currentSystemId ?? 0;
        game.openStarSystem(id);
      } else {
        game.openGalaxyMap();
      }
      return;
    }

    if (actionId === "map") {
      console.log("Открытие карты системы");
      return;
    }

    const menu = game.systemMenu;
    if (menu) {
      menu.setTab(actionId === "settings" ? "settings" : actionId);
      menu.open();
    }
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
    this._game = null;
    this._scene = null;
  }
}
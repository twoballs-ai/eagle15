// ui/widgets/GalaxyMapButton.js
function apply(el, styles) { Object.assign(el.style, styles); }

export class GalaxyMapButton {
  constructor({ id = "btn-galaxy-map" } = {}) {
    this.id = id;
    this.el = null;
    this._game = null;
    this._scene = null;
  }

  mount(parent) {
    const btn = document.createElement("button");
    this.el = btn;

    btn.type = "button";
    btn.title = "Галактическая карта";
    btn.setAttribute("aria-label", "Открыть галактическую карту");

    // ⚠️ важно: HUD root pointerEvents:none, поэтому кнопке включаем
    apply(btn, {
      pointerEvents: "auto",
      width: "54px",
      height: "54px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(0,0,0,0.38)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      color: "rgba(235,245,255,0.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      userSelect: "none",
    });

    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 7.5C4 6.12 5.12 5 6.5 5H17.5C18.88 5 20 6.12 20 7.5V16.5C20 17.88 18.88 19 17.5 19H6.5C5.12 19 4 17.88 4 16.5V7.5Z"
              stroke="currentColor" stroke-width="1.6" opacity="0.95"/>
        <path d="M8 9.2L10.1 10.9L8.6 13.2L11.2 12.2L13.1 14.6L12.8 11.7L15.6 10.9L12.7 10.3L12.4 7.6L10.9 10.1L8 9.2Z"
              fill="currentColor" opacity="0.92"/>
        <path d="M7 16H17" stroke="currentColor" stroke-width="1.6" opacity="0.55"/>
      </svg>
    `;

    // hover/press
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "rgba(0,0,0,0.48)";
      btn.style.borderColor = "rgba(255,255,255,0.28)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "rgba(0,0,0,0.38)";
      btn.style.borderColor = "rgba(255,255,255,0.18)";
      btn.style.transform = "";
    });
    btn.addEventListener("mousedown", () => {
      btn.style.transform = "translateY(1px)";
    });
    btn.addEventListener("mouseup", () => {
      btn.style.transform = "";
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._handleClick();
    });

    parent.appendChild(btn);
    this.setVisible(false);
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "flex" : "none";
  }

update(game, scene, dt) {
  this._game = game;
  this._scene = scene;

  // 1) игра ещё не стартовала — скрыть (главное меню / стартовый экран)
  if (!game?.started) {
    this.setVisible(false);
    return;
  }

  // 2) во время катсцены — скрыть
  const cutsceneActive = !!scene?.ctx?.cutscene?.active;
  if (cutsceneActive) {
    this.setVisible(false);
    return;
  }

  // 3) показываем только на нужных сценах
  const isGalaxy = scene?.name === "Galaxy Map";
  const isStar = scene?.name === "Star System"; // ⚠️ поставь точное имя твоей сцены
  this.setVisible(isGalaxy || isStar);
}


  _handleClick() {
    const game = this._game;
    const scene = this._scene;
    if (!game) return;

    // toggle: если уже на карте — вернуться в текущую систему
    if (scene?.name === "Galaxy Map") {
      const id = game.state?.currentSystemId ?? 0;
      game.openStarSystem(id);
    } else {
      game.openGalaxyMap();
    }
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
    this._game = null;
    this._scene = null;
  }
}

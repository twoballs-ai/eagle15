// ui/widgets/MinimapFrame.js
function apply(el, styles) { Object.assign(el.style, styles); }

export class MinimapFrame {
  constructor({ id = "minimapFrame" } = {}) {
    this.id = id;
    this.el = null;
    this._game = null;
  }

  mount(parent) {
    if (this.el) return;

    const el = document.createElement("div");
    el.id = this.id;
    this.el = el;

    apply(el, {
      position: "fixed",
      top: "12px",
      right: "12px",
      width: "200px",
      height: "200px",
      borderRadius: "18px",
      overflow: "hidden",
      background:
        "radial-gradient(120% 120% at 30% 20%, rgba(120,180,255,0.10), rgba(20,30,60,0.35) 60%, rgba(0,0,0,0.55))",
      backdropFilter: "saturate(120%)",
      border: "1px solid rgba(120,180,255,0.25)",
      boxShadow:
        "0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 18px rgba(80,140,255,0.25), 0 18px 40px rgba(0,0,0,0.55)",
      pointerEvents: "none",
      display: "none", // ✅ по умолчанию скрыто
      zIndex: "1500",
    });

    // внутренний блик
    const before = document.createElement("div");
    apply(before, {
      position: "absolute",
      inset: "1px",
      borderRadius: "16px",
      background:
        "linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.0))",
      pointerEvents: "none",
    });

    // уголки
    const after = document.createElement("div");
    apply(after, {
      position: "absolute",
      inset: "0",
      borderRadius: "18px",
      background:
        "linear-gradient(90deg, rgba(120,180,255,.6) 0 2px, transparent 2px) top left, " +
        "linear-gradient(180deg, rgba(120,180,255,.6) 0 2px, transparent 2px) top left, " +

        "linear-gradient(270deg, rgba(120,180,255,.6) 0 2px, transparent 2px) top right, " +
        "linear-gradient(180deg, rgba(120,180,255,.6) 0 2px, transparent 2px) top right, " +

        "linear-gradient(90deg, rgba(120,180,255,.6) 0 2px, transparent 2px) bottom left, " +
        "linear-gradient(0deg, rgba(120,180,255,.6) 0 2px, transparent 2px) bottom left, " +

        "linear-gradient(270deg, rgba(120,180,255,.6) 0 2px, transparent 2px) bottom right, " +
        "linear-gradient(0deg, rgba(120,180,255,.6) 0 2px, transparent 2px) bottom right",
      backgroundSize:
        "18px 2px, 2px 18px, 18px 2px, 2px 18px, 18px 2px, 2px 18px, 18px 2px, 2px 18px",
      backgroundRepeat: "no-repeat",
      pointerEvents: "none",
    });

    el.appendChild(before);
    el.appendChild(after);

    parent.appendChild(el);
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "block" : "none";
  }

  // ✅ чтобы не висел в меню/создании персонажа
  update(game, scene, dt) {
    this._game = game;

    if (!this.el) return;

    const started = !!game?.started;
    const cutsceneActive = !!scene?.ctx?.cutscene?.active;

    // показывать только в игре и не во время катсцены
    this.setVisible(started && !cutsceneActive);
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
    this._game = null;
  }
}

function apply(el, styles) { Object.assign(el.style, styles); }

export class QuestWidget {
  constructor({ id = "quest-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    parent.appendChild(el);
    this.el = el;

    apply(el, {
      pointerEvents: "none",
      whiteSpace: "pre-line",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "13px",
      lineHeight: "1.25",
      color: "rgba(235, 245, 255, 0.95)",
      textShadow: "0 1px 2px rgba(0,0,0,0.65)",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "10px 12px",
      maxWidth: "420px",
    });

    el.textContent = "HUDManager OK ✅";
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update(game, scene, dt) {
    // Забираем данные прямо из сцены — ровно как у тебя было в updateHudText
    const shipR = game.state.playerShip?.runtime;
    const focus = scene.poiFocus;

    let focusLine = "";
    if (shipR && focus) {
      const dx = (focus.worldX ?? 0) - shipR.x;
      const dz = (focus.worldZ ?? 0) - shipR.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      focusLine = `\nДистанция: ${dist.toFixed(0)}m`;
    }

    const text =
      `АКТ 1\n` +
      `${scene.questLine || ""}\n\n` +
      `Рядом: ${scene.poiHint || "—"}` +
      focusLine +
      `\n\n` +
      `Событие: ${scene.lastLog || "—"}`;

    if (text === this._last) return;
    this._last = text;
    this.el.textContent = text;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

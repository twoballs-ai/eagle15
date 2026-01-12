// ui/hudOverlay.js
export class HudOverlay {
  constructor({
    parent = document.body,
    id = "hud-overlay",
    anchor = "top-left",
  } = {}) {
    this.parent = parent;
    this.id = id;

    // создать/найти контейнер
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      parent.appendChild(el);
    }
    this.el = el;

    // базовые стили
    Object.assign(this.el.style, {
      position: "fixed",
      zIndex: 9999,
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

    // позиционирование
    this.setAnchor(anchor);

    this._lastText = "";
    this.setText("");
  }

  setAnchor(anchor) {
    // сброс
    this.el.style.top = "";
    this.el.style.left = "";
    this.el.style.right = "";
    this.el.style.bottom = "";

    const pad = "12px";
    if (anchor === "top-left") {
      this.el.style.top = pad;
      this.el.style.left = pad;
    } else if (anchor === "top-right") {
      this.el.style.top = pad;
      this.el.style.right = pad;
    } else if (anchor === "bottom-left") {
      this.el.style.bottom = pad;
      this.el.style.left = pad;
    } else if (anchor === "bottom-right") {
      this.el.style.bottom = pad;
      this.el.style.right = pad;
    }
  }

  setText(text) {
    const t = text ?? "";
    if (t === this._lastText) return; // не перерисовываем DOM зря
    this._lastText = t;
    this.el.textContent = t;
  }

  destroy() {
    try {
      this.el?.remove();
    } catch (_) {}
  }
}

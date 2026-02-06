// ui/contextMenu.js
export class ContextMenu {
  constructor() {
    this.el = document.createElement("div");
    this.el.style.position = "fixed";
    this.el.style.zIndex = "999999"; // ✅ выше всего
    this.el.style.minWidth = "220px";
    this.el.style.background = "rgba(10,12,18,0.92)";
    this.el.style.border = "1px solid rgba(255,255,255,0.12)";
    this.el.style.borderRadius = "10px";
    this.el.style.boxShadow = "0 12px 35px rgba(0,0,0,0.45)";
    this.el.style.backdropFilter = "blur(10px)";
    this.el.style.padding = "6px";
    this.el.style.display = "none";
    this.el.style.userSelect = "none";
    this.el.style.pointerEvents = "auto";

    document.body.appendChild(this.el);

    this.isOpen = false;
    this.onClose = null;

    this._items = [];
    this._buttons = [];
    this._hoverIndex = -1;

    // ✅ чтобы клики по меню не доходили до канваса/игры
    this.el.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive: false });
    this.el.addEventListener("mousedown", (e) => e.stopPropagation(), { passive: false });
    this.el.addEventListener("click", (e) => e.stopPropagation(), { passive: false });
    this.el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // ✅ закрытие при клике вне меню
    this._onDocPointerDown = (e) => {
      if (!this.isOpen) return;
      if (this.el.contains(e.target)) return;
      this.close();
    };
    document.addEventListener("pointerdown", this._onDocPointerDown, true);
  }

  open({ x, y, title, items }) {
    this._items = Array.isArray(items) ? items : [];
    this._buttons = [];
    this._hoverIndex = -1;

    this.el.innerHTML = "";

    if (title) {
      const header = document.createElement("div");
      header.textContent = title;
      header.style.padding = "8px 10px";
      header.style.margin = "0 0 4px 0";
      header.style.fontSize = "13px";
      header.style.opacity = "0.9";
      header.style.borderBottom = "1px solid rgba(255,255,255,0.10)";
      this.el.appendChild(header);
    }

    for (let i = 0; i < this._items.length; i++) {
      const it = this._items[i];

      const btn = document.createElement("div");
      btn.textContent = it.label ?? "";
      btn.style.padding = "10px 10px";
      btn.style.fontSize = "14px";
      btn.style.borderRadius = "8px";
      btn.style.cursor = it.disabled ? "default" : "pointer";
      btn.style.opacity = it.disabled ? "0.45" : "0.95";
      btn.style.pointerEvents = it.disabled ? "none" : "auto";
      btn.dataset.idx = String(i);

      // ✅ hover визуал (DOM)
      btn.addEventListener("mouseenter", () => this.setHover(i));
      btn.addEventListener("mouseleave", () => this.setHover(-1));

      // ✅ ГЛАВНОЕ: обработчик выбора пункта
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (it.disabled) return;

        try {
          if (typeof it.onClick === "function") it.onClick();
        } finally {
          this.close();
        }
      });

      this.el.appendChild(btn);
      this._buttons.push(btn);
    }

    // Keep inside viewport
    const pad = 10;
    this.el.style.display = "block";

    const rect = this.el.getBoundingClientRect();
    const xx = Math.min(window.innerWidth - rect.width - pad, Math.max(pad, x));
    const yy = Math.min(window.innerHeight - rect.height - pad, Math.max(pad, y));

    this.el.style.left = `${xx}px`;
    this.el.style.top = `${yy}px`;

    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.el.style.display = "none";
    this.isOpen = false;
    this._hoverIndex = -1;
    if (this.onClose) this.onClose();
  }

  // ---------- Helpers (если захочешь управлять меню из Input) ----------

  containsTarget(domTarget) {
    if (!domTarget) return false;
    return this.el.contains(domTarget);
  }

  getIndexFromTarget(domTarget) {
    if (!domTarget) return -1;

    const el = domTarget.closest?.("[data-idx]");
    if (!el) return -1;
    if (!this.el.contains(el)) return -1;

    const idx = Number(el.dataset.idx);
    if (!Number.isFinite(idx)) return -1;
    if (idx < 0 || idx >= this._items.length) return -1;
    return idx;
  }

  activateIndex(idx) {
    if (idx < 0 || idx >= this._items.length) return false;
    const it = this._items[idx];
    if (!it || it.disabled) return false;

    if (typeof it.onClick === "function") it.onClick();
    return true;
  }

  setHover(idx) {
    if (idx === this._hoverIndex) return;
    this._hoverIndex = idx;

    for (let i = 0; i < this._buttons.length; i++) {
      const btn = this._buttons[i];
      const it = this._items[i];
      if (!btn) continue;

      if (it?.disabled) {
        btn.style.background = "transparent";
        continue;
      }
      btn.style.background = i === idx ? "rgba(255,255,255,0.07)" : "transparent";
    }
  }

  destroy() {
    try {
      document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    } catch (_) {}
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
    this.isOpen = false;
    this._items = [];
    this._buttons = [];
  }
}

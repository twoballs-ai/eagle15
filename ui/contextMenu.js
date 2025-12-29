export class ContextMenu {
  constructor() {
    this.el = document.createElement("div");
    this.el.style.position = "fixed";
    this.el.style.zIndex = "1000";
    this.el.style.minWidth = "220px";
    this.el.style.background = "rgba(10,12,18,0.92)";
    this.el.style.border = "1px solid rgba(255,255,255,0.12)";
    this.el.style.borderRadius = "10px";
    this.el.style.boxShadow = "0 12px 35px rgba(0,0,0,0.45)";
    this.el.style.backdropFilter = "blur(10px)";
    this.el.style.padding = "6px";
    this.el.style.display = "none";
    this.el.style.userSelect = "none";

    document.body.appendChild(this.el);

    this.isOpen = false;
    this.onClose = null;

    // Close on outside click
    window.addEventListener("mousedown", (e) => {
      if (!this.isOpen) return;
      if (!this.el.contains(e.target)) this.close();
    });

    // Close on ESC
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") this.close();
    });
  }

  open({ x, y, title, items }) {
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

    for (const it of items) {
      const btn = document.createElement("div");
      btn.textContent = it.label;
      btn.style.padding = "10px 10px";
      btn.style.fontSize = "14px";
      btn.style.borderRadius = "8px";
      btn.style.cursor = "pointer";
      btn.style.opacity = it.disabled ? "0.45" : "0.95";
      btn.style.pointerEvents = it.disabled ? "none" : "auto";

      btn.addEventListener("mouseenter", () => {
        if (!it.disabled) btn.style.background = "rgba(255,255,255,0.07)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
      });
      btn.addEventListener("mousedown", (e) => e.stopPropagation());
      btn.addEventListener("click", () => {
        if (it.onClick) it.onClick();
        this.close();
      });

      this.el.appendChild(btn);
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
    if (this.onClose) this.onClose();
  }
}

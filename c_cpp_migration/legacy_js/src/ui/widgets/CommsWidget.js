function apply(el, styles) { Object.assign(el.style, styles); }

export class CommsWidget {
  constructor({ id = "comms-widget", ctx } = {}) {
    this.id = id;
    this.ctx = ctx;
    this.el = null;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    this.el = el;
    parent.appendChild(el);

    apply(el, {
      pointerEvents: "none",
      width: "380px",
      color: "#ecf3ff",
      background: "linear-gradient(180deg, rgba(15,20,34,0.84), rgba(8,11,19,0.84))",
      border: "1px solid rgba(180, 213, 255, 0.18)",
      borderRadius: "16px",
      boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
      backdropFilter: "blur(8px)",
      padding: "12px",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "12px",
      lineHeight: "1.3",
    });

    el.innerHTML = `<div data-k="content">Подключение к каналу связи…</div>`;
    this.$content = el.querySelector('[data-k="content"]');
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update() {
    const logs = this.ctx?.quest?.log ?? [];
    const recent = logs.slice(-3).map((item) => item?.text).filter(Boolean);
    const lines = recent.length ? recent : [this.ctx?.lastLog || "Ожидание сообщений…"];

    const next =
      `<div style="font-size:10px;letter-spacing:.14em;opacity:.72;margin-bottom:8px;">КОММУНИКАЦИИ</div>` +
      lines.map((line) => `<div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-top:6px;">${line}</div>`).join("");

    if (next === this._last) return;
    this._last = next;
    this.$content.innerHTML = next;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

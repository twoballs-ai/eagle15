function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

export class QuestScreen {
  constructor(services) {
    this.services = services;
    this.host = null;
    this._styleEl = null;
    this._listEl = null;
    this._detailsEl = null;

    this.quests = [
      { id: "q1", title: "Сигнал в астероидном поясе", status: "Активен", desc: "Найти источник сигнала. Проверить POI A." },
      { id: "q2", title: "Починка гиперблока", status: "Неактивен", desc: "Нужно 3 компонента и доступ к верфи." },
    ];
    this.selected = this.quests[0]?.id ?? null;
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    host.innerHTML = "";

    const root = el("div", "qs-root", host);
    const top = el("div", "qs-top", root);
    el("div", "qs-title", top).textContent = "Квесты / Миссии";
    el("div", "qs-sub", top).textContent = "Активные и доступные задачи пилота.";

    const body = el("div", "qs-body", root);
    this._listEl = el("div", "qs-list", body);
    this._detailsEl = el("div", "qs-details", body);

    this.refresh();
  }

  onOpen() { this.refresh(); }
  destroy() { this.host = null; }

  refresh() {
    if (!this._listEl || !this._detailsEl) return;

    this._listEl.innerHTML = "";
    for (const q of this.quests) {
      const row = el("button", "qs-row", this._listEl);
      row.classList.toggle("is-active", this.selected === q.id);
      el("div", "qs-rowTitle", row).textContent = q.title;
      el("div", "qs-rowStatus", row).textContent = q.status;
      row.addEventListener("click", () => {
        this.selected = q.id;
        this.refresh();
      });
    }

    this._detailsEl.innerHTML = "";
    const cur = this.quests.find((q) => q.id === this.selected);
    if (!cur) {
      this._detailsEl.textContent = "Пока нет доступных квестов.";
      return;
    }

    el("div", "qs-h1", this._detailsEl).textContent = cur.title;
    el("div", "qs-muted", this._detailsEl).textContent = `Статус: ${cur.status}`;
    el("div", "qs-h2", this._detailsEl).textContent = "Описание";
    el("div", "qs-text", this._detailsEl).textContent = cur.desc;
    el("div", "qs-h2", this._detailsEl).textContent = "Цели";
    el("div", "qs-text", this._detailsEl).textContent = "• Найти POI A\n• Подойти к объекту\n• Активировать сканер";
  }

  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.textContent = `
      .qs-root{display:flex;flex-direction:column;gap:12px}
      .qs-top{padding:10px 12px;border:1px solid rgba(160,200,255,.10);border-radius:12px;background:rgba(0,0,0,.18)}
      .qs-title{font-weight:900;font-size:16px;color:#e8f0ff}
      .qs-sub{opacity:.7;font-size:12px;margin-top:4px}
      .qs-body{display:grid;grid-template-columns:360px 1fr;gap:12px;min-height:420px}
      .qs-list,.qs-details{border-radius:14px;border:1px solid rgba(160,200,255,.10);background:rgba(0,0,0,.18);padding:12px}
      .qs-list{display:flex;flex-direction:column;gap:8px}
      .qs-row{padding:10px;border-radius:12px;border:1px solid rgba(160,200,255,.10);background:rgba(255,255,255,.04);color:#eaf3ff;text-align:left;cursor:pointer}
      .qs-row.is-active{background:rgba(255,255,255,.12);border-color:rgba(0,255,220,.14)}
      .qs-rowTitle{font-weight:900;font-size:13px}
      .qs-rowStatus{opacity:.65;font-size:12px;margin-top:4px}
      .qs-details{display:flex;flex-direction:column;gap:10px}
      .qs-h1{font-weight:950;font-size:16px}
      .qs-h2{font-weight:900;opacity:.9;margin-top:4px}
      .qs-muted{opacity:.65;font-size:12px}
      .qs-text{white-space:pre-line;opacity:.85;font-size:13px;line-height:1.45}
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}

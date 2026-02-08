// engine/ui/systemMenu/screens/CraftScreen.js
function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

export class CraftScreen {
  constructor(services) {
    this.services = services;

    this.host = null;

    this.selected = null;
    this.station = "shipyard_bench";
    this.log = [];

    // DOM refs
    this._listEl = null;
    this._detailsEl = null;
    this._invEl = null;
    this._logEl = null;
    this._stationEl = null;

    this._styleEl = null;
  }

  _get(key) {
    return (typeof this.services?.get === "function")
      ? this.services.get(key)
      : this.services?.[key];
  }

  _recipes() {
    const crafting = this._get("crafting");
    return crafting ? crafting.listRecipes() : [];
  }

  mount(host) {
    this.host = host;
    this._injectStyles();

    host.innerHTML = "";

    const root = el("div", "cs-root", host);

    // header
    const top = el("div", "cs-top", root);
    el("div", "cs-title", top).textContent = "Крафт корабля (MVP)";
    el("div", "cs-sub", top).textContent = "Рецепты → компоненты → модули. Всё в общий инвентарь.";

    // station
    const stationRow = el("div", "cs-stationRow", root);
    el("div", "cs-label", stationRow).textContent = "Станция:";
    this._stationEl = el("div", "cs-stations", stationRow);

    const stations = [
      { id: "shipyard_bench", label: "Сборочный док" },
      { id: "fabricator", label: "Фабрикатор" },
      { id: "smelter", label: "Плавильня" },
      { id: "chem_reactor", label: "Химреактор" },
      { id: "gas_compressor", label: "Компрессор" },
    ];

    for (const st of stations) {
      const b = el("button", "cs-stBtn", this._stationEl);
      b.textContent = st.label;
      b.addEventListener("click", () => {
        this.station = st.id;
        this.refresh();
      });
    }

    // body columns
    const body = el("div", "cs-body", root);

    const left = el("div", "cs-panel", body);
    el("div", "cs-panelTitle", left).textContent = "Рецепты";
    this._listEl = el("div", "cs-list", left);

    const right = el("div", "cs-panel", body);
    this._detailsEl = el("div", "cs-details", right);

    // bottom
    const bottom = el("div", "cs-bottom", root);

    const invBox = el("div", "cs-miniPanel", bottom);
    el("div", "cs-miniTitle", invBox).textContent = "Инвентарь";
    this._invEl = el("div", "cs-miniBody", invBox);

    const logBox = el("div", "cs-miniPanel", bottom);
    el("div", "cs-miniTitle", logBox).textContent = "Лог";
    this._logEl = el("div", "cs-miniBody", logBox);

    this.refresh();
  }

  onOpen() {
    // когда вкладка открылась — обновим (на случай если инвентарь менялся)
    this.refresh();
  }

  destroy() {
    // DOM удалит SystemMenu, но стиль оставим один раз (норм)
    this.host = null;
  }

  refresh() {
    if (!this.host) return;

    const recipes = this._recipes();
    if (!this.selected && recipes[0]) this.selected = recipes[0].id;

    // stations active state
    if (this._stationEl) {
      const btns = [...this._stationEl.querySelectorAll(".cs-stBtn")];
      const stations = [
        "shipyard_bench","fabricator","smelter","chem_reactor","gas_compressor"
      ];
      btns.forEach((b, i) => b.classList.toggle("is-active", stations[i] === this.station));
    }

    this._renderList(recipes);
    this._renderDetails(recipes);
    this._renderInv();
    this._renderLog();
  }

  _canCraft(recipe) {
    const crafting = this._get("crafting");
    return crafting ? crafting.canCraft(recipe.id, { station: this.station }) : false;
  }

  _craft(recipe) {
    const crafting = this._get("crafting");
    if (!crafting) return;

    const res = crafting.craft(recipe.id, { station: this.station });
    if (!res.ok) {
      const msg =
        res.reason === "NO_MATS" ? "Не хватает материалов" :
        res.reason === "NO_STATION" ? "Нужна станция" :
        res.reason === "WRONG_STATION" ? "Другая станция" :
        "Ошибка";
      this.log.unshift(`✖ ${recipe.name}: ${msg}`);
      this.log = this.log.slice(0, 8);
      this.refresh();
      return;
    }

    this.log.unshift(`✔ Скрафчено: ${recipe.name}`);
    this.log = this.log.slice(0, 8);
    this.refresh();
  }

  _renderList(recipes) {
    if (!this._listEl) return;
    this._listEl.innerHTML = "";

    for (const r of recipes) {
      const row = el("button", "cs-row", this._listEl);
      row.classList.toggle("is-active", this.selected === r.id);

      const left = el("div", "cs-rowLeft", row);
      el("div", "cs-rowName", left).textContent = r.name;
      el("div", "cs-rowStation", left).textContent = `станция: ${r.station ?? "—"}`;

      const ok = this._canCraft(r);
      const badge = el("div", "cs-badge", row);
      badge.textContent = ok ? "OK" : "НЕТ";
      badge.classList.toggle("is-ok", ok);

      row.addEventListener("click", () => {
        this.selected = r.id;
        this.refresh();
      });
    }
  }

  _renderDetails(recipes) {
    if (!this._detailsEl) return;
    this._detailsEl.innerHTML = "";

    const cur = recipes.find(r => r.id === this.selected);
    if (!cur) {
      this._detailsEl.textContent = "Нет рецептов.";
      return;
    }

    el("div", "cs-h1", this._detailsEl).textContent = cur.name;

    const req = el("div", "cs-muted", this._detailsEl);
    req.textContent = `Требуемая станция: ${cur.station ?? "—"} • Выбрана: ${this.station}`;

    el("div", "cs-h2", this._detailsEl).textContent = "Нужно:";
    const ul = el("div", "cs-ul", this._detailsEl);

    const inv = this._get("inventory");
    for (const it of cur.inputs) {
      const have = inv ? inv.get(it.id) : 0;
      const li = el("div", "cs-li", ul);
      li.classList.toggle("is-ok", have >= it.n);
      li.textContent = `• ${it.id}: ${have}/${it.n}`;
    }

    el("div", "cs-h2", this._detailsEl).textContent = "Результат:";
    el("div", "cs-li", this._detailsEl).textContent = `• ${cur.output.id}  +${cur.output.n}`;

    const actions = el("div", "cs-actions", this._detailsEl);

    const can = this._canCraft(cur);

    const b1 = el("button", "cs-actionBtn", actions);
    b1.textContent = "Создать";
    b1.disabled = !can;
    b1.addEventListener("click", () => this._craft(cur));

    const hint = el("div", "cs-hint", this._detailsEl);
    hint.textContent = "Модули/компоненты попадают в общий инвентарь. Дальше подключим автодокрафт зависимостей.";
  }

  _renderInv() {
    if (!this._invEl) return;
    const inv = this._get("inventory");
    const list = inv ? inv.entriesSorted() : [];

    this._invEl.innerHTML = list.length ? "" : "<div class='cs-muted'>Пусто</div>";
    for (let i = 0; i < Math.min(list.length, 18); i++) {
      const [k, v] = list[i];
      el("div", "cs-miniRow", this._invEl).textContent = `• ${k}: ${v}`;
    }
  }

  _renderLog() {
    if (!this._logEl) return;
    this._logEl.innerHTML = this.log.length ? "" : "<div class='cs-muted'>—</div>";
    for (const line of this.log) {
      el("div", "cs-miniRow", this._logEl).textContent = `• ${line}`;
    }
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "craftScreenStyles";
    st.textContent = `
      .cs-root{ display:flex; flex-direction:column; gap:12px; }
      .cs-top{ padding:10px 12px; border:1px solid rgba(160,200,255,.10); border-radius:12px; background: rgba(0,0,0,.18); }
      .cs-title{ font-weight:900; font-size:16px; color:#e8f0ff; }
      .cs-sub{ opacity:.7; font-size:12px; margin-top:4px; }

      .cs-stationRow{ display:flex; align-items:center; gap:10px; padding:6px 4px; }
      .cs-label{ opacity:.8; font-size:13px; min-width:70px; }
      .cs-stations{ display:flex; flex-wrap:wrap; gap:8px; }
      .cs-stBtn{
        padding:8px 10px; border-radius:12px;
        border:1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        cursor:pointer;
        font-weight:850;
        font-size:12px;
      }
      .cs-stBtn.is-active{
        border-color: rgba(0,255,220,.22);
        background: linear-gradient(90deg, rgba(0,255,220,.10), rgba(0,0,0,.18));
      }

      .cs-body{ display:grid; grid-template-columns: 420px 1fr; gap:12px; min-height:420px; }
      .cs-panel{
        border-radius:14px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.18);
        padding:12px;
      }
      .cs-panelTitle{ font-weight:900; margin-bottom:10px; opacity:.9; }
      .cs-list{ display:flex; flex-direction:column; gap:8px; }

      .cs-row{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:10px 10px;
        border-radius:12px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(255,255,255,.04);
        cursor:pointer;
        color:#eaf3ff;
        text-align:left;
      }
      .cs-row:hover{ background: rgba(255,255,255,.07); }
      .cs-row.is-active{ background: rgba(255,255,255,.12); border-color: rgba(0,255,220,.14); }

      .cs-rowLeft{ display:flex; flex-direction:column; gap:4px; }
      .cs-rowName{ font-weight:900; font-size:13px; }
      .cs-rowStation{ opacity:.65; font-size:12px; }

      .cs-badge{
        min-width:44px;
        text-align:center;
        padding:6px 10px;
        border-radius:12px;
        border:1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.22);
        opacity:.9;
        font-weight:900;
        font-size:12px;
      }
      .cs-badge.is-ok{ border-color: rgba(160,255,160,.22); color: rgba(190,255,190,.95); }

      .cs-details{ display:flex; flex-direction:column; gap:10px; }
      .cs-h1{ font-weight:950; font-size:16px; }
      .cs-h2{ font-weight:900; opacity:.9; margin-top:6px; }
      .cs-muted{ opacity:.65; font-size:12px; }
      .cs-ul{ display:flex; flex-direction:column; gap:6px; }
      .cs-li{ opacity:.85; font-size:13px; }
      .cs-li.is-ok{ color: rgba(190,255,190,.92); }

      .cs-actions{ display:flex; gap:10px; margin-top:8px; }
      .cs-actionBtn{
        padding:10px 12px;
        border-radius:12px;
        border:1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        cursor:pointer;
        font-weight:900;
      }
      .cs-actionBtn:disabled{
        opacity:.45;
        cursor:not-allowed;
      }

      .cs-hint{ opacity:.65; font-size:12px; margin-top:6px; }

      .cs-bottom{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
      .cs-miniPanel{
        border-radius:14px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.18);
        padding:12px;
        min-height:140px;
      }
      .cs-miniTitle{ font-weight:900; margin-bottom:8px; opacity:.9; }
      .cs-miniBody{ display:flex; flex-direction:column; gap:4px; }
      .cs-miniRow{ opacity:.78; font-size:12px; }
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}

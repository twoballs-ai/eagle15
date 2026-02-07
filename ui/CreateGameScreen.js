// ui/startScreen.js
import { RACES } from "../data/character/races.js";
import { CLASSES } from "../data/character/classes.js";
import { SHIP_CLASSES } from "../data/ship/shipClasses.js";

import { createPilotProfile } from "../data/character/pilot.js";
import { applyPilotModifiersToShipStats } from "../data/ship/applyPilotModifiers.js";

const NAMES_BY_RACE = {
  human: ["Александр","Илья","Максим","Даниил","Артём","Мария","Екатерина","Анна","Ольга","Виктория"],
  synth: ["NX-01","AXIOM","SIGMA","ORION","KERNEL"],
  aeon: ["Элион","Саар","Велис","Кайр","Аэтис"],
  drakar: ["Краг","Заррак","Дрек","Торрак","Шаар"],
  mycel: ["Спора-7","Коллектив-А","Мицел-Нод","Синтез"],
  voidborn: ["Нокс","Эхо","Люмен","Пульсар","Тень"],
};

const ICONS = {
  // races
  human: "👤",
  synth: "🤖",
  aeon: "✨",
  drakar: "🦎",
  mycel: "🍄",
  voidborn: "🌑",

  // pilot classes
  soldier: "🛡️",
  ace: "🚀",
  engineer: "🛠️",
  tactician: "🎯",
  specialist: "📡",

  // ship classes (если будет 6 – ок)
  scout: "🛰️",
  frigate: "🚢",
  destroyer: "💥",
  cruiser: "🛳️",
  battleship: "🧱",
  carrier: "🛸",
};

function fmt(v) {
  if (typeof v !== "number") return String(v);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function pct(v) {
  if (typeof v !== "number") return null;
  return `${Math.round(v * 100)}%`;
}

function fmtSignedPct(v) {
  const p = pct(v);
  if (p == null) return null;
  const n = Math.round(v * 100);
  return n >= 0 ? `+${n}%` : `${n}%`;
}

export class CreateGameScreen {
  constructor({ parent } = {}) {
    this.parent = parent ?? document.getElementById("ui-root") ?? document.body;

    this.root = null;

    // selected values (no <select>)
    this._raceId = "human";
    this._classId = "soldier";
    this._shipClassId = "scout";

    // refs
    this.nameInp = null;
    this.randomNameBtn = null;
    this.summaryEl = null;
    this.startBtn = null;
    this.backBtn = null;

    this._raceRow = null;
    this._classRow = null;
    this._shipRow = null;

    this._raceHelp = null;
    this._classHelp = null;
    this._shipHelp = null;

    this.onStart = null;
    this.onBack = null;

    this._handlers = {};
    this._styleEl = null;
  }

  mount() {
    if (this.root) return;

    this._injectStyles();

    const root = document.createElement("div");
    this.root = root;
    root.id = "createGameUI";
    root.className = "cg-root";
    root.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "cg-panel";

    panel.innerHTML = `
      <div class="cg-topbar">
        <div class="cg-brand">
          <div class="cg-logo" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="M32 6l18 10v16c0 14-8 22-18 26C22 54 14 46 14 32V16L32 6z" fill="currentColor" opacity=".18"/>
              <path d="M32 10l14 8v14c0 12-6.8 18.7-14 22-7.2-3.3-14-10-14-22V18l14-8z" fill="currentColor" opacity=".38"/>
              <path d="M22 34l8-14 4 8 8-4-10 18-4-8-6 0z" fill="currentColor" opacity=".9"/>
            </svg>
          </div>
          <div>
            <div class="cg-title">Новая игра</div>
            <div class="cg-subtitle">Создание пилота • CAPTAIN REGISTRY</div>
          </div>
        </div>

        <div class="cg-status">
          <div class="cg-chip"><span class="cg-dot"></span>READY</div>
          <div class="cg-chip cg-chip2">HANGAR • INIT</div>
        </div>
      </div>

      <div class="cg-grid">
        <!-- LEFT -->
        <div class="cg-card">
          <div class="cg-cardHeader">
            <div class="cg-cardTitle">Параметры</div>
            <div class="cg-cardHint">выбор иконками</div>
          </div>

          <div class="cg-form">
            <div class="cg-field">
              <div class="cg-label">Раса</div>
              <div class="cg-pickRow" data-id="raceRow"></div>

            </div>

            <div class="cg-field">
              <div class="cg-label">Класс пилота</div>
              <div class="cg-pickRow" data-id="classRow"></div>

            </div>

            <div class="cg-field">
              <div class="cg-label">Корабль</div>
              <div class="cg-pickRow" data-id="shipRow"></div>

            </div>

            <div class="cg-field">
              <div class="cg-label">Имя пилота</div>
              <div class="cg-nameRow">
                <input data-id="nameInput" class="cg-control cg-input" placeholder="Введите имя пилота..." />
                <button data-id="randomNameBtn" class="cg-iconBtn" title="Случайное имя" aria-label="Случайное имя">🎲</button>
              </div>
              <div class="cg-help">Можно оставить пустым — назначим имя автоматически.</div>
            </div>
          </div>

          <div class="cg-divider"></div>

          <div class="cg-actions">
            <button data-id="backBtn" class="cg-btn cg-btnGhost">
              <span class="cg-btnIco">←</span>
              <span class="cg-btnText">
                <span class="cg-btnMain">Назад</span>
                <span class="cg-btnSub">в главное меню</span>
              </span>
            </button>

            <button data-id="startBtn" class="cg-btn cg-btnPrimary">
              <span class="cg-btnIco">▶</span>
              <span class="cg-btnText">
                <span class="cg-btnMain">Запуск</span>
                <span class="cg-btnSub">инициализировать рейс</span>
              </span>
              <span class="cg-btnGlow"></span>
            </button>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="cg-card cg-cardWide">
          <div class="cg-cardHeader">
            <div class="cg-cardTitle">Сводка</div>
            <div class="cg-cardHint">паспорт • ТТХ</div>
          </div>

          <div data-id="summary" class="cg-summary">...</div>

          <div class="cg-bottomHint">
            Выбор без скролла: карточки переносятся в 2–3 ряда, лишнее скрывается.
          </div>
        </div>
      </div>

      <div class="cg-scanline" aria-hidden="true"></div>
      <div class="cg-noise" aria-hidden="true"></div>
    `;

    root.appendChild(panel);
    this.parent.appendChild(root);

    const q = (sel) => panel.querySelector(sel);

    this._raceRow = q('[data-id="raceRow"]');
    this._classRow = q('[data-id="classRow"]');
    this._shipRow = q('[data-id="shipRow"]');

    this._raceHelp = q('[data-id="raceHelp"]');
    this._classHelp = q('[data-id="classHelp"]');
    this._shipHelp = q('[data-id="shipHelp"]');

    this.nameInp = q('[data-id="nameInput"]');
    this.randomNameBtn = q('[data-id="randomNameBtn"]');
    this.summaryEl = q('[data-id="summary"]');
    this.startBtn = q('[data-id="startBtn"]');
    this.backBtn = q('[data-id="backBtn"]');

    // defaults by data
    this._raceId = this._raceId in RACES ? this._raceId : (Object.keys(RACES)[0] ?? "human");
    this._classId = this._classId in CLASSES ? this._classId : (Object.keys(CLASSES)[0] ?? "soldier");
    this._shipClassId = this._shipClassId in SHIP_CLASSES ? this._shipClassId : (Object.keys(SHIP_CLASSES)[0] ?? "scout");

    this._renderPickers();
    this._bind();

    this._setRandomName();
    this._updateSummary();
  }

  show() {
    this.mount();
    this.root.style.display = "flex";
    requestAnimationFrame(() => this.root.classList.add("cg-visible"));
  }

  hide() {
    if (!this.root) return;
    this.root.classList.remove("cg-visible");
    setTimeout(() => {
      if (this.root) this.root.style.display = "none";
    }, 160);
  }

  destroy() {
    const h = this._handlers;

    if (this.nameInp && h.onNameInput) this.nameInp.removeEventListener("input", h.onNameInput);
    if (this.randomNameBtn && h.onRandomClick) this.randomNameBtn.removeEventListener("click", h.onRandomClick);
    if (this.startBtn && h.onStartClick) this.startBtn.removeEventListener("click", h.onStartClick);
    if (this.backBtn && h.onBackClick) this.backBtn.removeEventListener("click", h.onBackClick);

    if (this._raceRow && h.onRacePick) this._raceRow.removeEventListener("click", h.onRacePick);
    if (this._classRow && h.onClassPick) this._classRow.removeEventListener("click", h.onClassPick);
    if (this._shipRow && h.onShipPick) this._shipRow.removeEventListener("click", h.onShipPick);

    this._handlers = {};
    try { this.root?.remove(); } catch (_) {}
    this.root = null;
  }

  getSelection() {
    return {
      name: (this.nameInp?.value || "").trim(),
      raceId: this._raceId,
      classId: this._classId,
      shipClassId: this._shipClassId,
    };
  }

  // =================== pickers ===================

  _renderPickers() {
    this._renderPickerRow(this._raceRow, "race", Object.keys(RACES), (id) => ({
      id,
      title: RACES[id]?.name || id,
      sub: "раса",
      ico: ICONS[id] ?? "◆",
    }));

    this._renderPickerRow(this._classRow, "class", Object.keys(CLASSES), (id) => ({
      id,
      title: CLASSES[id]?.name || id,
      sub: "роль",
      ico: ICONS[id] ?? "◆",
    }));

    this._renderPickerRow(this._shipRow, "ship", Object.keys(SHIP_CLASSES), (id) => ({
      id,
      title: SHIP_CLASSES[id]?.name || id,
      sub: "корпус",
      ico: ICONS[id] ?? "◆",
    }));

    this._syncPickerActive();
  }

  _renderPickerRow(host, kind, ids, getData) {
    if (!host) return;
    host.innerHTML = "";
    host.dataset.kind = kind;

    for (const id of ids) {
      const d = getData(id);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cg-pill";
      btn.dataset.id = id;
      btn.dataset.kind = kind;
      btn.title = d.title;

      btn.innerHTML = `
        <span class="cg-pillIco">${d.ico}</span>
        <span class="cg-pillTxt">
          <span class="cg-pillMain">${d.title}</span>
        </span>
        <span class="cg-pillGlow"></span>
      `;

      host.appendChild(btn);
    }
  }

  _syncPickerActive() {
    const setActive = (row, pickedId) => {
      if (!row) return;
      for (const el of row.querySelectorAll(".cg-pill")) {
        const on = el.dataset.id === pickedId;
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      }
    };

    setActive(this._raceRow, this._raceId);
    setActive(this._classRow, this._classId);
    setActive(this._shipRow, this._shipClassId);
  }

  // =================== events ===================

  _bind() {
    const h = this._handlers;

    h.onRacePick = (e) => {
      const b = e.target?.closest?.(".cg-pill");
      if (!b || b.dataset.kind !== "race") return;
      this._raceId = b.dataset.id;
      this._syncPickerActive();
      this._setRandomName();
      this._updateSummary();
    };

    h.onClassPick = (e) => {
      const b = e.target?.closest?.(".cg-pill");
      if (!b || b.dataset.kind !== "class") return;
      this._classId = b.dataset.id;
      this._syncPickerActive();
      this._updateSummary();
    };

    h.onShipPick = (e) => {
      const b = e.target?.closest?.(".cg-pill");
      if (!b || b.dataset.kind !== "ship") return;
      this._shipClassId = b.dataset.id;
      this._syncPickerActive();
      this._updateSummary();
    };

    h.onNameInput = () => this._updateSummary();
    h.onRandomClick = () => { this._setRandomName(); this._updateSummary(); };

    h.onBackClick = () => {
      this.onBack?.();
      this.hide();
    };

    h.onStartClick = () => {
      if (!this.onStart) return;
      const cfg = this.getSelection();
      if (!cfg.name) {
        this._setRandomName();
        cfg.name = this.getSelection().name;
      }
      this.onStart(cfg);
    };

    this._raceRow?.addEventListener("click", h.onRacePick);
    this._classRow?.addEventListener("click", h.onClassPick);
    this._shipRow?.addEventListener("click", h.onShipPick);

    this.nameInp?.addEventListener("input", h.onNameInput);
    this.randomNameBtn?.addEventListener("click", h.onRandomClick);
    this.backBtn?.addEventListener("click", h.onBackClick);
    this.startBtn?.addEventListener("click", h.onStartClick);
  }

  _setRandomName() {
    const raceId = this._raceId || "human";
    const list = NAMES_BY_RACE[raceId];
    if (!this.nameInp) return;

    if (!list || list.length === 0) this.nameInp.value = "Пилот";
    else this.nameInp.value = list[Math.floor(Math.random() * list.length)];
  }

  _updateSummary() {
    if (!this.summaryEl) return;

    const { name, raceId, classId, shipClassId } = this.getSelection();

    const race = RACES[raceId];
    const cls = CLASSES[classId];
    const shipCls = SHIP_CLASSES[shipClassId];

    // ✅ подсказки слева больше не нужны — переносим в сводку
    if (this._raceHelp) this._raceHelp.textContent = "";
    if (this._classHelp) this._classHelp.textContent = "";
    if (this._shipHelp) this._shipHelp.textContent = "";

    const pilot = createPilotProfile({
      id: "preview_pilot",
      name: name || "—",
      raceId,
      classId,
      factionId: "player",
    });

    const baseShipStats = shipCls?.baseStats || { hull: 0, shields: 0, energy: 0, speed: 0 };
    const finalShipStats = applyPilotModifiersToShipStats(baseShipStats, pilot.modifiers);

    // ✅ показываем модификаторы (если есть) – как “характеристики выбранных”
    const mods = pilot?.modifiers || {};
    const modLines = [];
    const MOD_LABELS = {
      shipHullMul: "Корпус",
      shipShieldsMul: "Щиты",
      shipEnergyMul: "Энергия",
      shipSpeedMul: "Скорость",
      weaponDamageMul: "Урон оружия",
      weaponCooldownMul: "Кулдаун оружия",
      sensorRangeMul: "Дальность сенсоров",
      repairRateMul: "Ремонт",
      ecmPowerMul: "РЭБ",
      shipTurnMul: "Манёвренность",
    };
    for (const k of Object.keys(MOD_LABELS)) {
      if (mods[k] == null || mods[k] === 0) continue;
      modLines.push(`• ${MOD_LABELS[k]}: ${fmtSignedPct(mods[k])}`);
    }
    if (!modLines.length) modLines.push("• нет активных бонусов");

    const lines = [
      `◆ ПАСПОРТ ПИЛОТА`,
      `Имя: ${name || "—"}`,
      `Раса: ${race?.name || raceId}`,
      race?.description ? `${race.description}` : "",
      ``,
      `Роль: ${cls?.name || classId}`,
      cls?.description ? `${cls.description}` : "",
      ``,
      `◆ ОСОБЕННОСТИ (бонусы пилота)`,
      ...modLines,
      ``,
      `◆ КОРАБЕЛЬНЫЙ ПАКЕТ`,
      `Корпус: ${shipCls?.name || shipClassId}`,
      shipCls?.description || shipCls?.desc ? `${shipCls.description || shipCls.desc}` : "",
      ``,
      `◆ ТТХ КОРАБЛЯ (с модификаторами пилота)`,
      `🧱 Корпус: ${finalShipStats.hull}`,
      `🛡️ Щиты: ${finalShipStats.shields}`,
      `⚡ Энергия: ${finalShipStats.energy}`,
      `🚀 Скорость: ${fmt(finalShipStats.speed)}`,
    ].filter(Boolean);

    this.summaryEl.textContent = lines.join("\n");
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "createGameUIStyles";
    st.textContent = `
      .cg-root{
        position:fixed; inset:0; z-index:2100;
        display:flex; align-items:center; justify-content:center;
        padding: 12px;
        pointer-events: auto;
        background:
          radial-gradient(1200px 700px at 50% 22%, rgba(80,140,255,.18), rgba(0,0,0,.86)),
          radial-gradient(900px 500px at 20% 70%, rgba(0,255,220,.06), transparent 60%),
          radial-gradient(900px 500px at 80% 70%, rgba(255,120,220,.05), transparent 60%);
        color:#e8f0ff;
        font-family: system-ui, Segoe UI, Arial;
        letter-spacing: .2px;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity .16s ease, transform .16s ease;
      }
      .cg-root.cg-visible{ opacity:1; transform: translateY(0px); }

      /* ✅ шире панель */
      .cg-panel{
        width:min(1480px, calc(100vw - 24px)); /* было 1240px */
        border-radius: 16px;
        overflow:hidden;
        position:relative;
        background: linear-gradient(180deg, rgba(10,14,24,.72), rgba(6,8,12,.86));
        border: 1px solid rgba(160,200,255,.14);
        box-shadow: 0 26px 90px rgba(0,0,0,.62), 0 0 0 1px rgba(0,0,0,.45) inset;
        backdrop-filter: blur(12px);
      }

      .cg-topbar{
        display:flex; align-items:center; justify-content:space-between;
        padding: 14px 16px;
        background:
          linear-gradient(90deg, rgba(40,120,255,.12), rgba(0,0,0,0) 45%),
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0));
        border-bottom: 1px solid rgba(160,200,255,.10);
      }
      .cg-brand{ display:flex; align-items:center; gap:12px; }
      .cg-logo{
        width:40px; height:40px; border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.20);
        background: rgba(0,0,0,.22);
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        color: rgba(120,220,255,.95);
      }
      .cg-logo svg{ width:26px; height:26px; display:block; }
      .cg-title{ font-weight: 900; font-size: 18px; letter-spacing: .6px; }
      .cg-subtitle{ opacity:.66; font-size: 12px; }

      .cg-status{ display:flex; gap:10px; align-items:center; }
      .cg-chip{
        display:flex; gap:8px; align-items:center;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.20);
        font-size: 12px;
        opacity: .9;
      }
      .cg-chip2{ opacity:.72; }
      .cg-dot{
        width:8px; height:8px; border-radius: 50%;
        background: rgba(0,255,200,.95);
        box-shadow: 0 0 14px rgba(0,255,200,.35);
      }

      /* ✅ чуть больше места сводке */
      .cg-grid{
        display:grid;
        grid-template-columns: 460px 1fr; /* было 420px */
        gap: 12px;
        padding: 12px;
      }
      @media (max-width: 980px){
        .cg-grid{ grid-template-columns: 1fr; }
      }

      .cg-card{
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.12);
        background: linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.12));
        box-shadow: 0 18px 50px rgba(0,0,0,.35);
        padding: 12px;
        position:relative;
        overflow:hidden;
      }
      .cg-card::before{
        content:"";
        position:absolute; inset:-1px;
        background:
          radial-gradient(520px 140px at 20% 0%, rgba(0,255,220,.08), transparent 60%),
          radial-gradient(520px 140px at 80% 0%, rgba(120,160,255,.08), transparent 60%);
        pointer-events:none;
      }

      .cg-cardHeader{
        display:flex; align-items:baseline; gap:10px;
        padding: 6px 6px 10px 6px;
      }
      .cg-cardTitle{ font-weight: 850; font-size: 13px; letter-spacing:.4px; }
      .cg-cardHint{ opacity:.62; font-size: 12px; }

      .cg-form{ padding: 6px; display:flex; flex-direction:column; gap:12px; }
      .cg-field{ display:flex; flex-direction:column; gap:8px; }
      .cg-label{ font-size:12px; opacity:.82; }


      /* ✅ NO SCROLLBARS: wrap to 2–3 rows, extra hidden */
      .cg-pickRow{
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)); /* 3 столбца */
        gap: 10px;
        padding: 2px 2px 6px 2px;

        overflow: hidden;              /* лишнее скрываем */
        grid-auto-rows: auto;
        max-height: calc(54px * 2 + 10px); /* 2 ряда (подгони под твою высоту пилюли) */
      }
      @media (max-width: 520px){
        .cg-pickRow{ max-height: 204px; }
      }

      .cg-pill{
        width: 100%;
        min-width: 0;   /* важно для grid, иначе будет раздувать */
        position:relative;
        display:flex; align-items:center; gap:10px;

        min-width: 140px;
        padding: 9px 10px;
        border-radius: 14px;

        cursor:pointer;
        user-select:none;
        border: 1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.18);
        color: #eaf3ff;

        transition: transform .12s ease, border-color .12s ease, background .12s ease;
        text-align:left;
        flex: 0 0 auto;
      }
      .cg-pill:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.26);
        background: rgba(0,0,0,.26);
      }
      .cg-pill:active{ transform: translateY(0px); }

      .cg-pillIco{
        width:32px; height:32px;
        border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.26);
        font-size: 17px;
      }
      .cg-pillTxt{ display:flex; flex-direction:column; gap:2px; min-width:0; }
      .cg-pillMain{
        font-weight: 900;
        font-size: 12.5px;
        letter-spacing:.3px;
        white-space: nowrap;
        overflow:hidden;
        text-overflow: ellipsis;
        max-width: 16ch;
      }


      .cg-pillGlow{
        position:absolute; inset:-1px;
        border-radius: 14px;
        pointer-events:none;
        box-shadow: 0 0 0 rgba(0,0,0,0);
      }
      .cg-pill.is-active{
        border-color: rgba(0,255,220,.26);
        background: linear-gradient(90deg, rgba(0,255,220,.10), rgba(0,0,0,.20));
      }
      .cg-pill.is-active .cg-pillIco{
        color: rgba(0,255,220,.95);
        box-shadow: 0 0 18px rgba(0,255,220,.14);
        border-color: rgba(0,255,220,.22);
      }
      .cg-pill.is-active .cg-pillGlow{
        box-shadow: 0 0 28px rgba(0,255,220,.10);
      }

      .cg-nameRow{ display:flex; gap:8px; align-items:center; }

      .cg-control{
        width:100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.22);
        color: #eaf3ff;
        outline: none;
        transition: border-color .12s ease, background .12s ease;
      }
      .cg-control:focus{
        border-color: rgba(80,170,255,.35);
        background: rgba(0,0,0,.28);
      }
      .cg-input{ flex:1; }

      .cg-iconBtn{
        width:44px; height:44px;
        border-radius: 12px;
        cursor:pointer;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.22);
        color: #eaf3ff;
        font-size: 18px;
        transition: transform .12s ease, border-color .12s ease, background .12s ease;
      }
      .cg-iconBtn:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.28);
      }
      .cg-iconBtn:active{ transform: translateY(0px); }

      .cg-divider{
        height:1px;
        margin: 8px 6px;
        background: linear-gradient(90deg, transparent, rgba(160,200,255,.16), transparent);
      }

      .cg-actions{
        padding: 6px;
        display:flex;
        gap:10px;
        justify-content: space-between;
      }
      .cg-btn{
        position:relative;
        flex: 1;
        display:flex; align-items:center; gap:10px;
        padding: 12px 12px;
        border-radius: 14px;
        cursor:pointer;
        user-select:none;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.18);
        color: #eaf3ff;
        transition: transform .12s ease, border-color .12s ease, background .12s ease, opacity .12s ease;
        text-align:left;
      }
      .cg-btn:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.26);
      }
      .cg-btn:active{ transform: translateY(0px); }
      .cg-btnIco{
        width:34px; height:34px; border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.18);
        background: rgba(0,0,0,.28);
        font-weight: 900;
      }
      .cg-btnText{ display:flex; flex-direction:column; gap:2px; }
      .cg-btnMain{ font-weight: 850; font-size: 13px; }
      .cg-btnSub{ font-size: 11px; opacity:.70; }

      .cg-btnPrimary{
        border-color: rgba(80,170,255,.28);
        background: linear-gradient(90deg, rgba(45,125,255,.22), rgba(0,0,0,.18));
      }
      .cg-btnPrimary .cg-btnIco{
        color: rgba(0,255,220,.95);
        box-shadow: 0 0 18px rgba(0,255,220,.16);
      }
      .cg-btnGlow{
        position:absolute; inset:-1px;
        border-radius: 14px;
        pointer-events:none;
        box-shadow: 0 0 0 rgba(0,0,0,0);
      }
      .cg-btnPrimary:hover .cg-btnGlow{
        box-shadow: 0 0 26px rgba(80,170,255,.18);
      }
      .cg-btnGhost{
        opacity:.92;
        border-color: rgba(255,255,255,.10);
      }

      .cg-summary{
        margin: 6px;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.18);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 12.5px;
        line-height: 1.45;
        white-space: pre-line;
        color: rgba(235,245,255,.95);
      }

      .cg-bottomHint{
        padding: 10px 10px 6px 10px;
        font-size: 12px;
        opacity: .70;
      }

      .cg-scanline{
        position:absolute; inset:0;
        pointer-events:none;
        background: linear-gradient(180deg, transparent, rgba(0,255,220,.08), transparent);
        opacity:.14;
        transform: translateY(-120%);
        animation: cgScan 6.2s linear infinite;
        mix-blend-mode: screen;
      }
      @keyframes cgScan{
        0%{ transform: translateY(-120%); }
        100%{ transform: translateY(120%); }
      }
      .cg-noise{
        position:absolute; inset:0;
        pointer-events:none;
        opacity:.08;
        background-image:
          repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 1px, transparent 2px, transparent 4px),
          repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 1px, transparent 2px, transparent 6px);
        mix-blend-mode: overlay;
      }
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}

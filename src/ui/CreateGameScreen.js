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

// 🎨 Цветовая тема расы (rgb-тройка → собираем rgba через var(--race-rgb)).
//    При выборе расы весь «паспорт» справа перекрашивается в её цвет.
const RACE_THEME = {
  human:    { rgb: "120,170,235" },
  synth:    { rgb: "90,210,255"  },
  aeon:     { rgb: "255,205,120" },
  drakar:   { rgb: "255,120,70"  },
  mycel:    { rgb: "205,120,235" },
  voidborn: { rgb: "150,110,255" },
};

// 🛡 Векторные эмблемы рас (вместо эмодзи → единый sci-fi язык, currentColor).
const RACE_EMBLEM = {
  human: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M24 6 L40 16 V30 C40 38 32 42 24 44 C16 42 8 38 8 30 V16 Z"/><path d="M24 16 L31 24 L24 34 L17 24 Z" fill="currentColor" stroke="none" opacity=".85"/></svg>`,
  synth: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M24 5 L40 14 V34 L24 43 L8 34 V14 Z"/><circle cx="18" cy="22" r="2.4" fill="currentColor" stroke="none"/><circle cx="30" cy="22" r="2.4" fill="currentColor" stroke="none"/><path d="M16 32 H32"/></svg>`,
  aeon: `<svg viewBox="0 0 48 48" fill="currentColor" stroke="none"><path d="M24 4 L27 18 L40 12 L30 22 L44 24 L30 26 L40 36 L27 30 L24 44 L21 30 L8 36 L18 26 L4 24 L18 22 L8 12 L21 18 Z" opacity=".9"/></svg>`,
  drakar: `<svg viewBox="0 0 48 48" fill="currentColor" stroke="none"><path d="M24 4 C30 14 36 16 40 14 C36 24 38 32 30 40 C28 32 26 30 24 28 C22 30 20 32 18 40 C10 32 12 24 8 14 C12 16 18 14 24 4 Z" opacity=".9"/></svg>`,
  mycel: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="24" cy="24" r="5" fill="currentColor" stroke="none"/><g stroke-linecap="round"><path d="M24 19 V8"/><path d="M24 29 V40"/><path d="M19 24 H8"/><path d="M29 24 H40"/><path d="M20.5 20.5 L12 12"/><path d="M27.5 27.5 L36 36"/><path d="M27.5 20.5 L36 12"/><path d="M20.5 27.5 L12 36"/></g><circle cx="24" cy="8" r="2" fill="currentColor" stroke="none"/><circle cx="24" cy="40" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="24" r="2" fill="currentColor" stroke="none"/><circle cx="40" cy="24" r="2" fill="currentColor" stroke="none"/></svg>`,
  voidborn: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="24" cy="24" r="7" fill="currentColor" stroke="none"/><ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(25 24 24)"/><path d="M24 4 V10 M24 38 V44 M4 24 H10 M38 24 H44" stroke-linecap="round"/></svg>`,
};

// ⚙ Линейные иконки классов пилота.
const CLASS_ICON = {
  soldier: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z"/></svg>`,
  ace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3 C15 6 16 10 16 14 L12 17 L8 14 C8 10 9 6 12 3 Z"/><path d="M8 14 L5 17 M16 14 L19 17"/><circle cx="12" cy="10" r="1.6"/></svg>`,
  engineer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><g stroke-linecap="round"><path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.5 7.5 M16.5 16.5 L18.5 18.5 M18.5 5.5 L16.5 7.5 M7.5 16.5 L5.5 18.5"/></g></svg>`,
  tactician: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/><path d="M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22" stroke-linecap="round"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  specialist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 20 V11"/><circle cx="12" cy="9" r="2" fill="currentColor" stroke="none"/><path d="M7 7 A7 7 0 0 1 17 7"/><path d="M4.5 4.5 A11 11 0 0 1 19.5 4.5"/></svg>`,
  recon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 12 C5 7 9 5 12 5 C15 5 19 7 22 12 C19 17 15 19 12 19 C9 19 5 17 2 12 Z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  scout_pilot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 12 C5 7 9 5 12 5 C15 5 19 7 22 12 C19 17 15 19 12 19 C9 19 5 17 2 12 Z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
};

// 🚀 Силуэты кораблей (вид сверху).
const SHIP_ICON = {
  scout: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3 L15 13 L12 11 L9 13 Z" opacity=".9"/><path d="M9 13 L6 18 L9 16 Z M15 13 L18 18 L15 16 Z" opacity=".6"/></svg>`,
  frigate: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2 L16 14 L12 12 L8 14 Z"/><path d="M8 14 L4 19 L8 17 Z M16 14 L20 19 L16 17 Z" opacity=".7"/></svg>`,
  destroyer: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2 L17 15 L12 12 L7 15 Z"/><path d="M7 13 L2 18 L7 16 Z M17 13 L22 18 L17 16 Z"/><path d="M10 15 L9 21 L12 18 L15 21 L14 15 Z" opacity=".7"/></svg>`,
  cruiser: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2 L18 16 L12 13 L6 16 Z"/><path d="M6 12 L2 17 L6 15 Z M18 12 L22 17 L18 15 Z"/><rect x="10.5" y="14" width="3" height="7" opacity=".7"/></svg>`,
  battleship: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2 L19 17 L12 14 L5 17 Z"/><path d="M5 11 L1 16 L5 14 Z M19 11 L23 16 L19 14 Z"/><rect x="9" y="15" width="6" height="7" opacity=".8"/></svg>`,
  carrier: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="9" y="3" width="6" height="18" rx="2"/><path d="M9 7 L4 9 L4 13 L9 11 Z M15 7 L20 9 L20 13 L15 11 Z" opacity=".7"/></svg>`,
};

const FALLBACK_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3 L20 12 L12 21 L4 12 Z" opacity=".7"/></svg>`;

// Условные «потолки» для полосок ТТХ (чтобы бары были наглядны и реагировали на бонусы).
const STAT_MAX = { hull: 250, shields: 200, energy: 150, speed: 3 };

const MOD_LABELS = {
  shipHullMul: "Корпус", shipShieldsMul: "Щиты", shipEnergyMul: "Энергия", shipSpeedMul: "Скорость",
  weaponDamageMul: "Урон оружия", weaponCooldownMul: "Кулдаун оружия", sensorRangeMul: "Сенсоры",
  repairRateMul: "Ремонт", ecmPowerMul: "РЭБ", shipTurnMul: "Манёвренность",
};

function fmt(v) {
  if (typeof v !== "number") return String(v);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}
function fmtSignedPct(v) {
  const n = Math.round(v * 100);
  return n >= 0 ? `+${n}%` : `${n}%`;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export class CreateGameScreen {
  constructor({ parent } = {}) {
    this.parent = parent ?? document.getElementById("ui-root") ?? document.body;
    this.root = null;

    this._raceId = "human";
    this._classId = "soldier";
    this._shipClassId = "scout";

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

    this._regCode = "";

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
            <div class="cg-title">КАПИТАНСКИЙ РЕЕСТР</div>
            <div class="cg-subtitle">Регистрация пилота • EAGLE-15</div>
          </div>
        </div>
        <div class="cg-status">
          <div class="cg-chip"><span class="cg-dot"></span>ГОТОВ К ИНИЦИАЛИЗАЦИИ</div>
        </div>
      </div>

      <div class="cg-grid">
        <div class="cg-card">
          <div class="cg-cardHeader">
            <div class="cg-cardTitle">Параметры экипажа</div>
            <div class="cg-cardHint">раса • роль • корпус</div>
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
              <div class="cg-label">Класс корабля</div>
              <div class="cg-pickRow" data-id="shipRow"></div>
            </div>
            <div class="cg-field">
              <div class="cg-label">Позывной пилота</div>
              <div class="cg-nameRow">
                <input data-id="nameInput" class="cg-control cg-input" placeholder="Введите позывной..." />
                <button data-id="randomNameBtn" class="cg-iconBtn" title="Случайный позывной" aria-label="Случайный позывной">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.4" fill="currentColor" stroke="none"/></svg>
                </button>
              </div>
              <div class="cg-help">Пустое поле → позывной назначит бортовой ИИ.</div>
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
                <span class="cg-btnMain">Запуск рейса</span>
                <span class="cg-btnSub">инициализировать прыжок</span>
              </span>
              <span class="cg-btnGlow"></span>
            </button>
          </div>
        </div>

        <div class="cg-card cg-cardWide">
          <div class="cg-cardHeader">
            <div class="cg-cardTitle">Бортовое досье</div>
            <div class="cg-cardHint">паспорт • ТТХ</div>
          </div>
          <div data-id="summary" class="cg-summary"></div>
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

    this._raceId = this._raceId in RACES ? this._raceId : (Object.keys(RACES)[0] ?? "human");
    this._classId = this._classId in CLASSES ? this._classId : (Object.keys(CLASSES)[0] ?? "soldier");
    this._shipClassId = this._shipClassId in SHIP_CLASSES ? this._shipClassId : (Object.keys(SHIP_CLASSES)[0] ?? "scout");

    this._regCode = "E15-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);

    this._renderPickers();
    this._bind();
    this._setRandomName();
    this._applyRaceTheme();
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
    setTimeout(() => { if (this.root) this.root.style.display = "none"; }, 160);
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

  // ===== тема расы: ставим rgb-тройку в CSS-переменную на корне =====
  _applyRaceTheme() {
    if (!this.root) return;
    const t = RACE_THEME[this._raceId] ?? RACE_THEME.human;
    this.root.style.setProperty("--race-rgb", t.rgb);
  }

  _renderPickers() {
    this._renderPickerRow(this._raceRow, "race", Object.keys(RACES), (id) => ({
      id, title: RACES[id]?.name || id, ico: RACE_EMBLEM[id] ?? FALLBACK_ICON,
    }));
    this._renderPickerRow(this._classRow, "class", Object.keys(CLASSES), (id) => ({
      id, title: CLASSES[id]?.name || id, ico: CLASS_ICON[id] ?? FALLBACK_ICON,
    }));
    this._renderPickerRow(this._shipRow, "ship", Object.keys(SHIP_CLASSES), (id) => ({
      id, title: SHIP_CLASSES[id]?.name || id, ico: SHIP_ICON[id] ?? FALLBACK_ICON,
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
        <span class="cg-pillTxt"><span class="cg-pillMain">${esc(d.title)}</span></span>
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

  _bind() {
    const h = this._handlers;
    h.onRacePick = (e) => {
      const b = e.target?.closest?.(".cg-pill");
      if (!b || b.dataset.kind !== "race") return;
      this._raceId = b.dataset.id;
      this._syncPickerActive();
      this._setRandomName();
      this._applyRaceTheme();
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
    h.onBackClick = () => { this.onBack?.(); this.hide(); };
    h.onStartClick = () => {
      if (!this.onStart) return;
      const cfg = this.getSelection();
      if (!cfg.name) { this._setRandomName(); cfg.name = this.getSelection().name; }
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
    const list = NAMES_BY_RACE[this._raceId || "human"];
    if (!this.nameInp) return;
    this.nameInp.value = (!list || !list.length) ? "Пилот" : list[Math.floor(Math.random() * list.length)];
  }

  // ===== построение «паспорта пилота» (DOM, а не моноширинный текст) =====
  _bar(label, value, max) {
    const w = Math.max(0, Math.min(100, (Number(value) / max) * 100));
    return `<div class="cg-bar">
      <div class="cg-barLabel"><span>${label}</span><span class="cg-barVal">${fmt(value)}</span></div>
      <div class="cg-barTrack"><div class="cg-barFill" style="width:${w.toFixed(1)}%"></div></div>
    </div>`;
  }

  _updateSummary() {
    if (!this.summaryEl) return;
    const { name, raceId, classId, shipClassId } = this.getSelection();
    const race = RACES[raceId];
    const cls = CLASSES[classId];
    const shipCls = SHIP_CLASSES[shipClassId];

    const emblem = RACE_EMBLEM[raceId] ?? FALLBACK_ICON;
    const shipIco = SHIP_ICON[shipClassId] ?? FALLBACK_ICON;

    const pilot = createPilotProfile({ id: "preview_pilot", name: name || "—", raceId, classId, factionId: "player" });
    const base = shipCls?.baseStats || { hull: 0, shields: 0, energy: 0, speed: 0 };
    const final = applyPilotModifiersToShipStats(base, pilot.modifiers);

    const mods = pilot?.modifiers || {};
    let chips = "";
    for (const k of Object.keys(MOD_LABELS)) {
      const v = mods[k];
      if (v == null || v === 0) continue;
      chips += `<span class="cg-bonus ${v > 0 ? "cg-bonusPos" : "cg-bonusNeg"}">${fmtSignedPct(v)} ${MOD_LABELS[k]}</span>`;
    }
    if (!chips) chips = `<span class="cg-bonus cg-bonusNeutral">особенности не выявлены</span>`;

    const desc = [race?.description, cls?.description].filter(Boolean).join(" ");

    this.summaryEl.innerHTML = `
      <div class="cg-id">
        <span class="cg-idCorner tl"></span><span class="cg-idCorner tr"></span>
        <span class="cg-idCorner bl"></span><span class="cg-idCorner br"></span>

        <div class="cg-idTop">
          <div class="cg-idEmblem">${emblem}</div>
          <div class="cg-idHead">
            <div class="cg-idRole">${esc(cls?.name || classId)} <span class="cg-idSep">/</span> ${esc(race?.name || raceId)}</div>
            <div class="cg-idName">${esc(name || "—")}</div>
            <div class="cg-idReg">REG // ${this._regCode}</div>
          </div>
        </div>

        <div class="cg-idDesc">${esc(desc) || "Данные досье недоступны."}</div>

        <div class="cg-idSection">
          <div class="cg-idSectionTitle">Корабельный пакет</div>
          <div class="cg-idShipRow">
            <div class="cg-idShipIco">${shipIco}</div>
            <div class="cg-idShipInfo">
              <div class="cg-idShipName">${esc(shipCls?.name || shipClassId)}</div>
              <div class="cg-idShipDesc">${esc(shipCls?.description || shipCls?.desc || "Стандартный корпус без особых отметок.")}</div>
            </div>
          </div>
        </div>

        <div class="cg-idSection">
          <div class="cg-idSectionTitle">ТТХ корпуса <span class="cg-idSectionHint">(с модификаторами пилота)</span></div>
          ${this._bar("КОРПУС", final.hull, STAT_MAX.hull)}
          ${this._bar("ЩИТЫ", final.shields, STAT_MAX.shields)}
          ${this._bar("ЭНЕРГИЯ", final.energy, STAT_MAX.energy)}
          ${this._bar("СКОРОСТЬ", final.speed, STAT_MAX.speed)}
        </div>

        <div class="cg-idSection">
          <div class="cg-idSectionTitle">Особенности пилота</div>
          <div class="cg-idBonus">${chips}</div>
        </div>
      </div>
    `;
  }
getRepLabel(value) {
    if (value >= 20) return { text: "Благоприятно", class: "cg-bonusPos" };
    if (value >= 0) return { text: "Нейтрально", class: "cg-bonusNeutral" };
    if (value >= -20) return { text: "С подозрением", class: "cg-bonusNeg" };
    return { text: "Враждебно", class: "cg-bonusNeg" };
  }

  _renderFactionPreview() {
    // Импортируем матрицу (добавь импорт в начало файла: import { RACE_FACTION_BIAS } from "../data/character/raceReputation.js";)
    const bias = RACE_FACTION_BIAS[this._raceId] || RACE_FACTION_BIAS.human;
    
    const factions = [
      { id: 'union', name: 'Союз', value: bias.union },
      { id: 'traders', name: 'Торговцы', value: bias.traders },
      { id: 'pirates', name: 'Пираты', value: bias.pirates },
    ];

    return factions.map(f => {
      const label = this._getRepLabel(f.value);
      const sign = f.value > 0 ? '+' : '';
      return `
        <div class="cg-repRow">
          <span class="cg-repName">${f.name}</span>
          <span class="cg-repValue ${label.class}">${sign}${f.value}</span>
          <span class="cg-repStatus">${label.text}</span>
        </div>
      `;
    }).join('');
  }
  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.id = "createGameUIStyles";
    st.textContent = `
    .cg-root{
        position:fixed; inset:0; z-index:2000001;
        overflow: hidden; /* Жестко обрезаем всё, что вылезает за экран */
        display:flex; align-items:center; justify-content:center;
        padding: 12px; pointer-events:auto;
        --race-rgb: 120,170,235;
        background:
          radial-gradient(1200px 700px at 50% 18%, rgba(var(--race-rgb),.10), transparent 60%),
          radial-gradient(1000px 600px at 50% 22%, rgba(80,140,255,.14), rgba(0,0,0,.90)),
          radial-gradient(900px 500px at 80% 80%, rgba(var(--race-rgb),.06), transparent 60%);
        color:#e8f0ff; font-family: system-ui, Segoe UI, Arial; letter-spacing:.2px;
        opacity:0; transform: translateY(6px);
        transition: opacity .16s ease, transform .16s ease;
      }
      .cg-root.cg-visible{ opacity:1; transform: translateY(0); }

      .cg-panel{
        /* 🚨 ИСПРАВЛЕНО: 100% вместо 100vw. 100vw включает ширину скроллбара, 100% — нет. */
        width: min(1320px, 100%);
        max-height: calc(100vh - 24px);
        
        /* 🚨 ИСПРАВЛЕНО: запрещаем горизонтальный скролл, вертикальный оставляем только при реальной необходимости */
        overflow-x: hidden;
        overflow-y: auto;
        
        border-radius: 16px; position:relative;
        background: linear-gradient(180deg, rgba(10,14,24,.78), rgba(6,8,12,.90));
        border: none;
        box-shadow: 0 26px 90px rgba(0,0,0,.62), 0 0 0 1px rgba(0,0,0,.45) inset;
        backdrop-filter: blur(12px);
        
        /* Сглаживание скролла для эстетики */
/* Невидимый скроллбар для Firefox */
scrollbar-width: none;
/* Невидимый скроллбар для Chrome/Safari/Edge */
&::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
      }
      .cg-topbar{
        display:flex; align-items:center; justify-content:space-between;
        padding: 14px 18px;
        background:
          linear-gradient(90deg, rgba(var(--race-rgb),.14), rgba(0,0,0,0) 55%),
          linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0));
        border-bottom: 1px solid rgba(var(--race-rgb),.18);
      }
      .cg-brand{ display:flex; align-items:center; gap:12px; }
      .cg-logo{
        width:42px; height:42px; border-radius: 12px; display:grid; place-items:center;
        border: none; background: rgba(0,0,0,.28);
        box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 0 1px rgba(var(--race-rgb),.30) inset;
        color: rgb(var(--race-rgb));
      }
      .cg-logo svg{ width:26px; height:26px; display:block; }
      .cg-title{ font-weight: 900; font-size: 17px; letter-spacing: 1.2px; }
      .cg-subtitle{ opacity:.6; font-size: 11px; letter-spacing:.6px; }
      .cg-status{ display:flex; gap:10px; align-items:center; }
      .cg-chip{
        display:flex; gap:8px; align-items:center; padding: 6px 12px; border-radius: 999px;
        border: none; background: rgba(0,0,0,.24); font-size: 11px; letter-spacing:.5px; opacity:.92;
        box-shadow: 0 0 0 1px rgba(var(--race-rgb),.22) inset;
      }
      .cg-dot{ width:8px; height:8px; border-radius:50%; background: rgb(var(--race-rgb)); box-shadow: 0 0 14px rgba(var(--race-rgb),.5); }

      .cg-grid{ display:grid; grid-template-columns: 440px 1fr; gap: 12px; padding: 12px; }
      @media (max-width: 980px){ .cg-grid{ grid-template-columns: 1fr; } }

      .cg-card{
        border-radius: 14px; border: none;
        background: linear-gradient(180deg, rgba(0,0,0,.24), rgba(0,0,0,.12));
        box-shadow: 0 18px 50px rgba(0,0,0,.35);
        padding: 12px; position:relative; overflow:hidden;
      }
      .cg-card::before{
        content:""; position:absolute; inset:-1px; pointer-events:none;
        background:
          radial-gradient(520px 140px at 20% 0%, rgba(var(--race-rgb),.10), transparent 60%),
          radial-gradient(520px 140px at 80% 0%, rgba(120,160,255,.06), transparent 60%);
      }
      .cg-cardHeader{ display:flex; align-items:baseline; gap:10px; padding: 6px 6px 10px 6px; }
      .cg-cardTitle{ font-weight: 850; font-size: 13px; letter-spacing:.6px; text-transform:uppercase; }
      .cg-cardHint{ opacity:.55; font-size: 11px; }

      .cg-form{ padding: 6px; display:flex; flex-direction:column; gap:14px; }
      .cg-field{ display:flex; flex-direction:column; gap:8px; }
      .cg-label{ font-size:11px; opacity:.7; letter-spacing:.8px; text-transform:uppercase; }

      .cg-pickRow{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; padding: 2px 2px 4px 2px; }

      .cg-pill{
        width:100%; min-width:0; position:relative; display:flex; align-items:center; gap:10px;
        padding: 9px 10px; border-radius: 12px; cursor:pointer; user-select:none;
        border: 1px solid transparent; background: rgba(0,0,0,.20); color:#eaf3ff;
        transition: border-color .15s ease, background .15s ease, box-shadow .15s ease; text-align:left;
      }
      .cg-pill:hover{ background: rgba(60,100,180,.22); border-color: rgba(160,200,255,.22); }
      .cg-pillIco{
        width:34px; height:34px; border-radius: 10px; display:grid; place-items:center; flex:0 0 auto;
        border: none; background: rgba(0,0,0,.30); color: rgba(200,220,255,.62);
        transition: color .15s ease, box-shadow .15s ease, background .15s ease;
      }
      .cg-pillIco svg{ width:20px; height:20px; display:block; }
      .cg-pillTxt{ display:flex; flex-direction:column; gap:2px; min-width:0; }
      .cg-pillMain{ font-weight: 850; font-size: 12px; letter-spacing:.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .cg-pillGlow{ position:absolute; inset:-1px; border-radius:12px; pointer-events:none; }

      /* активный выбор: классы/корабли → бирюза */
      .cg-pill.is-active{ border-color: rgba(0,255,220,.30); background: linear-gradient(90deg, rgba(0,255,220,.10), rgba(0,0,0,.22)); }
      .cg-pill.is-active .cg-pillIco{ color: rgba(0,255,220,.95); box-shadow: 0 0 16px rgba(0,255,220,.16); background: rgba(0,255,220,.08); }
      .cg-pill.is-active .cg-pillGlow{ box-shadow: 0 0 24px rgba(0,255,220,.10); }
      /* активный выбор расы → цвет расы (перебивает бирюзу специфичностью) */
      .cg-pill[data-kind="race"].is-active{ border-color: rgba(var(--race-rgb),.55); background: linear-gradient(90deg, rgba(var(--race-rgb),.16), rgba(0,0,0,.22)); }
      .cg-pill[data-kind="race"].is-active .cg-pillIco{ color: rgb(var(--race-rgb)); box-shadow: 0 0 18px rgba(var(--race-rgb),.24); background: rgba(var(--race-rgb),.10); }
      .cg-pill[data-kind="race"].is-active .cg-pillGlow{ box-shadow: 0 0 26px rgba(var(--race-rgb),.16); }

      .cg-nameRow{ display:flex; gap:8px; align-items:center; }
      .cg-control{
        width:100%; padding: 11px 12px; border-radius: 12px; border: 1px solid transparent;
        background: rgba(0,0,0,.26); color:#eaf3ff; outline:none;
        transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
      }
      .cg-control:focus{ border-color: rgba(var(--race-rgb),.5); background: rgba(0,0,0,.32); box-shadow: 0 0 0 3px rgba(var(--race-rgb),.10); }
      .cg-input{ flex:1; }
      .cg-help{ font-size:11px; opacity:.5; }
      .cg-iconBtn{
        width:44px; height:44px; border-radius: 12px; cursor:pointer; display:grid; place-items:center;
        border: 1px solid transparent; background: rgba(0,0,0,.26); color: rgba(200,220,255,.8);
        transition: border-color .15s ease, background .15s ease, color .15s ease;
      }
      .cg-iconBtn svg{ width:20px; height:20px; }
      .cg-iconBtn:hover{ background: rgba(var(--race-rgb),.16); color: rgb(var(--race-rgb)); border-color: rgba(var(--race-rgb),.3); }

      .cg-divider{ height:1px; margin: 10px 6px; background: linear-gradient(90deg, transparent, rgba(var(--race-rgb),.22), transparent); }

      .cg-actions{ padding: 6px; display:flex; gap:10px; }
      .cg-btn{
        position:relative; flex:1; display:flex; align-items:center; gap:10px; padding: 12px; border-radius: 12px;
        cursor:pointer; user-select:none; border: 1px solid transparent; background: rgba(0,0,0,.20); color:#eaf3ff;
        transition: border-color .15s ease, background .15s ease, opacity .15s ease; text-align:left;
      }
      .cg-btn:hover{ background: rgba(60,100,180,.22); border-color: rgba(160,200,255,.24); }
      .cg-btnIco{ width:34px; height:34px; border-radius: 10px; display:grid; place-items:center; border:none; background: rgba(0,0,0,.30); font-weight:900; }
      .cg-btnText{ display:flex; flex-direction:column; gap:2px; }
      .cg-btnMain{ font-weight: 850; font-size: 13px; }
      .cg-btnSub{ font-size: 11px; opacity:.6; }
      .cg-btnPrimary{ background: linear-gradient(90deg, rgba(0,255,220,.16), rgba(0,0,0,.20)); box-shadow: 0 0 0 1px rgba(0,255,220,.22) inset; }
      .cg-btnPrimary:hover{ background: linear-gradient(90deg, rgba(0,255,220,.30), rgba(0,0,0,.28)); }
      .cg-btnPrimary .cg-btnIco{ color: rgba(0,255,220,.95); box-shadow: 0 0 16px rgba(0,255,220,.18); }
      .cg-btnGlow{ position:absolute; inset:-1px; border-radius:12px; pointer-events:none; }
      .cg-btnPrimary:hover .cg-btnGlow{ box-shadow: 0 0 26px rgba(0,255,220,.16); }
      .cg-btnGhost{ opacity:.92; }

      /* ============ БОРТОВОЕ ДОСЬЕ (паспорт) ============ */
      .cg-summary{ margin: 4px 6px 6px; }
      .cg-id{
        position:relative; padding: 16px; border-radius: 14px;
        background:
          radial-gradient(420px 160px at 100% 0%, rgba(var(--race-rgb),.12), transparent 60%),
          linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.16));
        box-shadow: 0 0 0 1px rgba(var(--race-rgb),.16) inset;
      }
      .cg-idCorner{ position:absolute; width:18px; height:18px; pointer-events:none; border: 2px solid rgba(var(--race-rgb),.6); }
      .cg-idCorner.tl{ top:8px; left:8px; border-right:none; border-bottom:none; border-top-left-radius:6px; }
      .cg-idCorner.tr{ top:8px; right:8px; border-left:none; border-bottom:none; border-top-right-radius:6px; }
      .cg-idCorner.bl{ bottom:8px; left:8px; border-right:none; border-top:none; border-bottom-left-radius:6px; }
      .cg-idCorner.br{ bottom:8px; right:8px; border-left:none; border-top:none; border-bottom-right-radius:6px; }

      .cg-idTop{ display:flex; align-items:center; gap:16px; }
      .cg-idEmblem{
        width:84px; height:84px; flex:0 0 auto; border-radius: 14px; display:grid; place-items:center;
        color: rgb(var(--race-rgb));
        background: radial-gradient(circle at 50% 35%, rgba(var(--race-rgb),.20), rgba(0,0,0,.35));
        box-shadow: 0 0 0 1px rgba(var(--race-rgb),.30) inset, 0 0 28px rgba(var(--race-rgb),.16);
      }
      .cg-idEmblem svg{ width:52px; height:52px; filter: drop-shadow(0 0 6px rgba(var(--race-rgb),.5)); }
      .cg-idHead{ min-width:0; }
      .cg-idRole{ font-size:11px; letter-spacing:1px; text-transform:uppercase; color: rgb(var(--race-rgb)); opacity:.92; }
      .cg-idSep{ opacity:.5; margin:0 4px; }
      .cg-idName{ font-size:26px; font-weight:900; letter-spacing:.5px; line-height:1.1; margin:2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .cg-idReg{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; opacity:.5; letter-spacing:1px; }

      .cg-idDesc{ margin-top:14px; font-size:12.5px; line-height:1.5; opacity:.78; }

      .cg-idSection{ margin-top:16px; }
      .cg-idSectionTitle{
        font-size:11px; font-weight:850; letter-spacing:1.2px; text-transform:uppercase; opacity:.66;
        margin-bottom:8px; display:flex; align-items:center; gap:8px;
      }
      .cg-idSectionTitle::after{ content:""; flex:1; height:1px; background: linear-gradient(90deg, rgba(var(--race-rgb),.25), transparent); }
      .cg-idSectionHint{ font-weight:600; letter-spacing:.4px; text-transform:none; opacity:.7; }

      .cg-idShipRow{ display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; background: rgba(0,0,0,.22); box-shadow: 0 0 0 1px rgba(255,255,255,.05) inset; }
      .cg-idShipIco{ width:46px; height:46px; flex:0 0 auto; border-radius:10px; display:grid; place-items:center; color: rgb(var(--race-rgb)); background: rgba(var(--race-rgb),.10); }
      .cg-idShipIco svg{ width:30px; height:30px; }
      .cg-idShipName{ font-weight:900; font-size:14px; letter-spacing:.4px; }
      .cg-idShipDesc{ font-size:11.5px; opacity:.66; margin-top:2px; line-height:1.4; }

      /* полоски ТТХ */
      .cg-bar{ margin-bottom:9px; }
      .cg-barLabel{ display:flex; justify-content:space-between; font-size:11px; letter-spacing:.6px; opacity:.8; margin-bottom:4px; }
      .cg-barVal{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: rgb(var(--race-rgb)); font-weight:700; }
      .cg-barTrack{ height:7px; border-radius:6px; background: rgba(255,255,255,.07); overflow:hidden; box-shadow: 0 0 0 1px rgba(0,0,0,.3) inset; }
      .cg-barFill{ height:100%; border-radius:6px; background: linear-gradient(90deg, rgba(var(--race-rgb),.95), rgba(var(--race-rgb),.35)); box-shadow: 0 0 10px rgba(var(--race-rgb),.4); transition: width .25s ease; }

      /* чипы бонусов */
      .cg-idBonus{ display:flex; flex-wrap:wrap; gap:8px; }
      .cg-bonus{ padding:5px 10px; border-radius:999px; font-size:11px; font-weight:800; letter-spacing:.3px; border:1px solid transparent; }
      .cg-bonusPos{ color:#9dffc8; background: rgba(40,200,120,.12); box-shadow: 0 0 0 1px rgba(40,200,120,.3) inset; }
      .cg-bonusNeg{ color:#ff9d9d; background: rgba(220,70,70,.12); box-shadow: 0 0 0 1px rgba(220,70,70,.3) inset; }
      .cg-bonusNeutral{ color: rgba(220,230,255,.6); background: rgba(255,255,255,.04); }

      /* атмосфера */
      .cg-scanline{
        position:absolute; inset:0; pointer-events:none;
        background: linear-gradient(180deg, transparent, rgba(var(--race-rgb),.10), transparent);
        opacity:.16; transform: translateY(-120%); animation: cgScan 6.2s linear infinite; mix-blend-mode: screen;
      }
      @keyframes cgScan{ 0%{ transform: translateY(-120%);} 100%{ transform: translateY(120%);} }
      .cg-noise{
        position:absolute; inset:0; pointer-events:none; opacity:.07; mix-blend-mode: overlay;
        background-image:
          repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 1px, transparent 2px, transparent 4px),
          repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 1px, transparent 2px, transparent 6px);
      }
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}
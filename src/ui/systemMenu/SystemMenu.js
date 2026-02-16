// ui/systemMenu/SystemMenu.js
import { MapScreen } from "./screens/MapScreen.js";
import { QuestScreen } from "./screens/QuestScreen.js";
import { CraftScreen } from "./screens/CraftScreen.js";
import { SettingsScreen } from "./screens/SettingsScreen.js";
import { InventoryScreen } from "./screens/InventoryScreen.js";
const TAB_ICONS = {
  map: "🗺️",
  quests: "📜",
  craft: "🛠️",
  inventory: "🎒",
  settings: "⚙",
};
function apply(el, styles) { Object.assign(el.style, styles); }

export class SystemMenu {
  constructor(services, opts = {}) {
    this.services = services;

    this.__id = Math.random().toString(16).slice(2);

    this.id = opts.id ?? "systemMenuUI";
    this.isOpen = false;

    this.activeTab = "map";
this.tabs = [
  { id: "map",      label: "Карта" },
  { id: "quests",   label: "Квесты" },
  { id: "craft",    label: "Крафт" },
  { id: "inventory",label: "Инвентарь" },
  { id: "settings", label: "Настройки" },
];
this.screens = {
  map: new MapScreen(services),
  quests: new QuestScreen(services),
  craft: new CraftScreen(services),
  inventory: new InventoryScreen(services),
  settings: new SettingsScreen(services),
};

    this.root = null;
    this.panel = null;
    this.content = null;

    this._styleEl = null;
    this._visible = false;

    this._pausedByMenu = false;
    this._screenHost = null;

    // ✅ корректный лог (через _get)
    const game = this._get("game");
    console.log("[SystemMenu:new]", this.__id, "gameId=", game?.__id);
  }

  // ✅ единый доступ к сервисам (supports Services.get + plain object)
  _get(key) {
    return (typeof this.services?.get === "function")
      ? this.services.get(key)
      : this.services?.[key];
  }

  mount() {
    if (this.root) return;

    this._injectStyles();

    const root = document.createElement("div");
    root.id = this.id;
    root.className = "sm-root";
    root.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "sm-panel";

    panel.innerHTML = `
      <div class="sm-topbar">
        <div class="sm-brand">
          <div class="sm-logo" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="M32 6l18 10v16c0 14-8 22-18 26C22 54 14 46 14 32V16L32 6z" fill="currentColor" opacity=".18"/>
              <path d="M32 10l14 8v14c0 12-6.8 18.7-14 22-7.2-3.3-14-10-14-22V18l14-8z" fill="currentColor" opacity=".38"/>
              <path d="M22 34l8-14 4 8 8-4-10 18-4-8-6 0z" fill="currentColor" opacity=".9"/>
            </svg>
          </div>
          <div>
            <div class="sm-title">Системное меню</div>
            <div class="sm-subtitle">SHIP HUD • SYSTEM INTERFACE</div>
          </div>
        </div>

        <div class="sm-tabs" data-id="tabs"></div>

        <button class="sm-close" data-id="closeBtn" title="Закрыть (Esc)">×</button>
      </div>

      <div class="sm-body">
        <div class="sm-content" data-id="content"></div>
      </div>

      <div class="sm-scanline" aria-hidden="true"></div>
      <div class="sm-noise" aria-hidden="true"></div>
    `;

    root.appendChild(panel);
    document.body.appendChild(root);

    this.root = root;
    this.panel = panel;
    this.content = panel.querySelector('[data-id="content"]');
    this._screenHost = this.content;

    // tabs
    const tabsHost = panel.querySelector('[data-id="tabs"]');
    tabsHost.innerHTML = "";
    for (const t of this.tabs) {
      const btn = document.createElement("button");
      btn.className = "sm-tab";
      btn.dataset.tab = t.id;
      btn.innerHTML = `<span class="sm-tabIco">${TAB_ICONS[t.id] ?? "◆"}</span><span>${t.label}</span>`;
      btn.addEventListener("click", () => this.setTab(t.id));
      tabsHost.appendChild(btn);
    }

    panel.querySelector('[data-id="closeBtn"]').addEventListener("click", () => this.close());

    this._syncActiveTabUI();
  }

  open() {
    this.mount();
    if (this.isOpen) return;

    this.isOpen = true;
    this._visible = true;

    const game = this._get("game");
    const state = this._get("state");

    // ✅ пауза
    if (game?.setPaused) {
      game.setPaused(true);
      this._pausedByMenu = true;
    } else if (state) {
      state.paused = true;
      this._pausedByMenu = true;
    }

    if (state?.ui) state.ui.modalOpen = true;

    this.root.style.display = "flex";
    requestAnimationFrame(() => this.root.classList.add("sm-visible"));

    this._mountActiveScreen();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this._visible = false;

    this._unmountActiveScreen();

    const game = this._get("game");
    const state = this._get("state");

    if (this._pausedByMenu) {
      if (game?.setPaused) game.setPaused(false);
      else if (state) state.paused = false;
      this._pausedByMenu = false;
    }

    if (state?.ui) state.ui.modalOpen = false;

    this.root.classList.remove("sm-visible");
    setTimeout(() => {
      if (!this._visible && this.root) this.root.style.display = "none";
    }, 160);
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  // ✅ вызывай это из Game.update(), передавая esc один раз
  handleEngineInputEsc(esc) {
    if (!esc) return this.isOpen;

    const game = this._get("game");
    const scenes = this._get("scenes");
    const current = scenes?.current;

    // started
    const started = !!game?.started;

    // main menu visible?
    const mm = game?.mainMenu;
    const mmEl = mm?.el ?? mm?.root ?? null;
    const mmVisible =
      (mmEl && mmEl.style && mmEl.style.display !== "none" && mmEl.style.visibility !== "hidden") ||
      (typeof mm?.isOpen === "boolean" ? mm.isOpen : false) ||
      (typeof mm?._visible === "boolean" ? mm._visible : false);

    // allowed scene
    const sceneName = current?.name ?? "(none)";
    const allowed = new Set(["Galaxy Map", "Star System", "StarSystem", "System"]);
    const sceneAllowed = allowed.has(sceneName);

    console.log("[SystemMenu/cancel]", this.__id, "gameId=", game?.__id, { started, mmVisible, sceneName, sceneAllowed });

    if (!started || mmVisible || !sceneAllowed) {
      if (this.isOpen) this.close();
      return false;
    }

    this.toggle();
    return true;
  }

  setTab(tabId) {
    if (!this.screens[tabId]) return;
    if (this.activeTab === tabId) return;

    if (this.isOpen) this._unmountActiveScreen();
    this.activeTab = tabId;
    this._syncActiveTabUI();
    if (this.isOpen) this._mountActiveScreen();
  }

  update(dt) {
    if (!this.isOpen) return;
    this.screens[this.activeTab]?.update?.(dt);
  }

  renderGL(game, scene) {
    if (!this.isOpen) return;
    const scr = this.screens?.[this.activeTab];
    if (scr?.renderGL) scr.renderGL(game, scene);
  }

  _mountActiveScreen() {
    const scr = this.screens[this.activeTab];
    if (!scr) return;

    if (this._screenHost) this._screenHost.innerHTML = "";
    if (scr.mount) scr.mount(this._screenHost);
    scr.onOpen?.();
  }

  _unmountActiveScreen() {
    const scr = this.screens[this.activeTab];
    scr?.onClose?.();

    if (scr?.destroy) scr.destroy();
    if (this._screenHost) this._screenHost.innerHTML = "";
  }

  _syncActiveTabUI() {
    if (!this.root) return;
    const buttons = this.root.querySelectorAll(".sm-tab");
    for (const b of buttons) {
      const on = b.dataset.tab === this.activeTab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "systemMenuUIStyles";
    st.textContent = `
      .sm-root{
        position:fixed; inset:0; z-index:2200;
        display:flex;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity .16s ease, transform .16s ease;
        pointer-events: auto;
        background: rgb(6,8,12);
      }
      .sm-root.sm-visible{ opacity:1; transform: translateY(0px); }

      .sm-panel{
        width:100%;
        height:100%;
        border-radius: 0px;
        overflow:hidden;
        position:relative;

        background:
          radial-gradient(1200px 700px at 50% 22%, rgba(80,140,255,.12), rgba(0,0,0,.88)),
          radial-gradient(900px 500px at 20% 70%, rgba(0,255,220,.05), transparent 60%),
          radial-gradient(900px 500px at 80% 70%, rgba(255,120,220,.04), transparent 60%),
          linear-gradient(180deg, rgba(10,14,24,.92), rgba(6,8,12,.96));
        border: 0px;
        box-shadow: none;

        display:flex;
        flex-direction:column;
      }

      .sm-topbar{
        display:flex; align-items:center; gap:14px;
        padding: 12px 14px;
        background:
          linear-gradient(90deg, rgba(40,120,255,.12), rgba(0,0,0,0) 45%),
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0));
        border-bottom: 1px solid rgba(160,200,255,.10);
      }

      .sm-brand{ display:flex; align-items:center; gap:12px; }
      .sm-logo{
        width:38px; height:38px; border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.20);
        background: rgba(0,0,0,.22);
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        color: rgba(120,220,255,.95);
        flex: 0 0 auto;
      }
      .sm-logo svg{ width:24px; height:24px; display:block; }
      .sm-title{ font-weight: 900; font-size: 16px; letter-spacing: .6px; line-height: 1; color:#e8f0ff; }
      .sm-subtitle{ opacity:.66; font-size: 12px; color:#e8f0ff; }

      .sm-tabs{
        display:flex; gap:10px; align-items:center;
        margin-left: 8px;
        flex: 1;
        justify-content: center;
      }
      .sm-tab{
        display:flex; align-items:center; gap:8px;
        padding: 9px 12px;
        border-radius: 12px;
        cursor:pointer;
        border: 1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        font-weight: 850;
        font-size: 13px;
        transition: transform .12s ease, border-color .12s ease, background .12s ease;
        user-select:none;
      }
      .sm-tab:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.24);
        background: rgba(0,0,0,.26);
      }
      .sm-tab.is-active{
        border-color: rgba(0,255,220,.22);
        background: linear-gradient(90deg, rgba(0,255,220,.10), rgba(0,0,0,.18));
      }
      .sm-tabIco{ opacity:.95; }

      .sm-close{
        width:42px; height:36px;
        border-radius: 12px;
        cursor:pointer;
        border: 1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        font-size: 20px;
        line-height: 1;
        transition: transform .12s ease, border-color .12s ease, background .12s ease;
      }
      .sm-close:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.28);
      }

      .sm-body{
        flex: 1;
        display:flex;
        padding: 12px;
      }

      .sm-content{
        flex: 1;
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.22);
        box-shadow: 0 18px 50px rgba(0,0,0,.30);
        padding: 12px;
        overflow: auto;
        color:#e8f0ff;
      }

      .sm-scanline{
        position:absolute; inset:0;
        pointer-events:none;
        background: linear-gradient(180deg, transparent, rgba(0,255,220,.08), transparent);
        opacity:.10;
        transform: translateY(-120%);
        animation: smScan 6.2s linear infinite;
        mix-blend-mode: screen;
      }
      @keyframes smScan{
        0%{ transform: translateY(-120%); }
        100%{ transform: translateY(120%); }
      }
      .sm-noise{
        position:absolute; inset:0;
        pointer-events:none;
        opacity:.06;
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

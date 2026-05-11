#ifndef MAINMENU_HPP
#define MAINMENU_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class MainMenu {
public:
    // Constructor
    MainMenu();
};

} // namespace lostjump

#endif // MAINMENU_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>
#include "save.js.hpp"




function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocalestd::to_string("ru-RU", { hour12: false });
}

class MainMenu {
  MainMenu() {
    this.root = nullptr;
    this.onNewGame = nullptr;
    this.onContinue = nullptr;
    this.onLoadSlot = nullptr;
    this.onOpenSettings = nullptr;

    this._visible = false;
    this._slots = [];
    this._styleEl = nullptr;
  }

  async show() {
    if (!this.root) this._build();
    this._visible = true;
    this.root.classList.add("mm-visible");
    this.root.style.display = "flex";
    await this.refresh();
  }

  hide() {
    this._visible = false;
    if (!this.root) return;
    this.root.classList.remove("mm-visible");
    
    setTimeout(() => {
      if (!this._visible && this.root) this.root.style.display = "none";
    }, 160);
  }

  async refresh() {
    this._slots = await listSaves();
    this._renderSlots();
    this._renderContinueState();
    this._renderMeta();
  }

  _build() {
    this._injectStyles();

    const root = document.createElement("div");
    root.id = "mainMenuUI";
    root.className = "mm-root";
    root.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "mm-panel";

    panel.innerHTML = `
      <div class="mm-topbar">
        <div class="mm-brand">
          <div class="mm-logo">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 6l18 10v16c0 14-8 22-18 26C22 54 14 46 14 32V16L32 6z" fill="currentColor" opacity=".18"/>
              <path d="M32 10l14 8v14c0 12-6.8 18.7-14 22-7.2-3.3-14-10-14-22V18l14-8z" fill="currentColor" opacity=".38"/>
              <path d="M22 34l8-14 4 8 8-4-10 18-4-8-6 0z" fill="currentColor" opacity=".9"/>
            </svg>
          </div>
          <div>
            <div class="mm-title">EAGLE-15</div>
            <div class="mm-subtitle">Капитанский терминал • MAIN DECK</div>
          </div>
        </div>

        <div class="mm-status">
          <div class="mm-chip"><span class="mm-dot"></span>ONLINE</div>
          <div class="mm-chip mm-chip2" id="mm_build">BUILD • ALPHA</div>
        </div>
      </div>

      <div class="mm-grid">
        <!-- левый блок -->
        <div class="mm-card">
          <div class="mm-cardHeader">
            <div class="mm-cardTitle">Управление полётом</div>
            <div class="mm-cardHint">Командные действия</div>
          </div>

          <div class="mm-actions">
            <button id="mm_continue" class="mm-btn mm-btnPrimary">
              <span class="mm-btnIco">▶</span>
              <span class="mm-btnText">
                <span class="mm-btnMain">Продолжить</span>
                <span class="mm-btnSub" id="mm_continue_sub">слот: main</span>
              </span>
              <span class="mm-btnGlow"></span>
            </button>

            <button id="mm_new" class="mm-btn mm-btnGhost">
              <span class="mm-btnIco">＋</span>
              <span class="mm-btnText">
                <span class="mm-btnMain">Новая игра</span>
                <span class="mm-btnSub">создать профиль пилота</span>
              </span>
            </button>

            <button id="mm_settings" class="mm-btn mm-btnGhost2">
              <span class="mm-btnIco">⚙</span>
              <span class="mm-btnText">
                <span class="mm-btnMain">Настройки</span>
                <span class="mm-btnSub">графика • звук • управление</span>
              </span>
            </button>
          </div>

          <div class="mm-divider"></div>

          <div class="mm-notes">
            <div class="mm-noteLine"><span class="mm-key">ESC</span> системное меню в полёте (позже)</div>
            <div class="mm-noteLine"><span class="mm-key">RMB</span> контекст в карте/системе</div>
            <div class="mm-noteLine"><span class="mm-key">F5</span> быстрый автосейв (идея)</div>
          </div>

          <div class="mm-footerMeta" id="mm_meta">
            <div class="mm-metaRow"><span class="mm-metaK">Пилот:</span> <span class="mm-metaV">—</span></div>
            <div class="mm-metaRow"><span class="mm-metaK">Система:</span> <span class="mm-metaV">—</span></div>
            <div class="mm-metaRow"><span class="mm-metaK">Сохранений:</span> <span class="mm-metaV">—</span></div>
          </div>
        </div>

        <!-- правый блок -->
        <div class="mm-card mm-cardWide">
          <div class="mm-cardHeader">
            <div class="mm-cardTitle">Бортовой журнал</div>
            <div class="mm-cardHint">Слоты сохранений</div>

            <div class="mm-spacer"></div>

            <button id="mm_refresh" class="mm-miniBtn" title="Обновить">
              <span class="mm-miniBtnIco">⟳</span>
              <span>Скан</span>
            </button>
          </div>

          <div class="mm-slots" id="mm_slots"></div>

          <div class="mm-bottomHint">
            Выбери слот → <b>Загрузить</b> чтобы войти. <b>Удалить</b> — стереть запись из журнала.
          </div>
        </div>
      </div>

      <div class="mm-scanline" aria-hidden="true"></div>
      <div class="mm-noise" aria-hidden="true"></div>
    `;

    root.appendChild(panel);
    document.body.appendChild(root);

    this.root = root;

    
    root.querySelector("#mm_new").addEventListener("click", () => this.onNewGame?.());
    root.querySelector("#mm_settings").addEventListener("click", () => this.onOpenSettings?.());
    root.querySelector("#mm_refresh").addEventListener("click", () => this.refresh());

    root.querySelector("#mm_continue").addEventListener("click", async () => {
      const main = this._slots.find([](auto& item){ return (s; }) => s.slot === "main");
      if (!main) return;
      this.onContinue?.("main");
    });

    
    root.addEventListener("mousedown", (e) => {
      if (e.target === root) {
        
        
      }
    });
  }

  _renderMeta() {
    if (!this.root) return;

    const meta = this.root.querySelector("#mm_meta");
    if (!meta) return;

    const main = this._slots.find([](auto& item){ return (s; }) => s.slot === "main");
    const pilot = main.meta.pilotName value_or("—";
    const system = main.meta.systemId value_or("—";
    const total = std::to_string(this._slots.size());

    const rows = meta.querySelectorAll(".mm-metaRow .mm-metaV");
    if (rows[0]) rows[0].textContent = pilot;
    if (rows[1]) rows[1].textContent = system;
    if (rows[2]) rows[2].textContent = total;
  }

  _renderContinueState() {
    const btn = this.root.querySelector("#mm_continue");
    const sub = this.root.querySelector("#mm_continue_sub");
    const main = this._slots.find([](auto& item){ return (s; }) => s.slot === "main");

    if (main) {
      btn.disabled = false;
      btn.classList.remove("mm-disabled");
      btn.title = `main • ${fmtDate(main.updatedAt)}`;
      if (sub) sub.textContent = `main • ${fmtDate(main.updatedAt)}`;
    } else {
      btn.disabled = true;
      btn.classList.add("mm-disabled");
      btn.title = "Нет сохранения main";
      if (sub) sub.textContent = `слот: main • отсутствует`;
    }
  }

  _renderSlots() {
    const host = this.root.querySelector("#mm_slots");
    host.innerHTML = "";

    if (!this._slots.size()) {
      const empty = document.createElement("div");
      empty.className = "mm-empty";
      empty.innerHTML = `
        <div class="mm-emptyTitle">Журнал пуст</div>
        <div class="mm-emptySub">Нет записей сохранений. Создай новую игру, чтобы начать протокол.</div>
      `;
      host.appendChild(empty);
      return;
    }

    for(const auto& s : this._slots) {
      const row = document.createElement("div");
      row.className = "mm-slotRow";

      const isMain = s.slot === "main";

      const left = document.createElement("div");
      left.className = "mm-slotLeft";

      const title = document.createElement("div");
      title.className = "mm-slotTitle";
      title.textContent = `${s.slot.toUpperCase()} • ${s.meta.title || "Запись"}`;

      const sub = document.createElement("div");
      sub.className = "mm-slotSub";
      sub.textContent = `обновлено: ${fmtDate(s.updatedAt)} • пилот: ${
        s.meta.pilotName value_or("—"
      } • система: ${s.meta.systemId value_or("—"}`;

      left.appendChild(title);
      left.appendChild(sub);

      const right = document.createElement("div");
      right.className = "mm-slotRight";

      const loadBtn = document.createElement("button");
      loadBtn.className = "mm-slotBtn mm-slotBtnLoad";
      loadBtn.innerHTML = `<span class="mm-mini">⤓</span><span>Загрузить</span>`;
      loadBtn.addEventListener("click", () => this.onLoadSlot?.(s.slot));

      const delBtn = document.createElement("button");
      delBtn.className = "mm-slotBtn mm-slotBtnDel";
      delBtn.innerHTML = `<span class="mm-mini">✕</span><span>Удалить</span>`;
      delBtn.addEventListener("click", async () => {
        if (!confirm(`Удалить слот "${s.slot}"?`)) return;
        await deleteSave(s.slot);
        await this.refresh();
      });

      
      const badge = document.createElement("div");
      badge.className = "mm-badge";
      badge.textContent = isMain ? "PRIMARY" : "AUX";
      badge.dataset.kind = isMain ? "main" : "aux";

      right.appendChild(badge);
      right.appendChild(loadBtn);
      right.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(right);

      host.appendChild(row);
    }
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "mainMenuUIStyles";
    st.textContent = `
      .mm-root{
        position:fixed; inset:0; z-index:2000001;
        display:flex; align-items:center; justify-content:center;
        padding: 12px;
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
      .mm-root.mm-visible{ opacity:1; transform: translateY(0px); }

      .mm-panel{
        width:min(1040px, calc(100vw - 24px));
        border-radius: 16px;
        overflow:hidden;
        position:relative;
        background:
          linear-gradient(180deg, rgba(10,14,24,.72), rgba(6,8,12,.86));
        border: 1px solid rgba(160,200,255,.14);
        box-shadow:
          0 26px 90px rgba(0,0,0,.62),
          0 0 0 1px rgba(0,0,0,.45) inset;
        backdrop-filter: blur(12px);
      }

      
      .mm-topbar{
        display:flex; align-items:center; justify-content:space-between;
        padding: 14px 16px;
        background:
          linear-gradient(90deg, rgba(40,120,255,.12), rgba(0,0,0,0) 45%),
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0));
        border-bottom: 1px solid rgba(160,200,255,.10);
      }
      .mm-brand{ display:flex; align-items:center; gap:12px; }
      .mm-logo{
        width:40px; height:40px; border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.20);
        background: rgba(0,0,0,.22);
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        color: rgba(120,220,255,.95);
      }
      .mm-logo svg{ width:26px; height:26px; display:block; }
      .mm-title{ font-weight: 900; font-size: 18px; letter-spacing: .6px; }
      .mm-subtitle{ opacity:.66; font-size: 12px; }

      .mm-status{ display:flex; gap:10px; align-items:center; }
      .mm-chip{
        display:flex; gap:8px; align-items:center;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.20);
        font-size: 12px;
        opacity: .9;
      }
      .mm-chip2{ opacity:.72; }
      .mm-dot{
        width:8px; height:8px; border-radius: 50%;
        background: rgba(0,255,200,.95);
        box-shadow: 0 0 14px rgba(0,255,200,.35);
      }

      
      .mm-grid{
        display:grid;
        grid-template-columns: 320px 1fr;
        gap: 12px;
        padding: 12px;
      }
      @media (max-width: 860px){
        .mm-grid{ grid-template-columns: 1fr; }
      }

      .mm-card{
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.12);
        background:
          linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.12));
        box-shadow:
          0 18px 50px rgba(0,0,0,.35);
        padding: 12px;
        position:relative;
        overflow:hidden;
      }
      .mm-card::before{
        content:"";
        position:absolute; inset:-1px;
        background:
          radial-gradient(500px 120px at 20% 0%, rgba(0,255,220,.08), transparent 60%),
          radial-gradient(500px 120px at 80% 0%, rgba(120,160,255,.08), transparent 60%);
        pointer-events:none;
      }
      .mm-cardWide{ padding: 12px; }

      .mm-cardHeader{
        display:flex; align-items:baseline; gap:10px;
        padding: 6px 6px 10px 6px;
      }
      .mm-cardTitle{ font-weight: 850; font-size: 13px; letter-spacing:.4px; }
      .mm-cardHint{ opacity:.62; font-size: 12px; }
      .mm-spacer{ flex:1; }

      
      .mm-actions{ display:flex; flex-direction:column; gap:10px; padding: 6px; }
      .mm-btn{
        position:relative;
        width:100%;
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
      .mm-btn:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.26);
      }
      .mm-btn:active{ transform: translateY(0px); }
      .mm-btnIco{
        width:34px; height:34px; border-radius: 12px;
        display:grid; place-items:center;
        border: 1px solid rgba(160,200,255,.18);
        background: rgba(0,0,0,.28);
        font-weight: 900;
      }
      .mm-btnText{ display:flex; flex-direction:column; gap:2px; }
      .mm-btnMain{ font-weight: 850; font-size: 13px; }
      .mm-btnSub{ font-size: 11px; opacity:.70; }

      .mm-btnPrimary{
        border-color: rgba(80,170,255,.28);
        background:
          linear-gradient(90deg, rgba(45,125,255,.22), rgba(0,0,0,.18));
      }
      .mm-btnPrimary .mm-btnIco{
        color: rgba(0,255,220,.95);
        box-shadow: 0 0 18px rgba(0,255,220,.16);
      }
      .mm-btnGlow{
        content:"";
        position:absolute; inset:-1px;
        border-radius: 14px;
        pointer-events:none;
        box-shadow: 0 0 0 rgba(0,0,0,0);
      }
      .mm-btnPrimary:hover .mm-btnGlow{
        box-shadow: 0 0 26px rgba(80,170,255,.18);
      }

      .mm-btnGhost{ }
      .mm-btnGhost2{ border-color: rgba(255,255,255,.10); opacity:.92; }
      .mm-disabled{ opacity:.42 !important; cursor:not-allowed !important; transform:none !important; }
      .mm-btn:disabled{ opacity:.42; cursor:not-allowed; }

      .mm-miniBtn{
        display:flex; align-items:center; gap:8px;
        padding: 8px 10px;
        border-radius: 12px;
        cursor:pointer;
        border: 1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        transition: transform .12s ease, border-color .12s ease, background .12s ease;
      }
      .mm-miniBtn:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.26);
      }
      .mm-miniBtnIco{ opacity:.9; font-weight: 900; }

      .mm-divider{
        height:1px;
        margin: 8px 6px;
        background: linear-gradient(90deg, transparent, rgba(160,200,255,.16), transparent);
      }

      .mm-notes{ padding: 6px; display:flex; flex-direction:column; gap:6px; }
      .mm-noteLine{ font-size: 12px; opacity:.78; }
      .mm-key{
        display:inline-block;
        padding: 2px 7px;
        border-radius: 8px;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.22);
        margin-right: 6px;
        font-weight: 800;
        font-size: 11px;
        opacity:.95;
      }

      .mm-footerMeta{
        margin-top: 10px;
        padding: 10px;
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.16);
      }
      .mm-metaRow{
        display:flex; justify-content:space-between; gap:10px;
        font-size: 12px;
        padding: 2px 0;
        opacity:.86;
      }
      .mm-metaK{ opacity:.70; }
      .mm-metaV{ font-weight: 750; }

      
      .mm-slots{ display:flex; flex-direction:column; gap:10px; padding: 6px; }
      .mm-slotRow{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(160,200,255,.12);
        background:
          linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.12));
        transition: transform .12s ease, border-color .12s ease, background .12s ease;
      }
      .mm-slotRow:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.24);
        background:
          linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.16));
      }
      .mm-slotLeft{ display:flex; flex-direction:column; gap:4px; min-width: 0; }
      .mm-slotTitle{ font-size: 13px; font-weight: 900; letter-spacing:.35px; }
      .mm-slotSub{
        font-size: 12px; opacity:.72;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        max-width: 64ch;
      }
      .mm-slotRight{ display:flex; gap:8px; align-items:center; flex-shrink:0; }

      .mm-badge{
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .55px;
        border: 1px solid rgba(160,200,255,.16);
        background: rgba(0,0,0,.18);
        opacity: .9;
      }
      .mm-badge[data-kind="main"]{
        border-color: rgba(0,255,220,.28);
        color: rgba(0,255,220,.95);
        box-shadow: 0 0 16px rgba(0,255,220,.10);
      }
      .mm-badge[data-kind="aux"]{
        border-color: rgba(160,200,255,.16);
        color: rgba(160,200,255,.9);
      }

      .mm-slotBtn{
        display:flex; align-items:center; gap:8px;
        padding: 9px 10px;
        border-radius: 12px;
        cursor:pointer;
        border: 1px solid rgba(160,200,255,.14);
        background: rgba(0,0,0,.18);
        color:#eaf3ff;
        transition: transform .12s ease, border-color .12s ease, background .12s ease, opacity .12s ease;
        font-weight: 800;
        font-size: 12px;
      }
      .mm-slotBtn:hover{
        transform: translateY(-1px);
        border-color: rgba(160,200,255,.28);
        background: rgba(0,0,0,.26);
      }
      .mm-slotBtn:active{ transform: translateY(0px); }
      .mm-slotBtnLoad{
        border-color: rgba(80,170,255,.22);
        background: linear-gradient(90deg, rgba(45,125,255,.18), rgba(0,0,0,.18));
      }
      .mm-slotBtnDel{
        border-color: rgba(255,120,120,.20);
        color: rgba(255,210,210,.95);
        background: linear-gradient(90deg, rgba(255,90,90,.10), rgba(0,0,0,.18));
      }
      .mm-mini{ font-weight: 900; opacity:.85; }

      .mm-bottomHint{
        padding: 10px 10px 6px 10px;
        font-size: 12px;
        opacity: .70;
      }

      .mm-empty{
        border-radius: 14px;
        border: 1px dashed rgba(160,200,255,.16);
        background: rgba(0,0,0,.12);
        padding: 18px;
        opacity:.9;
      }
      .mm-emptyTitle{ font-weight: 900; letter-spacing:.4px; }
      .mm-emptySub{ margin-top: 6px; opacity:.72; font-size: 12px; }

      
      .mm-scanline{
        position:absolute; inset:0;
        pointer-events:none;
        background:
          linear-gradient(180deg, transparent, rgba(0,255,220,.08), transparent);
        opacity:.15;
        transform: translateY(-120%);
        animation: mmScan 6.2s linear infinite;
        mix-blend-mode: screen;
      }
      @keyframes mmScan{
        0%{ transform: translateY(-120%); }
        100%{ transform: translateY(120%); }
      }

      .mm-noise{
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


} // namespace lostjump

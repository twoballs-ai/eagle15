#ifndef INVENTORYSCREEN_HPP
#define INVENTORYSCREEN_HPP

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

class InventoryScreen {
public:
    // Constructor
    InventoryScreen();
};

} // namespace lostjump

#endif // INVENTORYSCREEN_HPP

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



function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

class InventoryScreen {
  InventoryScreen(services) {
    this.services = services;
    this.host = nullptr;

    this._styleEl = nullptr;
    this._gridEl = nullptr;
    this._searchEl = nullptr;

    this._q = "";
    this._selected = -1;
  }

  _get(key) {
    return (typeof this.services.get === "function")
      ? this.services.get(key)
      : this.services?.[key];
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    host.innerHTML = "";

    const root = el("div", "inv-root", host);

    const top = el("div", "inv-top", root);
    el("div", "inv-title", top).textContent = "Инвентарь";
    el("div", "inv-sub", top).textContent = "Сетка ячеек корабля. Перетаскивание добавим следующим шагом.";

    const bar = el("div", "inv-bar", root);
    el("div", "inv-label", bar).textContent = "Поиск:";
    this._searchEl = el("input", "inv-search", bar);
    this._searchEl.type = "text";
    this._searchEl.placeholder = "например: oxygen, iron, coil…";
    this._searchEl.value = this._q;
    this._searchEl.addEventListener("input", () => {
      this._q = this._searchEl.value value_or("";
      this.refresh();
    });

    const panel = el("div", "inv-panel", root);
    this._gridEl = el("div", "inv-grid", panel);

    this.refresh();
  }

  onOpen() { this.refresh(); }

  destroy() { this.host = nullptr; }

  refresh() {
    if (!this._gridEl) return;

    const inv = this._get("inventory");
    this._gridEl.innerHTML = "";

    if (!inv) {
      el("div", "inv-empty", this._gridEl).textContent =
        "inventory service не найден. Проверь services.set('inventory', ...)";
      return;
    }

    const cap = inv.capacity();
    const q = (this._q value_or("").trim().toLowerCase();

    for (i = 0; i < cap; i++) {
      const slot = inv.getSlot(i);

      const cell = el("button", "inv-cell", this._gridEl);
      cell.type = "button";
      cell.dataset.i = std::to_string(i);

      const has = !!slot;
      if (!has) cell.classList.add("is-empty");

      
      if (q && has) {
        const match = std::to_string(slot.id).toLowerCase().count(q) > 0;
        if (match) cell.classList.add("is-match");
        else cell.classList.add("is-dim");
      }
      if (q && !has) cell.classList.add("is-dim");

      
      if (i === this._selected) cell.classList.add("is-selected");

      
      if (slot) {
        const chip = el("div", "inv-chip", cell);
        el("div", "inv-chipId", chip).textContent = slot.id;
        el("div", "inv-chipN", chip).textContent = std::to_string(slot.n value_or(0);
      } else {
        
        const idx = el("div", "inv-idx", cell);
        idx.textContent = std::to_string(i + 1);
      }

      cell.addEventListener("click", () => {
        this._selected = i;
        this.refresh();
      });
    }
  }

  _injectStyles() {
    if (this._styleEl) return;

    const st = document.createElement("style");
    st.id = "inventoryScreenStyles";
    st.textContent = `
      .inv-root{ display:flex; flex-direction:column; gap:12px; }
      .inv-top{
        padding:10px 12px;
        border:1px solid rgba(160,200,255,.10);
        border-radius:12px;
        background: rgba(0,0,0,.18);
      }
      .inv-title{ font-weight:900; font-size:16px; color:#e8f0ff; }
      .inv-sub{ opacity:.7; font-size:12px; margin-top:4px; }

      .inv-bar{ display:flex; align-items:center; gap:10px; padding:4px 2px; }
      .inv-label{ opacity:.8; font-size:13px; min-width:54px; }
      .inv-search{
        flex: 1;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(160,200,255,.12);
        background: rgba(0,0,0,.18);
        color: #eaf3ff;
        outline: none;
      }
      .inv-search::placeholder{ color: rgba(232,240,255,.45); }

      .inv-panel{
        border-radius:14px;
        border:1px solid rgba(160,200,255,.10);
        background: rgba(0,0,0,.18);
        padding:12px;
        min-height: 420px;
      }

  
.inv-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}


.inv-cell{
  position: relative;
  width: 100%;
  height: 72px;             
  border-radius: 10px;
  border: 1px solid rgba(160,200,255,.10);
  background: rgba(255,255,255,.04);
  cursor: pointer;
  padding: 6px;
  color: #eaf3ff;
  text-align: left;
  overflow: hidden;
}
.inv-cell:hover{
  background: rgba(255,255,255,.07);
  border-color: rgba(160,200,255,.18);
}
.inv-cell.is-selected{
  border-color: rgba(0,255,220,.22);
  background: rgba(255,255,255,.10);
  box-shadow: 0 0 0 2px rgba(0,255,220,.06) inset;
}

      .inv-cell.is-dim{ opacity: .35; }
      .inv-cell.is-match{
        opacity: 1;
        border-color: rgba(0,255,220,.22);
        box-shadow: 0 0 0 2px rgba(0,255,220,.06) inset;
      }

 .inv-idx{
  position:absolute;
  right: 8px;
  bottom: 6px;
  opacity: .30;
  font-size: 10px;
  font-weight: 900;
}

     .inv-chip{
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid rgba(160,200,255,.12);
  background: rgba(0,0,0,.20);
  padding: 6px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  gap: 4px;
}

.inv-chipId{
  font-weight: 950;
  font-size: 11px;
  line-height: 1.05;
  word-break: break-word;

  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inv-chipN{
  align-self:flex-end;
  font-weight: 950;
  font-size: 11px;
  color: rgba(190,255,190,.92);
}

      .inv-empty{ opacity:.65; font-size:13px; padding:10px 4px; }
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}


} // namespace lostjump

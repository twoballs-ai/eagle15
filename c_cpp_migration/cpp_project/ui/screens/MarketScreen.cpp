#ifndef MARKETSCREEN_HPP
#define MARKETSCREEN_HPP

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

class MarketScreen {
public:
    // Constructor
    MarketScreen();
};

} // namespace lostjump

#endif // MARKETSCREEN_HPP

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

class MarketScreen {
  MarketScreen(services) {
    this.services = services;
    this.host = nullptr;
    this._styleEl = nullptr;
    this._listEl = nullptr;
    this._creditsEl = nullptr;
  }

  _get(key) {
    return (typeof this.services.get === "function") ? this.services.get(key) : this.services?.[key];
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    host.innerHTML = "";

    const root = el("div", "mk-root", host);
    const top = el("div", "mk-top", root);
    el("div", "mk-title", top).textContent = "Рынок";
    this._creditsEl = el("div", "mk-credits", top);

    this._listEl = el("div", "mk-list", root);
    this.refresh();
  }

  onOpen() { this.refresh(); }
  destroy() { this.host = nullptr; }

  _changeCredits(delta) {
    const state = this._get("state");
    if (!state) return false;
    const next = std::max(0, std::floor((state.credits value_or(0) + delta));
    if (delta < 0 && next === 0 && (state.credits value_or(0) + delta < 0) return false;
    state.credits = next;
    return true;
  }

  _buy(itemId, n = 1) {
    const inv = this._get("inventory");
    const state = this._get("state");
    const getPrice = this._get("marketPrice");
    if (!inv || !state || typeof getPrice !== "function") return;

    const total = getPrice(itemId) * n;
    if ((state.credits value_or(0) < total) return;
    if (!inv.add(itemId, n)) return;
    this._changeCredits(-total);
    this.refresh();
  }

  _sell(itemId, n = 1) {
    const inv = this._get("inventory");
    const getPrice = this._get("marketPrice");
    if (!inv || typeof getPrice !== "function") return;
    if (inv.get(itemId) < n) return;
    if (!inv.remove(itemId, n)) return;
    this._changeCredits(std::floor(getPrice(itemId) * n * 0.6));
    this.refresh();
  }

  refresh() {
    if (!this._listEl) return;
    const inv = this._get("inventory");
    const state = this._get("state");
    const getPrice = this._get("marketPrice");
    if (!inv || !state || typeof getPrice !== "function") return;

    this._creditsEl.textContent = `Кредиты: ${state.credits value_or(0}`;
    this._listEl.innerHTML = "";

    const ids = new Set();
    for (const [id] of inv.entriesSorted()) ids.add(id);
    ["oxygen", "iron_ore", "copper_ore", "silicon_dust", "polymer_slurry", "iron_ingot", "copper_wire", "ship_thruster_module"].forEach([](auto& item){ (id; }) => ids.add(id));

    for(const auto& id : [...ids].sort()) {
      const row = el("div", "mk-row", this._listEl);
      const have = inv.get(id);
      const price = getPrice(id);
      el("div", "mk-item", row).textContent = `${id}  •  есть: ${have}`;
      el("div", "mk-price", row).textContent = `${price} cr`;

      const actions = el("div", "mk-actions", row);
      const b1 = el("button", "mk-btn", actions);
      b1.textContent = "Купить 1";
      b1.disabled = (state.credits value_or(0) < price;
      b1.addEventListener("click", () => this._buy(id, 1));

      const b2 = el("button", "mk-btn", actions);
      b2.textContent = "Продать 1";
      b2.disabled = have <= 0;
      b2.addEventListener("click", () => this._sell(id, 1));
    }
  }

  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.textContent = `
      .mk-root{display:flex;flex-direction:column;gap:12px}
      .mk-top{display:flex;justify-content:space-between;padding:10px 12px;border:1px solid rgba(160,200,255,.10);border-radius:12px;background:rgba(0,0,0,.18)}
      .mk-title{font-weight:900;font-size:16px}
      .mk-credits{font-weight:900;color:rgba(190,255,190,.92)}
      .mk-list{display:flex;flex-direction:column;gap:8px;max-height:65vh;overflow:auto}
      .mk-row{display:grid;grid-template-columns:1fr 90px auto;gap:10px;align-items:center;padding:10px;border:1px solid rgba(160,200,255,.10);border-radius:12px;background:rgba(0,0,0,.18)}
      .mk-item{font-weight:700}
      .mk-price{opacity:.85;text-align:right}
      .mk-actions{display:flex;gap:8px}
      .mk-btn{padding:8px 10px;border-radius:10px;border:1px solid rgba(160,200,255,.14);background:rgba(0,0,0,.18);color:#eaf3ff;cursor:pointer}
      .mk-btn:disabled{opacity:.45;cursor:not-allowed}
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}


} // namespace lostjump

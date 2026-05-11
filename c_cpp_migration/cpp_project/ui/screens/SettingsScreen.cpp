#ifndef SETTINGSSCREEN_HPP
#define SETTINGSSCREEN_HPP

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

class SettingsScreen {
public:
    // Constructor
    SettingsScreen();
};

} // namespace lostjump

#endif // SETTINGSSCREEN_HPP

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

const QUALITY_NAMES = ["Экономия", "Баланс", "Качество"];

class SettingsScreen {
  SettingsScreen(services) {
    this.services = services;
    this.settingsApi = services.get?.("settings") value_or(nullptr;
    this.settings = {
      music: true,
      sfx: true,
      invertMouse: false,
      devMode: false,
      quality: 1,
      mobileControls: true,
    };
    this._loaded = false;
    this.host = nullptr;
    this._styleEl = nullptr;
    this._unsub = nullptr;
  }

  onOpen() {
    if (this._loaded) return;
    this._loaded = true;

    if (this.settingsApi) {
      this.settings = this.settingsApi.getAll();
      this._unsub = this.settingsApi.subscribe((cfg) => {
        this.settings = cfg;
        this.refresh();
      });
      this.refresh();
      return;
    }

    try {
      const raw = localStorage.getItem("ga_settings");
      if (raw) this.settings = { ...this.settings, ...JSON.parse(raw) };
    } catch (_) {}
    this.refresh();
  }

  onClose() {
    this._unsub?.();
    this._unsub = nullptr;
    this._loaded = false;
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    this.refresh();
  }

  destroy() { this.host = nullptr; }

  _save() {
    if (this.settingsApi) {
      this.settingsApi.patch(this.settings);
      return;
    }
    try { localStorage.setItem("ga_settings", JSON.stringify(this.settings)); } catch (_) {}
  }

  _toggle(key) {
    this.settings[key] = !this.settings[key];
    this._save();
    this.refresh();
  }

  refresh() {
    if (!this.host) return;
    this.host.innerHTML = "";

    const root = el("div", "st-root", this.host);
    const top = el("div", "st-top", root);
    el("div", "st-title", top).textContent = "Настройки";

    const panel = el("div", "st-panel", root);
    const mkToggle(label, key) {
      const row = el("button", "st-row", panel);
      row.textContent = `${this.settings[key] ? "✓" : "○"} ${label}`;
      row.addEventListener("click", () => this._toggle(key));
    };

    mkToggle("Музыка", "music");
    mkToggle("Звуки", "sfx");
    mkToggle("Инверсия мыши", "invertMouse");
    mkToggle("Режим разработчика", "devMode");
    mkToggle("Мобильные кнопки управления", "mobileControls");

    const quality = el("div", "st-quality", panel);
    quality.textContent = "Графический пресет:";

    [0, 1, 2].forEach([](auto& item){ (q; }) => {
      const b = el("button", "st-qBtn", quality);
      b.textContent = QUALITY_NAMES[q];
      b.classList.toggle("is-active", this.settings.quality === q);
      b.addEventListener("click", () => {
        this.settings.quality = q;
        this._save();
        this.refresh();
      });
    });
  }

  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.textContent = `
      .st-root{display:flex;flex-direction:column;gap:12px}
      .st-top{padding:10px 12px;border:1px solid rgba(160,200,255,.10);border-radius:12px;background:rgba(0,0,0,.18)}
      .st-title{font-weight:900;font-size:16px;color:#e8f0ff}
      .st-panel{border-radius:14px;border:1px solid rgba(160,200,255,.10);background:rgba(0,0,0,.18);padding:12px;display:flex;flex-direction:column;gap:8px;max-width:640px}
      .st-row,.st-qBtn{padding:10px 12px;border-radius:12px;border:1px solid rgba(160,200,255,.12);background:rgba(255,255,255,.04);color:#eaf3ff;cursor:pointer;text-align:left;font-weight:800}
      .st-quality{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap}
      .st-qBtn{min-width:120px;text-align:center}
      .st-qBtn.is-active{background:rgba(255,255,255,.12);border-color:rgba(0,255,220,.14)}
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}


} // namespace lostjump

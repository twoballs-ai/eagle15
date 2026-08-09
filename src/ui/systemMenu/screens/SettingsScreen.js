function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

const QUALITY_NAMES = ["Экономия", "Баланс", "Качество", "Ультра"];

const GRAPHICS_OPTIONS = {
  shadows: { label: "Тени", values: [false, true], names: ["Выкл", "Вкл"] },
  antiAliasing: { label: "Сглаживание", values: [false, true], names: ["Выкл", "Вкл"] },
  particles: { label: "Частицы", values: [0, 1, 2], names: ["Мин", "Норма", "Макс"] },
  reflections: { label: "Отражения", values: [false, true], names: ["Выкл", "Вкл"] },
};

export class SettingsScreen {
  constructor(services) {
    this.services = services;
    this.settingsApi = services?.get?.("settings") ?? null;
    this.settings = {
      // Звук
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.7,
      sfxVolume: 0.8,

      // Графика
      quality: 1,
      shadows: false,
      antiAliasing: false,
      particles: 1,
      reflections: false,
      fullscreen: false,

      // Управление
      invertMouse: false,
      mouseSensitivity: 1.0,
      mobileControls: true,

      // Прочее
      devMode: false,
    };
    this._loaded = false;
    this.host = null;
    this._styleEl = null;
    this._unsub = null;
  }

  onOpen() {
    if (this._loaded) return;
    this._loaded = true;

    if (this.settingsApi) {
      this.settings = { ...this.settings, ...this.settingsApi.getAll() };
      this._unsub = this.settingsApi.subscribe((cfg) => {
        this.settings = { ...this.settings, ...cfg };
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
    this._unsub = null;
    this._loaded = false;
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    this.refresh();
  }

  destroy() { this.host = null; }

  _save() {
    if (this.settingsApi) {
      this.settingsApi.patch(this.settings);
      return;
    }
    try { localStorage.setItem("ga_settings", JSON.stringify(this.settings)); } catch (_) {}
  }

  _set(key, value) {
    this.settings[key] = value;
    this._save();
    this.refresh();
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

    // Заголовок
    const header = el("div", "st-header", root);
    el("div", "st-title", header).textContent = "Настройки";
    el("div", "st-subtitle", header).textContent = "Звук • Графика • Управление";

    // Секция: Звук
    const soundSection = this._createSection(root, "🔊 Звук");
    this._createToggleRow(soundSection, "Музыка", "musicEnabled");
    this._createToggleRow(soundSection, "Звуковые эффекты", "sfxEnabled");
    this._createSliderRow(soundSection, "Громкость музыки", "musicVolume", 0, 1, 0.05);
    this._createSliderRow(soundSection, "Громкость эффектов", "sfxVolume", 0, 1, 0.05);

    // Секция: Графика
    const gfxSection = this._createSection(root, "🎨 Графика");

    // Графический пресет
    const qualityRow = el("div", "st-row-full", gfxSection);
    el("span", "st-label", qualityRow).textContent = "Графический пресет:";
    const qualityBtns = el("div", "st-btn-group", qualityRow);
    [0, 1, 2, 3].forEach((q) => {
      const b = el("button", "st-btn", qualityBtns);
      b.textContent = QUALITY_NAMES[q];
      b.classList.toggle("is-active", this.settings.quality === q);
      b.addEventListener("click", () => this._set("quality", q));
    });

    // Дополнительные настройки графики
    for (const [key, opt] of Object.entries(GRAPHICS_OPTIONS)) {
      this._createSelectRow(gfxSection, opt.label, key, opt.values, opt.names);
    }

    this._createToggleRow(gfxSection, "Полноэкранный режим", "fullscreen");

    // Секция: Управление
    const controlsSection = this._createSection(root, "🎮 Управление");
    this._createToggleRow(controlsSection, "Инверсия мыши", "invertMouse");
    this._createSliderRow(controlsSection, "Чувствительность мыши", "mouseSensitivity", 0.1, 3.0, 0.1);
    this._createToggleRow(controlsSection, "Мобильное управление", "mobileControls");

    // Секция: Прочее
    const otherSection = this._createSection(root, "⚙ Прочее");
    this._createToggleRow(otherSection, "Режим разработчика", "devMode");

    // Кнопка сброса
    const resetRow = el("div", "st-reset-row", root);
    const resetBtn = el("button", "st-reset-btn", resetRow);
    resetBtn.textContent = "⟲ Сбросить все настройки";
    resetBtn.addEventListener("click", () => this._resetToDefaults());
  }

  _createSection(parent, title) {
    const section = el("div", "st-section", parent);
    el("div", "st-section-title", section).textContent = title;
    return section;
  }

  _createToggleRow(parent, label, key) {
    const row = el("button", "st-toggle-row", parent);
    const labelEl = el("span", "st-toggle-label", row);
    labelEl.textContent = label;
    const toggle = el("div", "st-toggle", row);
    toggle.classList.toggle("is-on", this.settings[key]);
    row.addEventListener("click", () => this._toggle(key));
  }

  _createSliderRow(parent, label, key, min, max, step) {
    const row = el("div", "st-slider-row", parent);
    const labelEl = el("span", "st-label", row);
    labelEl.textContent = label;

    const sliderContainer = el("div", "st-slider-container", row);
    const slider = el("input", "st-slider", sliderContainer);
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = this.settings[key];

    const valueDisplay = el("span", "st-value", sliderContainer);
    valueDisplay.textContent = Math.round(this.settings[key] * 100) + "%";

    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.settings[key] = val;
      valueDisplay.textContent = Math.round(val * 100) + "%";
    });

    slider.addEventListener("change", (e) => {
      this.settings[key] = parseFloat(e.target.value);
      this._save();
    });
  }

  _createSelectRow(parent, label, key, values, names) {
    const row = el("div", "st-select-row", parent);
    el("span", "st-label", row).textContent = label;

    const btnGroup = el("div", "st-btn-group", row);
    values.forEach((val, idx) => {
      const b = el("button", "st-btn", btnGroup);
      b.textContent = names[idx];
      b.classList.toggle("is-active", this.settings[key] === val);
      b.addEventListener("click", () => this._set(key, val));
    });
  }

  _resetToDefaults() {
    const defaults = {
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      quality: 1,
      shadows: false,
      antiAliasing: false,
      particles: 1,
      reflections: false,
      fullscreen: false,
      invertMouse: false,
      mouseSensitivity: 1.0,
      mobileControls: true,
      devMode: false,
    };
    this.settings = { ...defaults };
    this._save();
    this.refresh();
  }

  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.textContent = `
      .st-root{display:flex;flex-direction:column;gap:16px;padding:8px;max-width:720px}
      .st-header{padding:12px 14px;border:1px solid rgba(160,200,255,.12);border-radius:14px;background:rgba(0,0,0,.22)}
      .st-title{font-weight:900;font-size:18px;color:#e8f0ff;letter-spacing:.5px}
      .st-subtitle{opacity:.65;font-size:12px;color:#cfe0ff;margin-top:4px}

      .st-section{border-radius:14px;border:1px solid rgba(160,200,255,.10);background:rgba(0,0,0,.18);padding:14px;display:flex;flex-direction:column;gap:10px}
      .st-section-title{font-weight:800;font-size:14px;color:#a8d0ff;letter-spacing:.4px;margin-bottom:2px;text-transform:uppercase;opacity:.85}

      .st-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;border:1px solid rgba(160,200,255,.10);background:rgba(255,255,255,.03);cursor:pointer;transition:all .12s ease}
      .st-toggle-row:hover{background:rgba(255,255,255,.06);border-color:rgba(160,200,255,.18)}
      .st-toggle-label{font-weight:700;font-size:14px;color:#eaf3ff}
      .st-toggle{width:44px;height:24px;border-radius:12px;background:rgba(255,255,255,.12);position:relative;transition:all .15s ease;border:1px solid rgba(160,200,255,.15)}
      .st-toggle.is-on{background:rgba(0,255,220,.25);border-color:rgba(0,255,220,.45)}
      .st-toggle::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#e8f0ff;transition:transform .15s ease;box-shadow:0 2px 6px rgba(0,0,0,.25)}
      .st-toggle.is-on::after{transform:translateX(20px);background:#00ffe0}

      .st-slider-row{display:flex;align-items:center;gap:12px;padding:8px 0}
      .st-slider-row .st-label{min-width:160px;font-weight:700;font-size:13px;color:#d0e0ff}
      .st-slider-container{flex:1;display:flex;align-items:center;gap:10px}
      .st-slider{flex:1;height:6px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.12);border-radius:3px;outline:none;cursor:pointer}
      .st-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#00ffe0;cursor:pointer;box-shadow:0 2px 8px rgba(0,255,220,.35)}
      .st-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#00ffe0;cursor:pointer;border:none;box-shadow:0 2px 8px rgba(0,255,220,.35)}
      .st-value{min-width:48px;text-align:right;font-weight:800;font-size:12px;color:#a8ffd5}

      .st-select-row{display:flex;align-items:center;gap:12px;padding:6px 0}
      .st-select-row .st-label{min-width:140px;font-weight:700;font-size:13px;color:#d0e0ff}
      .st-btn-group{display:flex;gap:6px}
      .st-btn{padding:8px 12px;border-radius:10px;border:1px solid rgba(160,200,255,.12);background:rgba(255,255,255,.04);color:#eaf3ff;cursor:pointer;font-weight:700;font-size:12px;transition:all .12s ease}
      .st-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(160,200,255,.22)}
      .st-btn.is-active{background:rgba(0,255,220,.18);border-color:rgba(0,255,220,.45);color:#00ffe0}

      .st-row-full{display:flex;align-items:center;gap:12px;padding:6px 0}
      .st-row-full .st-label{font-weight:700;font-size:13px;color:#d0e0ff;min-width:140px}

      .st-reset-row{padding:8px 4px}
      .st-reset-btn{width:100%;padding:12px 16px;border-radius:12px;border:1px dashed rgba(160,200,255,.20);background:rgba(255,100,100,.06);color:#ffc0c0;cursor:pointer;font-weight:800;font-size:14px;transition:all .12s ease}
      .st-reset-btn:hover{background:rgba(255,100,100,.12);border-color:rgba(255,100,100,.35);color:#ffe0e0}
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}
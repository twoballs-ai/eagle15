function apply(el, styles) { Object.assign(el.style, styles); }

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function pct(v, max) {
  if (!max || max <= 0) return 0;
  return clamp01(v / max) * 100;
}

function formatCredits(n) {
  return Math.max(0, Math.floor(n || 0))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

let STYLE_INJECTED = false;

function injectStyles() {
  if (STYLE_INJECTED) return;
  STYLE_INJECTED = true;

  const st = document.createElement("style");
  st.id = "ship-status-widget-styles";
  st.textContent = `
    /* ===== Контейнер (Glassmorphism) ===== */
    .ssw-container {
      pointer-events: none;
      width: 360px;
      color: #ecf3ff;
      background: linear-gradient(135deg, rgba(17,24,36,0.78), rgba(7,12,20,0.88));
      border: 1px solid rgba(130, 195, 255, 0.28);
      border-radius: 16px;
      box-shadow:
        0 12px 32px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.06);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 14px 16px;
      font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-sizing: border-box;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }

    /* ===== Header: карточка пилота ===== */
    .ssw-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(130, 195, 255, 0.12);
    }

    .ssw-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid rgba(130, 195, 255, 0.35);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 0 10px rgba(58,169,255,0.15);
      background: linear-gradient(135deg, #1e3a8a, #0f172a);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ssw-avatar svg { width: 100%; height: 100%; display: block; }

    .ssw-pilot-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .ssw-pilot-name {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ssw-pilot-meta {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .ssw-pilot-sub {
      font-size: 9px;
      opacity: 0.55;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      margin-top: 4px;
      font-weight: 600;
    }

    /* ===== Stats: прогресс-бары ===== */
    .ssw-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ssw-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ssw-bar-label {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 78px;
      font-size: 11px;
      font-weight: 600;
      opacity: 0.9;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .ssw-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      filter: drop-shadow(0 0 3px currentColor);
    }

    .ssw-bar {
      position: relative;
      flex: 1;
      height: 18px;
      background: rgba(0,0,0,0.55);
      border-radius: 5px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.85);
      border: 1px solid rgba(255,255,255,0.06);
    }

    .ssw-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 4px;
      /* 4. Плавная анимация */
      transition:
        width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        background 0.3s ease;
      position: relative;
    }

    /* Верхний блик — 3D-эффект */
    .ssw-bar-fill::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 4px;
      right: 4px;
      height: 4px;
      background: linear-gradient(180deg, rgba(255,255,255,0.45), transparent);
      border-radius: 3px;
    }

    /* 8. Текст ВНУТРИ бара */
    .ssw-bar-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: #fff;
      text-shadow:
        0 1px 2px rgba(0,0,0,1),
        0 0 4px rgba(0,0,0,0.8);
      letter-spacing: 0.04em;
      pointer-events: none;
    }

    /* 5. Цвета с градиентами и свечением */
    .ssw-fill-armor {
      background: linear-gradient(90deg, #16a34a, #2dd36f 60%, #86efac);
      box-shadow:
        0 0 14px rgba(45, 211, 111, 0.45),
        inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .ssw-fill-shield {
      background: linear-gradient(90deg, #1d4ed8, #3aa9ff 60%, #93c5fd);
      box-shadow:
        0 0 14px rgba(58, 169, 255, 0.45),
        inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .ssw-fill-energy {
      background: linear-gradient(90deg, #d97706, #ffc857 60%, #fde68a);
      box-shadow:
        0 0 14px rgba(255, 200, 87, 0.45),
        inset 0 1px 0 rgba(255,255,255,0.25);
    }

    /* Цвета иконок под цвет стата */
    .ssw-row--armor  .ssw-icon { color: #4ade80; }
    .ssw-row--shield .ssw-icon { color: #60a5fa; }
    .ssw-row--energy .ssw-icon { color: #fbbf24; }

    /* ===== Footer: оружие и кредиты ===== */
    .ssw-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(130, 195, 255, 0.12);
    }

    .ssw-weapon {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ssw-weapon-name {
      color: #93c5fd;
      font-weight: 700;
    }

    .ssw-credits {
      font-size: 14px;
      font-weight: 700;
      color: #86efac;
      letter-spacing: 0.04em;
      text-shadow: 0 0 10px rgba(134, 239, 172, 0.4);
    }
  `;
  document.head.appendChild(st);
}

export class ShipStatusWidget {
  constructor({ id = "ship-status-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._lastStamp = "";
  }

  mount(parent) {
    injectStyles();

    const el = document.createElement("div");
    el.className = "ssw-container";
    this.el = el;
    parent.appendChild(el);

    el.innerHTML = `
      <div class="ssw-header">
        <div class="ssw-avatar" data-k="avatar">
          <!-- 2. Аватар-силуэт пилота в шлеме (заглушка, пока нет портретов) -->
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sswAG_${this.id}" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.55"/>
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
              </linearGradient>
              <linearGradient id="sswVG_${this.id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#93c5fd"/>
                <stop offset="100%" stop-color="#1d4ed8"/>
              </linearGradient>
            </defs>
            <rect width="64" height="64" fill="url(#sswAG_${this.id})"/>
            <!-- Шлем -->
            <path d="M14 34 C14 20 50 20 50 34 L50 44 C50 48 46 50 42 50 L22 50 C18 50 14 48 14 44 Z"
                  fill="rgba(210,220,245,0.85)"
                  stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>
            <!-- Визор -->
            <ellipse cx="32" cy="30" rx="13" ry="6"
                     fill="url(#sswVG_${this.id})"
                     stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/>
            <!-- Блик визора -->
            <ellipse cx="28" cy="28" rx="5" ry="2"
                     fill="rgba(255,255,255,0.5)"/>
            <!-- Деталь шлема -->
            <rect x="28" y="44" width="8" height="4" rx="1" fill="rgba(100,130,180,0.7)"/>
          </svg>
        </div>
        <div class="ssw-pilot-info">
          <div class="ssw-pilot-name" data-k="pilotName">—</div>
          <div class="ssw-pilot-meta" data-k="pilotMeta">—</div>
          <div class="ssw-pilot-sub">Пилот</div>
        </div>
      </div>

      <div class="ssw-stats">
        <div class="ssw-row ssw-row--armor">
          <div class="ssw-bar-wrap">
            <div class="ssw-bar-label">
              <!-- 9. SVG-иконка щита (броня) -->
              <svg class="ssw-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>
              </svg>
              <span>Броня</span>
            </div>
            <div class="ssw-bar">
              <div class="ssw-bar-fill ssw-fill-armor" data-k="armor"></div>
              <div class="ssw-bar-text" data-k="armorText">0 / 0</div>
            </div>
          </div>
        </div>

        <div class="ssw-row ssw-row--shield">
          <div class="ssw-bar-wrap">
            <div class="ssw-bar-label">
              <!-- SVG-иконка шестиугольника (щиты) -->
              <svg class="ssw-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
              </svg>
              <span>Щиты</span>
            </div>
            <div class="ssw-bar">
              <div class="ssw-bar-fill ssw-fill-shield" data-k="shield"></div>
              <div class="ssw-bar-text" data-k="shieldText">0 / 0</div>
            </div>
          </div>
        </div>

        <div class="ssw-row ssw-row--energy">
          <div class="ssw-bar-wrap">
            <div class="ssw-bar-label">
              <!-- SVG-иконка молнии (энергия) -->
              <svg class="ssw-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z"/>
              </svg>
              <span>Энергия</span>
            </div>
            <div class="ssw-bar">
              <div class="ssw-bar-fill ssw-fill-energy" data-k="energy"></div>
              <div class="ssw-bar-text" data-k="energyText">0 / 0</div>
            </div>
          </div>
        </div>
      </div>

      <div class="ssw-footer">
        <div class="ssw-weapon">
          Оружие: <span class="ssw-weapon-name" data-k="weapon">—</span>
        </div>
        <div class="ssw-credits" data-k="credits">₡ 0</div>
      </div>
    `;

    this.$pilotName = el.querySelector('[data-k="pilotName"]');
    this.$pilotMeta = el.querySelector('[data-k="pilotMeta"]');
    this.$armor     = el.querySelector('[data-k="armor"]');
    this.$shield    = el.querySelector('[data-k="shield"]');
    this.$energy    = el.querySelector('[data-k="energy"]');
    this.$armorText  = el.querySelector('[data-k="armorText"]');
    this.$shieldText = el.querySelector('[data-k="shieldText"]');
    this.$energyText = el.querySelector('[data-k="energyText"]');
    this.$weapon    = el.querySelector('[data-k="weapon"]');
    this.$credits   = el.querySelector('[data-k="credits"]');
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update(game, scene) {
    const state  = game?.state;
    const ship   = state?.playerShip?.runtime;
    const player = state?.player;

    if (!ship) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    const armor      = ship.armor      ?? 0;
    const armorMax   = ship.armorMax   ?? 0;
    const shield     = ship.shield     ?? 0;
    const shieldMax  = ship.shieldMax  ?? 0;
    const energy     = ship.energy     ?? 0;
    const energyMax  = ship.energyMax  ?? 0;

    const weaponName = scene?.ctx?.weapons?.available?.[scene?.ctx?.weapons?.currentIndex]?.name ?? "—";
    const credits    = Math.max(0, Math.floor(state?.credits ?? 0));

    // Снимаем шум: округляем значения перед сравнением
    const stamp = [
      player?.name   ?? "",
      player?.raceId ?? "",
      player?.classId ?? "",
      Math.round(armor),     Math.round(armorMax),
      Math.round(shield),    Math.round(shieldMax),
      Math.round(energy),    Math.round(energyMax),
      weaponName,
      credits,
    ].join("|");

    if (stamp === this._lastStamp) return;
    this._lastStamp = stamp;

    // ===== Обновление DOM =====
    if (this.$pilotName) this.$pilotName.textContent = player?.name || "—";

    const race = player?.raceId || "—";
    const cls  = player?.classId || "—";
    if (this.$pilotMeta) this.$pilotMeta.textContent = `${race} • ${cls}`;

    if (this.$weapon)  this.$weapon.textContent  = (weaponName || "—").toUpperCase();
    if (this.$credits) this.$credits.textContent = `₡ ${formatCredits(credits)}`;

    // 4. CSS transition сам плавно перетекает из старого значения в новое
    if (this.$armor)  this.$armor.style.width  = `${pct(armor,  armorMax)}%`;
    if (this.$shield) this.$shield.style.width = `${pct(shield, shieldMax)}%`;
    if (this.$energy) this.$energy.style.width = `${pct(energy, energyMax)}%`;

    if (this.$armorText)  this.$armorText.textContent  = `${Math.round(armor)} / ${Math.round(armorMax)}`;
    if (this.$shieldText) this.$shieldText.textContent = `${Math.round(shield)} / ${Math.round(shieldMax)}`;
    if (this.$energyText) this.$energyText.textContent = `${Math.round(energy)} / ${Math.round(energyMax)}`;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}
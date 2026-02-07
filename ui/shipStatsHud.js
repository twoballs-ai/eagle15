// ui/shipStatsHud.js
export class ShipStatsHUD {
  constructor({ id = "ship-stats-hud", parent = document.body } = {}) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      parent.appendChild(el);
    }
    this.el = el;

    // Разметка: слева пилот (аватар+имя+раса/класс), справа статы корабля
    el.innerHTML = `
      <div class="ssh-wrap">
        <div class="ssh-pilot">
          <div class="ssh-avatar">
            <img data-k="avatar" alt="" />
          </div>
          <div class="ssh-pilot-info">
            <div class="ssh-pilot-name" data-k="pilotName">—</div>
            <div class="ssh-pilot-raceclass" data-k="pilotRaceClass">—</div>
            <div class="ssh-pilot-sub" data-k="pilotSub">Пилот</div>
          </div>
        </div>

        <div class="ssh-stats">
          <div class="ssh-row">
            <div class="ssh-label">БРОНЯ</div>
            <div class="ssh-bar">
              <div class="ssh-fill" data-k="hp"></div>
              <div class="ssh-barText" data-k="hpText">0/0</div>
            </div>
          </div>

          <div class="ssh-row">
            <div class="ssh-label">ЩИТЫ</div>
            <div class="ssh-bar">
              <div class="ssh-fill" data-k="sh"></div>
              <div class="ssh-barText" data-k="shText">0/0</div>
            </div>
          </div>

          <div class="ssh-row">
            <div class="ssh-label">ЭНЕРГИЯ</div>
            <div class="ssh-bar">
              <div class="ssh-fill" data-k="en"></div>
              <div class="ssh-barText" data-k="enText">0/0</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Стили (один раз)
    if (!document.getElementById("ship-stats-hud-style")) {
      const st = document.createElement("style");
      st.id = "ship-stats-hud-style";
      st.textContent = `
#${id}{
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 9999;
  pointer-events: none;

  width: 420px;
  padding: 10px 12px;
  border-radius: 12px;

  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 10px 28px rgba(0,0,0,0.35);

  color: rgba(235,245,255,0.95);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
  font-size: 12px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0,0,0,0.65);
}

#${id} .ssh-wrap{
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: start;
}

#${id} .ssh-pilot{
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  align-items: center;

  padding: 8px 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
}

#${id} .ssh-avatar{
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
}
#${id} .ssh-avatar img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

#${id} .ssh-pilot-name{
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#${id} .ssh-pilot-raceclass{
  margin-top: 2px;
  opacity: 0.85;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#${id} .ssh-pilot-sub{
  margin-top: 2px;
  opacity: 0.65;
  font-size: 11px;
}

#${id} .ssh-stats{
  padding: 2px 0;
}

#${id} .ssh-row{
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 8px;
  align-items: center;
  margin: 7px 0;
}

#${id} .ssh-label{
  opacity: 0.85;
  white-space: nowrap;
}

/* ✅ BAR: длиннее + текст поверх */
#${id} .ssh-bar{
  position: relative;
  height: 14px;               /* было 8px */
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
}

#${id} .ssh-fill{
  height: 100%;
  width: 0%;
}

#${id} .ssh-fill[data-k="hp"]{ background: rgba(120,255,120,0.85); }
#${id} .ssh-fill[data-k="sh"]{ background: rgba(80,200,255,0.85); }
#${id} .ssh-fill[data-k="en"]{ background: rgba(255,220,120,0.85); }

/* ✅ цифры "0/0" поверх полоски */
#${id} .ssh-barText{
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .02em;
  color: rgba(235,245,255,0.95);
  text-shadow: 0 1px 2px rgba(0,0,0,0.75);
  mix-blend-mode: normal;
}
      `;
      document.head.appendChild(st);
    }

    // Кэш ссылок
    const q = (sel) => el.querySelector(sel);

    this.avatarImg = q('img[data-k="avatar"]');
    this.pilotNameEl = q('[data-k="pilotName"]');
    this.pilotRaceClassEl = q('[data-k="pilotRaceClass"]');
    this.pilotSubEl = q('[data-k="pilotSub"]');

    this.fillHP = q('.ssh-fill[data-k="hp"]');
    this.fillSH = q('.ssh-fill[data-k="sh"]');
    this.fillEN = q('.ssh-fill[data-k="en"]');

    // ✅ теперь тексты внутри баров
    this.hpText = q('.ssh-barText[data-k="hpText"]');
    this.shText = q('.ssh-barText[data-k="shText"]');
    this.enText = q('.ssh-barText[data-k="enText"]');

    this._lastStats = "";
    this._lastPilot = "";
    this.setPilot({ name: "—", raceName: "", className: "", avatarUrl: "" });
  }

  setVisible(v) {
    this.el.style.display = v ? "" : "none";
  }

  /**
   * ✅ Обновить пилота (вызывай после выбора на стартовом экране или после загрузки сейва).
   * raceName/className — уже ЧЕЛОВЕЧЕСКИЕ названия ("Синты", "Инженер"),
   * чтобы HUD не тянул зависимости на data/character/*.
   */
  setPilot({
    name = "—",
    raceName = "",
    className = "",
    avatarUrl = "",
    sub = "Пилот",
  } = {}) {
    const stamp = `${name}|${raceName}|${className}|${avatarUrl}|${sub}`;
    if (stamp === this._lastPilot) return;
    this._lastPilot = stamp;

    if (this.pilotNameEl) this.pilotNameEl.textContent = name || "—";

    const rc =
      (raceName || className)
        ? `${raceName || "—"} · ${className || "—"}`
        : "—";

    if (this.pilotRaceClassEl) this.pilotRaceClassEl.textContent = rc;
    if (this.pilotSubEl) this.pilotSubEl.textContent = sub || "";

    // Если аватар не задан — показываем заглушку
    if (this.avatarImg) {
      if (avatarUrl) {
        this.avatarImg.src = avatarUrl;
        this.avatarImg.style.opacity = "1";
      } else {
        this.avatarImg.src =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="rgba(120,180,255,0.55)"/>
                  <stop offset="1" stop-color="rgba(20,30,60,0.85)"/>
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="14" fill="url(#g)"/>
              <circle cx="32" cy="26" r="10" fill="rgba(255,255,255,0.65)"/>
              <rect x="14" y="40" width="36" height="16" rx="8" fill="rgba(255,255,255,0.50)"/>
            </svg>
          `);
        this.avatarImg.style.opacity = "0.95";
      }
    }
  }

  update(shipRuntime) {
    if (!shipRuntime) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    const hp = shipRuntime.hp ?? 0;
    const hpMax = shipRuntime.hpMax ?? 0;
    const sh = shipRuntime.shield ?? 0;
    const shMax = shipRuntime.shieldMax ?? 0;
    const en = shipRuntime.energy ?? 0;
    const enMax = shipRuntime.energyMax ?? 0;

    const stamp = [hp, hpMax, sh, shMax, en, enMax].join("|");
    if (stamp === this._lastStats) return;
    this._lastStats = stamp;

    const hp01 = hpMax > 0 ? hp / hpMax : 0;
    const sh01 = shMax > 0 ? sh / shMax : 0;
    const en01 = enMax > 0 ? en / enMax : 0;

    this.fillHP.style.width = `${Math.max(0, Math.min(1, hp01)) * 100}%`;
    this.fillSH.style.width = `${Math.max(0, Math.min(1, sh01)) * 100}%`;
    this.fillEN.style.width = `${Math.max(0, Math.min(1, en01)) * 100}%`;

    if (this.hpText) this.hpText.textContent = `${Math.round(hp)}/${Math.round(hpMax)}`;
    if (this.shText) this.shText.textContent = `${Math.round(sh)}/${Math.round(shMax)}`;
    if (this.enText) this.enText.textContent = `${Math.round(en)}/${Math.round(enMax)}`;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
  }
}

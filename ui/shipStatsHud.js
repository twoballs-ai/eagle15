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

    // разметка
    el.innerHTML = `
      <div class="ssh-title">SHIP</div>

      <div class="ssh-row">
        <div class="ssh-label">HP</div>
        <div class="ssh-bar"><div class="ssh-fill" data-k="hp"></div></div>
        <div class="ssh-val" data-k="hpText">0/0</div>
      </div>

      <div class="ssh-row">
        <div class="ssh-label">SH</div>
        <div class="ssh-bar"><div class="ssh-fill" data-k="sh"></div></div>
        <div class="ssh-val" data-k="shText">0/0</div>
      </div>

      <div class="ssh-row">
        <div class="ssh-label">EN</div>
        <div class="ssh-bar"><div class="ssh-fill" data-k="en"></div></div>
        <div class="ssh-val" data-k="enText">0/0</div>
      </div>

      <div class="ssh-meta">
        <div>SPD: <span data-k="spd">0</span></div>
        <div>POS: <span data-k="pos">0,0</span></div>
      </div>
    `;

    // стили (вставим один раз)
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
  width: 260px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(235,245,255,0.95);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0,0,0,0.65);
}
#${id} .ssh-title{
  font-size: 12px;
  letter-spacing: 0.12em;
  opacity: 0.9;
  margin-bottom: 8px;
}
#${id} .ssh-row{
  display: grid;
  grid-template-columns: 28px 1fr 56px;
  gap: 8px;
  align-items: center;
  margin: 6px 0;
}
#${id} .ssh-label{ opacity: 0.85; }
#${id} .ssh-val{ text-align: right; opacity: 0.9; }
#${id} .ssh-bar{
  height: 8px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
}
#${id} .ssh-fill{
  height: 100%;
  width: 0%;
  background: rgba(80,200,255,0.85);
}
#${id} .ssh-fill[data-k="hp"]{ background: rgba(120,255,120,0.85); }
#${id} .ssh-fill[data-k="sh"]{ background: rgba(80,200,255,0.85); }
#${id} .ssh-fill[data-k="en"]{ background: rgba(255,220,120,0.85); }

#${id} .ssh-meta{
  margin-top: 8px;
  opacity: 0.85;
  display: grid;
  gap: 4px;
}
      `;
      document.head.appendChild(st);
    }

    // кэш ссылок
    const q = (sel) => el.querySelector(sel);
    this.fillHP = q('.ssh-fill[data-k="hp"]');
    this.fillSH = q('.ssh-fill[data-k="sh"]');
    this.fillEN = q('.ssh-fill[data-k="en"]');

    this.hpText = q('[data-k="hpText"]');
    this.shText = q('[data-k="shText"]');
    this.enText = q('[data-k="enText"]');

    this.spd = q('[data-k="spd"]');
    this.pos = q('[data-k="pos"]');

    this._last = "";
  }

  setVisible(v) {
    this.el.style.display = v ? "" : "none";
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

    const speed = Math.hypot(shipRuntime.vx ?? 0, shipRuntime.vz ?? 0);

    // собрать строку, чтобы не трогать DOM если ничего не поменялось
    const stamp = [
      hp, hpMax, sh, shMax, en, enMax,
      speed.toFixed(1),
      shipRuntime.x?.toFixed?.(0), shipRuntime.z?.toFixed?.(0),
    ].join("|");

    if (stamp === this._last) return;
    this._last = stamp;

    const hp01 = hpMax > 0 ? (hp / hpMax) : 0;
    const sh01 = shMax > 0 ? (sh / shMax) : 0;
    const en01 = enMax > 0 ? (en / enMax) : 0;

    this.fillHP.style.width = `${Math.max(0, Math.min(1, hp01)) * 100}%`;
    this.fillSH.style.width = `${Math.max(0, Math.min(1, sh01)) * 100}%`;
    this.fillEN.style.width = `${Math.max(0, Math.min(1, en01)) * 100}%`;

    this.hpText.textContent = `${Math.round(hp)}/${Math.round(hpMax)}`;
    this.shText.textContent = `${Math.round(sh)}/${Math.round(shMax)}`;
    this.enText.textContent = `${Math.round(en)}/${Math.round(enMax)}`;

    this.spd.textContent = `${speed.toFixed(0)}`;
    this.pos.textContent = `${(shipRuntime.x ?? 0).toFixed(0)}, ${(shipRuntime.z ?? 0).toFixed(0)}`;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
  }
}

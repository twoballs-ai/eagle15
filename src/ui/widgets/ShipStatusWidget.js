function apply(el, styles) { Object.assign(el.style, styles); }

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function pct(v, max) {
  if (!max || max <= 0) return 0;
  return clamp01(v / max) * 100;
}

export class ShipStatusWidget {
  constructor({ id = "ship-status-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._lastStamp = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    this.el = el;
    parent.appendChild(el);

    apply(el, {
      pointerEvents: "none",
      width: "380px",
      color: "#ecf3ff",
      background: "linear-gradient(180deg, rgba(17,24,36,0.88), rgba(7,12,20,0.86))",
      border: "1px solid rgba(130, 195, 255, 0.24)",
      borderRadius: "16px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
      padding: "12px",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    });

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div>
          <div data-k="pilot" style="font-size:13px;font-weight:700;letter-spacing:.03em;">ПИЛОТ —</div>
          <div data-k="meta" style="font-size:11px;opacity:.72;margin-top:2px;">Корабль в норме</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <div data-k="weapon" style="font-size:10px;letter-spacing:.08em;opacity:.75;">ОРУЖИЕ: ИМПУЛЬС</div>
          <div data-k="credits" style="font-size:11px;font-weight:700;color:#9fffc7;letter-spacing:.03em;">₡ 0</div>
        </div>
      </div>

      <div style="display:grid;gap:8px;">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:10px;opacity:.8;margin-bottom:4px;"><span>БРОНЯ</span><span data-k="armorText">0 / 0</span></div>
          <div style="height:12px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
            <div data-k="armor" style="height:100%;width:0%;background:linear-gradient(90deg,#46d381,#98ffb9);"></div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:10px;opacity:.8;margin-bottom:4px;"><span>ЩИТ</span><span data-k="shieldText">0 / 0</span></div>
          <div style="height:12px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
            <div data-k="shield" style="height:100%;width:0%;background:linear-gradient(90deg,#46b0ff,#9fd9ff);"></div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:10px;opacity:.8;margin-bottom:4px;"><span>ЭНЕРГИЯ</span><span data-k="energyText">0 / 0</span></div>
          <div style="height:12px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
            <div data-k="energy" style="height:100%;width:0%;background:linear-gradient(90deg,#ffb84d,#ffe59e);"></div>
          </div>
        </div>
      </div>
    `;

    this.$pilot = el.querySelector('[data-k="pilot"]');
    this.$meta = el.querySelector('[data-k="meta"]');
    this.$armor = el.querySelector('[data-k="armor"]');
    this.$shield = el.querySelector('[data-k="shield"]');
    this.$energy = el.querySelector('[data-k="energy"]');
    this.$armorText = el.querySelector('[data-k="armorText"]');
    this.$shieldText = el.querySelector('[data-k="shieldText"]');
    this.$energyText = el.querySelector('[data-k="energyText"]');
    this.$weapon = el.querySelector('[data-k="weapon"]');
    this.$credits = el.querySelector('[data-k="credits"]');
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update(game, scene) {
    const state = game?.state;
    const ship = state?.playerShip?.runtime;
    const player = state?.player;

    if (!ship) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    const armor = ship.armor ?? 0;
    const armorMax = ship.armorMax ?? 0;
    const shield = ship.shield ?? 0;
    const shieldMax = ship.shieldMax ?? 0;
    const energy = ship.energy ?? 0;
    const energyMax = ship.energyMax ?? 0;

    const weaponName = scene?.ctx?.weapons?.available?.[scene?.ctx?.weapons?.currentIndex]?.name ?? "Импульс";

    const stamp = [
      player?.name ?? "",
      player?.raceId ?? "",
      player?.classId ?? "",
      armor,
      armorMax,
      shield,
      shieldMax,
      energy,
      energyMax,
      weaponName,
      state?.credits ?? 0,
    ].join("|");

    if (stamp === this._lastStamp) return;
    this._lastStamp = stamp;

    this.$pilot.textContent = `ПИЛОТ ${player?.name ?? "—"}`;
    this.$meta.textContent = `${player?.raceId ?? "—"} • ${player?.classId ?? "—"}`;
    if (this.$weapon) this.$weapon.textContent = `ОРУЖИЕ: ${weaponName.toUpperCase()} (G)`;
    if (this.$credits) this.$credits.textContent = `₡ ${Math.max(0, Math.floor(state?.credits ?? 0))}`;

    this.$armor.style.width = `${pct(armor, armorMax)}%`;
    this.$shield.style.width = `${pct(shield, shieldMax)}%`;
    this.$energy.style.width = `${pct(energy, energyMax)}%`;

    this.$armorText.textContent = `${Math.round(armor)} / ${Math.round(armorMax)}`;
    this.$shieldText.textContent = `${Math.round(shield)} / ${Math.round(shieldMax)}`;
    this.$energyText.textContent = `${Math.round(energy)} / ${Math.round(energyMax)}`;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

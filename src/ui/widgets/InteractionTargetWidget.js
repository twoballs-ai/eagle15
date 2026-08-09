// src/ui/widgets/InteractionTargetWidget.js
// Компактный виджет статов цели взаимодействия (NPC/враг/корабль)
// Отображается справа от ShipStatusWidget только во время активного взаимодействия.
// Используется для быстрого понимания, с кем сейчас взаимодействует игрок.

import { isHostile } from "../../data/faction/factionRelationsUtil.js";

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function pct(v, max) {
  if (!max || max <= 0) return 0;
  return clamp01(v / max) * 100;
}

let STYLE_INJECTED = false;

function injectStyles() {
  if (STYLE_INJECTED) return;
  STYLE_INJECTED = true;

  const st = document.createElement("style");
  st.id = "interaction-target-widget-styles";
  st.textContent = `
    /* ===== Контейнер виджета цели взаимодействия ===== */
    /* Позиционирован справа от ShipStatusWidget (примерный отступ 260px слева) */
    .itw-container {
      position: absolute;
      left: 260px;
      top: 12px;
      width: 220px;
      pointer-events: none;
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 55;
      font-family: inherit;
    }

    .itw-container.visible {
      opacity: 1;
      transform: translateX(0);
    }

    /* ===== Внутренняя карточка с фоном ===== */
    .itw-card {
      background: linear-gradient(180deg, rgba(10, 14, 22, 0.92), rgba(5, 8, 14, 0.92));
      border: 1px solid rgba(120, 180, 255, 0.25);
      border-radius: 8px;
      padding: 8px 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(80, 140, 255, 0.15);
      backdrop-filter: blur(6px);
    }

    /* ===== Заголовок: иконка взаимодействия + имя ===== */
    .itw-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 5px;
    }

    .itw-interact-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(120, 180, 255, 0.2);
      border: 1px solid rgba(120, 180, 255, 0.4);
      border-radius: 4px;
      color: #7fb8ff;
      font-size: 10px;
      font-weight: 800;
    }

    .itw-name {
      font-size: 12px;
      font-weight: 700;
      color: #e6f1ff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.9);
      letter-spacing: 0.03em;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ===== Класс/роль NPC ===== */
    .itw-role {
      font-size: 9px;
      color: rgba(255,255,255,0.55);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    /* ===== Блок статов (HP / щиты) ===== */
    .itw-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .itw-stat-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .itw-stat-label {
      font-size: 8px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      width: 32px;
      flex-shrink: 0;
    }

    .itw-stat-bar-wrap {
      flex: 1;
      position: relative;
      height: 8px;
      background: rgba(0,0,0,0.6);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .itw-stat-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 2px;
      transition: width 0.3s ease;
      position: relative;
    }

    /* Блик на маленьком баре */
    .itw-stat-bar-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 2px;
      right: 2px;
      height: 2px;
      background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
      border-radius: 1px;
    }

    /* Цвета для HP */
    .itw-fill-health {
      background: linear-gradient(90deg, #b91c1c, #ef4444);
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
    }

    /* Цвета для щитов */
    .itw-fill-shield {
      background: linear-gradient(90deg, #1e40af, #3b82f6);
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
    }

    /* Цвета для дружественных целей */
    .itw-fill-friendly {
      background: linear-gradient(90deg, #047857, #10b981);
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
    }

    /* ===== Значения статов (числа) ===== */
    .itw-stat-value {
      font-size: 9px;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
      text-shadow: 0 1px 2px rgba(0,0,0,1);
      width: 50px;
      text-align: right;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    /* ===== Подсказка о взаимодействии ===== */
    .itw-hint {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 9px;
      color: rgba(255, 220, 100, 0.9);
      text-align: center;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ===== Модификатор для враждебных целей ===== */
    .itw-card.hostile {
      border-color: rgba(255, 107, 107, 0.35);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(239, 68, 68, 0.2);
    }

    .itw-card.hostile .itw-interact-icon {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #ff8888;
    }

    /* ===== Модификатор для дружественных целей ===== */
    .itw-card.friendly {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(16, 185, 129, 0.15);
    }

    .itw-card.friendly .itw-interact-icon {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
    }
  `;
  document.head.appendChild(st);
}

export class InteractionTargetWidget {
  constructor({ id = "interaction-target-widget", ctx, services } = {}) {
    this.id = id;
    this.ctx = ctx;
    this.s = services;
    this.el = null;
    this._lastTargetId = null;
    this._lastStamp = "";
    this._refs = {};
  }

  mount(parent) {
    injectStyles();

    const el = document.createElement("div");
    el.className = "itw-container";
    el.innerHTML = `
      <div class="itw-card" data-k="card">
        <div class="itw-header">
          <div class="itw-interact-icon" data-k="icon">◆</div>
          <div class="itw-name" data-k="name">—</div>
        </div>
        <div class="itw-role" data-k="role">—</div>
        <div class="itw-stats">
          <div class="itw-stat-row">
            <div class="itw-stat-label">HP</div>
            <div class="itw-stat-bar-wrap">
              <div class="itw-stat-bar-fill itw-fill-health" data-k="health"></div>
            </div>
            <div class="itw-stat-value" data-k="healthValue">0 / 0</div>
          </div>
          <div class="itw-stat-row">
            <div class="itw-stat-label">Shield</div>
            <div class="itw-stat-bar-wrap">
              <div class="itw-stat-bar-fill itw-fill-shield" data-k="shield"></div>
            </div>
            <div class="itw-stat-value" data-k="shieldValue">0 / 0</div>
          </div>
        </div>
        <div class="itw-hint" data-k="hint">[ F ] Взаимодействие</div>
      </div>
    `;

    this.el = el;
    this._refs = {
      card: el.querySelector('[data-k="card"]'),
      icon: el.querySelector('[data-k="icon"]'),
      name: el.querySelector('[data-k="name"]'),
      role: el.querySelector('[data-k="role"]'),
      health: el.querySelector('[data-k="health"]'),
      shield: el.querySelector('[data-k="shield"]'),
      healthValue: el.querySelector('[data-k="healthValue"]'),
      shieldValue: el.querySelector('[data-k="shieldValue"]'),
      hint: el.querySelector('[data-k="hint"]'),
    };

    parent.appendChild(el);
  }

  setVisible(v) {
    if (!this.el) return;
    if (v) {
      this.el.classList.add("visible");
    } else {
      this.el.classList.remove("visible");
    }
  }

  // ✅ ИЗМЕНЕНО: используем ...args для безопасного парсинга аргументов,
  // чтобы поддерживать разные сигнатуры вызова из HudScope (dt, ctx+dt, game+scene+dt и т.д.)
  update(...args) {
    let dt = 0;
    for (const arg of args) {
      if (typeof arg === "number") {
        dt = arg;
        break;
      }
    }

    const services = this.s;
    const state = services?.get("state") ?? this.ctx?.state ?? null;
    if (!state) {
      this.setVisible(false);
      return;
    }

    // ===== Поиск текущей цели взаимодействия =====
    // Ищем цель в нескольких возможных местах state/ctx,
    // чтобы быть совместимыми с NpcInteractionSystem и другими источниками.
    const target =
      state.interaction?.target ??
      state.interaction?.currentTarget ??
      this.ctx?.interaction?.target ??
      this.ctx?.interaction?.currentTarget ??
      this.ctx?.interactionTarget ??
      null;

    // Если цели нет — скрываем виджет
    if (!target) {
      this.setVisible(false);
      this._lastTargetId = null;
      this._lastStamp = "";
      return;
    }

    // Определяем runtime-данные цели
    const r = target.runtime ?? target;
    const playerShip = state.playerShip;
    const playerFaction = playerShip?.factionId ?? state.player?.factionId ?? "player";

    // ===== Определяем тип отношения (враг / друг / нейтрал) =====
    const targetFaction = target.factionId ?? r.factionId ?? "neutral";
    const hostile = !!(target.isEnemy || isHostile(playerFaction, targetFaction));
    const friendly = !hostile && targetFaction === playerFaction;

    // ===== Показываем виджет =====
    this.setVisible(true);

    // Применяем модификаторы класса для изменения стиля карточки
    if (this._refs.card) {
      this._refs.card.classList.toggle("hostile", hostile);
      this._refs.card.classList.toggle("friendly", friendly);
    }

    // ===== Имя =====
    const targetName = target.name || target.shipClass || r.name || "Цель";
    if (this._refs.name && this._refs.name.textContent !== targetName) {
      this._refs.name.textContent = targetName;
    }

    // ===== Иконка =====
    if (this._refs.icon) {
      this._refs.icon.textContent = hostile ? "!" : "◆";
    }

    // ===== Роль / класс / фракция =====
    const roleText = target.shipClass || target.talkType || targetFaction || "—";
    if (this._refs.role && this._refs.role.textContent !== roleText) {
      this._refs.role.textContent = String(roleText).toUpperCase();
    }

    // ===== Данные HP и щитов =====
    const armor = r.armor ?? r.hp ?? 0;
    const armorMax = r.armorMax ?? r.hpMax ?? r.maxHp ?? 100;
    const shield = r.shield ?? 0;
    const shieldMax = r.shieldMax ?? r.maxShield ?? 0;

    // Stamp для оптимизации: обновляем DOM только при изменении значений
    const stamp = `${Math.round(armor)}|${Math.round(armorMax)}|${Math.round(shield)}|${Math.round(shieldMax)}|${target.id ?? targetName}`;

    if (stamp !== this._lastStamp) {
      this._lastStamp = stamp;

      // HP bar
      if (this._refs.health) {
        const hpPct = pct(armor, armorMax);
        this._refs.health.style.width = `${hpPct}%`;

        // Для дружественных целей используем зелёный бар
        if (friendly) {
          this._refs.health.classList.remove("itw-fill-health");
          this._refs.health.classList.add("itw-fill-friendly");
        } else {
          this._refs.health.classList.remove("itw-fill-friendly");
          this._refs.health.classList.add("itw-fill-health");
        }
      }
      if (this._refs.healthValue) {
        this._refs.healthValue.textContent = `${Math.round(armor)} / ${Math.round(armorMax)}`;
      }

      // Shield bar
      if (this._refs.shield) {
        this._refs.shield.style.width = `${pct(shield, shieldMax)}%`;
      }
      if (this._refs.shieldValue) {
        this._refs.shieldValue.textContent = shieldMax > 0
          ? `${Math.round(shield)} / ${Math.round(shieldMax)}`
          : "—";
      }
    }

    // ===== Подсказка о взаимодействии =====
    // Если цель враждебная — подсказка другая
    const hintText = hostile
      ? "[ ATTACK ] Враждебная цель"
      : friendly
      ? "[ F ] Союзник"
      : "[ F ] Взаимодействие";

    if (this._refs.hint && this._refs.hint.textContent !== hintText) {
      this._refs.hint.textContent = hintText;
    }

    this._lastTargetId = target.id ?? targetName;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
    this._refs = {};
    this._lastTargetId = null;
    this._lastStamp = "";
  }
}
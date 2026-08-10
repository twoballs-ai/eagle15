// src/ui/widgets/InteractionTargetWidget.js
// Контейнер виджетов статов целей взаимодействия (NPC/враг/корабль)
// Отображается справа от ShipStatusWidget во время активных взаимодействий.
// Поддерживает ОДНОВРЕМЕННОЕ отображение нескольких целей (например, 3 врага атакуют игрока).
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
    /* ===== Контейнер для всех виджетов целей ===== */
    /* Позиционирован справа от ShipStatusWidget (примерный отступ 260px слева) */
    .itw-container {
      position: absolute;
      left: 260px;
      top: 12px;
      display: flex;
      flex-direction: row;
      gap: 8px;
      pointer-events: none;
      z-index: 55;
      font-family: inherit;
    }

    /* ===== Отдельная карточка цели ===== */
    .itw-card {
      width: 160px;
      background: linear-gradient(180deg, rgba(10, 14, 22, 0.92), rgba(5, 8, 14, 0.92));
      border: 1px solid rgba(120, 180, 255, 0.25);
      border-radius: 6px;
      padding: 6px 8px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.6), 0 0 8px rgba(80, 140, 255, 0.15);
      backdrop-filter: blur(6px);
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .itw-card.visible {
      opacity: 1;
      transform: translateX(0);
    }

    /* ===== Заголовок: иконка взаимодействия + имя ===== */
    .itw-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 3px;
    }

    .itw-interact-icon {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(120, 180, 255, 0.2);
      border: 1px solid rgba(120, 180, 255, 0.4);
      border-radius: 3px;
      color: #7fb8ff;
      font-size: 8px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .itw-name {
      font-size: 10px;
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
      font-size: 7px;
      color: rgba(255,255,255,0.55);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    /* ===== Блок статов (HP / щиты) ===== */
    .itw-stats {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .itw-stat-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .itw-stat-label {
      font-size: 7px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      width: 28px;
      flex-shrink: 0;
    }

    .itw-stat-bar-wrap {
      flex: 1;
      position: relative;
      height: 6px;
      background: rgba(0,0,0,0.6);
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .itw-stat-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 1px;
      transition: width 0.3s ease;
      position: relative;
    }

    /* Блик на маленьком баре */
    .itw-stat-bar-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 1px;
      right: 1px;
      height: 2px;
      background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
      border-radius: 1px;
    }

    /* Цвета для HP */
    .itw-fill-health {
      background: linear-gradient(90deg, #b91c1c, #ef4444);
      box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
    }

    /* Цвета для щитов */
    .itw-fill-shield {
      background: linear-gradient(90deg, #1e40af, #3b82f6);
      box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
    }

    /* Цвета для дружественных целей */
    .itw-fill-friendly {
      background: linear-gradient(90deg, #047857, #10b981);
      box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
    }

    /* ===== Значения статов (числа) ===== */
    .itw-stat-value {
      font-size: 7px;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
      text-shadow: 0 1px 2px rgba(0,0,0,1);
      width: 40px;
      text-align: right;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    /* ===== Подсказка о взаимодействии ===== */
    .itw-hint {
      margin-top: 4px;
      padding-top: 3px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 7px;
      color: rgba(255, 220, 100, 0.9);
      text-align: center;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ===== Модификатор для враждебных целей ===== */
    .itw-card.hostile {
      border-color: rgba(255, 107, 107, 0.35);
      box-shadow: 0 3px 12px rgba(0,0,0,0.6), 0 0 8px rgba(239, 68, 68, 0.2);
    }

    .itw-card.hostile .itw-interact-icon {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #ff8888;
    }

    /* ===== Модификатор для дружественных целей ===== */
    .itw-card.friendly {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 3px 12px rgba(0,0,0,0.6), 0 0 8px rgba(16, 185, 129, 0.15);
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
    // ✅ ИЗМЕНЕНО: теперь это Map дочерних виджетов, а не один виджет
    this.cards = new Map();
    this._lastStamps = new Map();
  }

  mount(parent) {
    injectStyles();

    const el = document.createElement("div");
    el.className = "itw-container";
    this.el = el;
    parent.appendChild(el);
  }

  // ✅ НОВЫЙ МЕТОД: Создаёт дочернюю карточку для конкретной цели
  _createCard(targetId) {
    const card = document.createElement("div");
    card.className = "itw-card";
    card.innerHTML = `
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
    `;

    const refs = {
      el: card,
      icon: card.querySelector('[data-k="icon"]'),
      name: card.querySelector('[data-k="name"]'),
      role: card.querySelector('[data-k="role"]'),
      health: card.querySelector('[data-k="health"]'),
      shield: card.querySelector('[data-k="shield"]'),
      healthValue: card.querySelector('[data-k="healthValue"]'),
      shieldValue: card.querySelector('[data-k="shieldValue"]'),
      hint: card.querySelector('[data-k="hint"]'),
    };

    this.el.appendChild(card);
    this.cards.set(targetId, { el: card, refs });

    // Показываем с небольшой задержкой для анимации
    requestAnimationFrame(() => card.classList.add("visible"));

    return { el: card, refs };
  }

  // ✅ НОВЫЙ МЕТОД: Удаляет дочернюю карточку
  _removeCard(targetId) {
    const cardData = this.cards.get(targetId);
    if (cardData) {
      cardData.el.classList.remove("visible");
      setTimeout(() => {
        cardData.el.remove();
      }, 250);
      this.cards.delete(targetId);
      this._lastStamps.delete(targetId);
    }
  }

  // ✅ ИСПРАВЛЕНО: используем ...args для безопасного парсинга аргументов,
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
      // Очищаем все карточки если нет state
      for (const [id] of this.cards) {
        this._removeCard(id);
      }
      return;
    }

    // ===== Поиск всех активных целей взаимодействия =====
    // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: теперь собираем ВСЕ цели, а не одну
    const activeTargets = new Map(); // targetId -> { target, interactionSource }

    const ships = state.ships || [];
    const playerShip = state.playerShip;
    const player = playerShip?.runtime;

    // Приоритет 1: Открытый диалог (EnemyDialogWidget.currentShip)
    const dialogShip = this.ctx?.ui?.enemyDialog?.currentShip ?? null;
    if (dialogShip && dialogShip.alive !== false && !dialogShip.runtime?.dead) {
      activeTargets.set(dialogShip.id, { target: dialogShip, interactionSource: "dialog" });
    }

    // Приоритет 2: Цель автобоя (autoCombat.currentTarget)
    const autoTarget = this.ctx?.autoCombat?.currentTarget ?? null;
    if (
      autoTarget &&
      autoTarget.alive !== false &&
      !autoTarget.runtime?.dead &&
      this.ctx?.autoCombat?.enabled &&
      !activeTargets.has(autoTarget.id)
    ) {
      activeTargets.set(autoTarget.id, { target: autoTarget, interactionSource: "auto-combat" });
    }

    // Приоритет 3: Все корабли в состоянии боя или с активным предупреждением
    if (player) {
      for (const ship of ships) {
        if (!ship?.runtime || ship === playerShip) continue;
        if (ship.alive === false || ship.runtime.dead) continue;
        if (activeTargets.has(ship.id)) continue; // Уже добавлена из диалога/автобоя

        const isInteracting =
          ship.aiState === "combat" ||
          !!ship.warningState ||
          ship.aiState === "dialog";

        if (!isInteracting) continue;

        let interactionSource = "manual-combat";
        if (ship.warningState) interactionSource = "warning";
        else if (ship.aiState === "dialog") interactionSource = "dialog";

        activeTargets.set(ship.id, { target: ship, interactionSource });
      }
    }

    // ===== Обновление карточек =====
    const playerFaction = playerShip?.factionId ?? state.player?.factionId ?? "player";

    // Обновляем существующие карточки
    for (const [targetId, { target, interactionSource }] of activeTargets) {
      let cardData = this.cards.get(targetId);
      if (!cardData) {
        cardData = this._createCard(targetId);
      }

      this._updateCard(cardData, target, interactionSource, playerFaction);
    }

    // Удаляем карточки целей, которых больше нет в активных
    for (const [targetId] of this.cards) {
      if (!activeTargets.has(targetId)) {
        this._removeCard(targetId);
      }
    }
  }

  // ✅ НОВЫЙ МЕТОД: Обновляет конкретную карточку
  _updateCard(cardData, target, interactionSource, playerFaction) {
    const { refs } = cardData;
    const r = target.runtime ?? target;

    // ===== Определяем тип отношения (враг / друг / нейтрал) =====
    const targetFaction = target.factionId ?? r.factionId ?? "neutral";
    const hostile = !!(target.isEnemy || isHostile(playerFaction, targetFaction));
    const friendly = !hostile && targetFaction === playerFaction;

    // Применяем модификаторы класса для изменения стиля карточки
    refs.el.classList.toggle("hostile", hostile);
    refs.el.classList.toggle("friendly", friendly);

    // ===== Имя =====
    const targetName = target.name || target.shipClass || r.name || "Цель";
    if (refs.name && refs.name.textContent !== targetName) {
      refs.name.textContent = targetName;
    }

    // ===== Иконка =====
    if (refs.icon) {
      let iconText = "◆";
      if (interactionSource === "dialog") iconText = "💬";
      else if (interactionSource === "auto-combat" || interactionSource === "manual-combat") iconText = hostile ? "!" : "◆";
      else if (interactionSource === "warning") iconText = "⚠";
      refs.icon.textContent = iconText;
    }

    // ===== Роль / класс / фракция =====
    const roleText = target.shipClass || target.talkType || targetFaction || "—";
    if (refs.role && refs.role.textContent !== roleText) {
      refs.role.textContent = String(roleText).toUpperCase();
    }

    // ===== Данные HP и щитов =====
    const armor = r.armor ?? r.hp ?? 0;
    const armorMax = r.armorMax ?? r.hpMax ?? r.maxHp ?? 100;
    const shield = r.shield ?? 0;
    const shieldMax = r.shieldMax ?? r.maxShield ?? 0;

    // Stamp для оптимизации: обновляем DOM только при изменении значений
    const stamp = `${Math.round(armor)}|${Math.round(armorMax)}|${Math.round(shield)}|${Math.round(shieldMax)}|${interactionSource}`;
    const lastStamp = this._lastStamps.get(target.id);

    if (stamp !== lastStamp) {
      this._lastStamps.set(target.id, stamp);

      // HP bar
      if (refs.health) {
        const hpPct = pct(armor, armorMax);
        refs.health.style.width = `${hpPct}%`;

        // Для дружественных целей используем зелёный бар
        if (friendly) {
          refs.health.classList.remove("itw-fill-health");
          refs.health.classList.add("itw-fill-friendly");
        } else {
          refs.health.classList.remove("itw-fill-friendly");
          refs.health.classList.add("itw-fill-health");
        }
      }
      if (refs.healthValue) {
        refs.healthValue.textContent = `${Math.round(armor)} / ${Math.round(armorMax)}`;
      }

      // Shield bar
      if (refs.shield) {
        refs.shield.style.width = `${pct(shield, shieldMax)}%`;
      }
      if (refs.shieldValue) {
        refs.shieldValue.textContent = shieldMax > 0
          ? `${Math.round(shield)} / ${Math.round(shieldMax)}`
          : "—";
      }
    }

    // ===== Подсказка о взаимодействии =====
    let hintText = "[ F ] Взаимодействие";
    if (interactionSource === "dialog") {
      hintText = hostile ? "[ ESC ] Диалог с врагом" : "[ F ] Диалог";
    } else if (interactionSource === "auto-combat") {
      hintText = "[ АВТОБОЙ ] Цель захвачена";
    } else if (interactionSource === "manual-combat") {
      hintText = "[ БОЙ ] Активный контакт";
    } else if (interactionSource === "warning") {
      hintText = "[ ОТВЕТЬ ] Идёт отсчёт!";
    } else if (hostile) {
      hintText = "[ ATTACK ] Враждебная цель";
    } else if (friendly) {
      hintText = "[ F ] Союзник";
    }

    if (refs.hint && refs.hint.textContent !== hintText) {
      refs.hint.textContent = hintText;
    }
  }

  destroy() {
    // Удаляем все карточки
    for (const [id] of this.cards) {
      const cardData = this.cards.get(id);
      if (cardData) {
        cardData.el.remove();
      }
    }
    this.cards.clear();
    this._lastStamps.clear();
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}
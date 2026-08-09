// ui/widgets/EnemyStatusWidget.js
// Виджет отображения характеристик врага над кораблем (RPG-style health bar)

import { projectWorldToScreen } from "../../gameplay/math/project.js";
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
  st.id = "enemy-status-widget-styles";
  st.textContent = `
    /* ===== Контейнер для всех вражеских баров ===== */
    .esw-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 60;
    }

    /* ===== Отдельный бар над врагом ===== */
    .esw-enemy-bar {
      position: absolute;
      transform: translate(-50%, -100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 120px;
      max-width: 200px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .esw-enemy-bar.visible {
      opacity: 1;
    }

    /* ===== Имя врага ===== */
    .esw-name {
      font-size: 11px;
      font-weight: 700;
      color: #ff6b6b;
      text-shadow: 0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(255,107,107,0.5);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
      background: rgba(0,0,0,0.6);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255,107,107,0.3);
    }

    /* ===== Обёртка прогресс-бара ===== */
    .esw-bar-wrap {
      position: relative;
      width: 100%;
      height: 14px;
      background: rgba(0,0,0,0.7);
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(0,0,0,0.8);
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* ===== Заполнение бара ===== */
    .esw-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 5px;
      transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease;
      position: relative;
    }

    /* Блик на баре */
    .esw-bar-fill::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 3px;
      right: 3px;
      height: 3px;
      background: linear-gradient(180deg, rgba(255,255,255,0.5), transparent);
      border-radius: 2px;
    }

    /* ===== Цвета баров ===== */
    .esw-fill-health {
      background: linear-gradient(90deg, #b91c1c, #ef4444 60%, #fca5a5);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    }

    .esw-fill-shield {
      background: linear-gradient(90deg, #1e40af, #3b82f6 60%, #93c5fd);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    }

    /* ===== Текст внутри бара ===== */
    .esw-bar-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.8);
      letter-spacing: 0.04em;
      pointer-events: none;
    }

    /* ===== Фракция/класс врага ===== */
    .esw-faction {
      font-size: 9px;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 1px;
    }
  `;
  document.head.appendChild(st);
}

export class EnemyStatusWidget {
  // ✅ ИЗМЕНЕНО: добавлен параметр services в конструктор
  constructor({ id = "enemy-status-widget", ctx, services } = {}) {
    this.id = id;
    this.ctx = ctx;
    this.s = services; // ✅ ДОБАВЛЕНО: сохраняем services для доступа к r3d и view
    this.el = null;
    this.bars = new Map();
    this._lastStamp = new Map();
  }

  mount(parent) {
    injectStyles();

    const el = document.createElement("div");
    el.className = "esw-container";
    this.el = el;
    parent.appendChild(el);
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "block" : "none";
  }

  _ensureBar(shipId) {
    let bar = this.bars.get(shipId);
    if (!bar) {
      const container = document.createElement("div");
      container.className = "esw-enemy-bar";

      container.innerHTML = `
        <div class="esw-name" data-k="name">Враг</div>
        <div class="esw-bar-wrap">
          <div class="esw-bar-fill esw-fill-health" data-k="health"></div>
          <div class="esw-bar-text" data-k="healthText">0 / 0</div>
        </div>
        <div class="esw-bar-wrap" style="height: 10px;">
          <div class="esw-bar-fill esw-fill-shield" data-k="shield"></div>
          <div class="esw-bar-text" data-k="shieldText">0 / 0</div>
        </div>
        <div class="esw-faction" data-k="faction">—</div>
      `;

      this.el.appendChild(container);

      bar = {
        el: container,
        nameEl: container.querySelector('[data-k="name"]'),
        healthFill: container.querySelector('[data-k="health"]'),
        shieldFill: container.querySelector('[data-k="shield"]'),
        healthText: container.querySelector('[data-k="healthText"]'),
        shieldText: container.querySelector('[data-k="shieldText"]'),
        factionEl: container.querySelector('[data-k="faction"]'),
      };
      this.bars.set(shipId, bar);
    }
    return bar;
  }

  // ✅ ИСПРАВЛЕНО: Используем ...args для безопасного парсинга аргументов
  // HudScope может вызывать update(dt), update(ctx, dt) или update(game, scene, dt).
  update(...args) {
    let dt = 0;
    for (const arg of args) {
      if (typeof arg === "number") {
        dt = arg;
        break;
      }
    }

    // ✅ ИЗМЕНЕНО: получаем state из services или ctx, а не только из game.state
    // Это гарантирует, что мы найдем state независимо от того, как вызван update.
    const services = this.s;
    const state = services?.get("state") ?? this.ctx?.state ?? null;
    
    const r3d = services?.get("r3d");
    const getView = services?.get("getView");
    const getViewPx = services?.get("getViewPx");

    if (!r3d || !getView) {
      this.setVisible(false);
      return;
    }

    const view = getView();
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : null) ?? view;
    const vp = r3d.getVP?.();

    if (!vp) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);

    const ships = state?.ships || [];
    const playerFaction = state?.playerShip?.factionId ?? state?.player?.factionId ?? "player";
    const aliveIds = new Set();

    for (const ship of ships) {
      if (!ship?.runtime) continue;
      if (ship === state.playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      // ✅ ИЗМЕНЕНО: используем правильную функцию isHostile вместо упрощённой проверки
      // Это учитывает все правила фракционных отношений из factionRelationsUtil.js
      if (!isHostile(playerFaction, ship.factionId)) continue;

      aliveIds.add(ship.id);

      const bar = this._ensureBar(ship.id);
      const r = ship.runtime;

      // Проекция 3D координат на экран
      const wx = r.x;
      const wy = (r.y ?? 0) + 20;
      const wz = r.z;

      const s = projectWorldToScreen(wx, wy, wz, vp, viewPx);

      if (!s) {
        bar.el.classList.remove("visible");
        continue;
      }

      const dpr = viewPx.dpr ?? 1;
      const cssX = s.x / dpr;
      const cssY = s.y / dpr;

      // Проверка видимости на экране
      const visible = cssX >= -100 && cssX <= view.w + 100 && cssY >= -50 && cssY <= view.h + 100;

      if (!visible) {
        bar.el.classList.remove("visible");
        continue;
      }

      bar.el.classList.add("visible");
      bar.el.style.left = `${cssX}px`;
      bar.el.style.top = `${cssY}px`;

      // Данные корабля
      const armor = r.armor ?? 0;
      const armorMax = r.armorMax ?? 100;
      const shield = r.shield ?? 0;
      const shieldMax = r.shieldMax ?? 100;

      // Stamp для оптимизации обновлений
      const stamp = `${Math.round(armor)}|${Math.round(armorMax)}|${Math.round(shield)}|${Math.round(shieldMax)}`;
      const lastStamp = this._lastStamp.get(ship.id);

      if (stamp !== lastStamp) {
        this._lastStamp.set(ship.id, stamp);

        // Обновление здоровья (брони)
        if (bar.healthFill) {
          bar.healthFill.style.width = `${pct(armor, armorMax)}%`;
        }
        if (bar.healthText) {
          bar.healthText.textContent = `${Math.round(armor)} / ${Math.round(armorMax)}`;
        }

        // Обновление щитов
        if (bar.shieldFill) {
          bar.shieldFill.style.width = `${pct(shield, shieldMax)}%`;
        }
        if (bar.shieldText) {
          bar.shieldText.textContent = `${Math.round(shield)} / ${Math.round(shieldMax)}`;
        }
      }

      // Обновление имени и фракции
      if (bar.nameEl) {
        bar.nameEl.textContent = ship.name || ship.shipClass || "Враг";
      }
      if (bar.factionEl) {
        const factionName = ship.factionId || "Неизвестно";
        bar.factionEl.textContent = factionName;
      }
    }

    // Удаление баров мёртвых врагов
    for (const [id, bar] of this.bars) {
      if (!aliveIds.has(id)) {
        bar.el.remove();
        this.bars.delete(id);
        this._lastStamp.delete(id);
      }
    }
  }

  destroy() {
    for (const [, bar] of this.bars) {
      bar.el.remove();
    }
    this.bars.clear();
    this._lastStamp.clear();
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}
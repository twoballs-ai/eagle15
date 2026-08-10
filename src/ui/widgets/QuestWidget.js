// ui/widgets/QuestWidget.js
import { QUESTS_BY_ID } from "../../gameplay/quest/questCatalog.js";

function apply(el, styles) { Object.assign(el.style, styles); }

export class QuestWidget {
  constructor({ id = "quest-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    parent.appendChild(el);
    this.el = el;

    apply(el, {
      pointerEvents: "none",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "12px",
      lineHeight: "1.25",
      color: "rgba(235, 245, 255, 0.95)",
      textShadow: "0 1px 2px rgba(0,0,0,0.65)",
      background: "linear-gradient(180deg, rgba(18,25,39,0.88), rgba(7,12,20,0.86))",
      border: "1px solid rgba(130, 195, 255, 0.22)",
      borderRadius: "16px",
      padding: "12px",
      width: "380px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
    });

    // Добавляем стили для классов
    const styleId = "quest-widget-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .qw-header { font-size:10px; letter-spacing:.14em; opacity:.72; margin-bottom:8px; }
        .qw-list { display:grid; gap:6px; }
        .qw-item { padding:7px 8px; border-radius:8px; background:rgba(255,255,255,.05); font-size:11px; }
        .qw-main { border-left:3px solid rgba(0,200,255,.6); }
        .qw-contract { border-left:3px solid rgba(255,200,0,.6); }
        .qw-side { border-left:3px solid rgba(0,255,100,.4); }
        .qw-none { opacity:.6; font-style:italic; }
        .qw-progress { float:right; opacity:.7; font-family:monospace; }
        .qw-footer { margin-top:10px; font-size:11px; opacity:.86; }
        .qw-focus { display:block; margin-top:4px; opacity:.7; font-size:10px; }
      `;
      document.head.appendChild(style);
    }

    el.textContent = "Загрузка миссий…";
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update(game, scene, dt) {
    const ctx = scene?.ctx ?? scene;
    const state = game?.state;
    const qs = state?.questState ?? { active: {}, completed: {} };

    const actId = ctx.act?.current ?? "—";

    // Активные квесты с группировкой по типу
    const activeIds = Object.keys(qs.active);

    const mainQuests = [];
    const sideQuests = [];
    const contracts = [];

    for (const qid of activeIds) {
      const qdef = QUESTS_BY_ID[qid];
      const qstate = qs.active[qid];
      if (!qdef || !qstate) continue;

      const obj = qstate.objectives ?? {};
      const doneN = Object.values(obj).filter(o => o?.done).length;
      const allN = Object.keys(obj).length;
      const progress = `${doneN}/${allN}`;
      const priority = qstate.priority ? "⭐" : " ";

      const item = {
        id: qid,
        title: qdef.title ?? qid,
        type: qdef.type ?? "unknown",
        progress,
        priority
      };

      if (qdef.type === "main") mainQuests.push(item);
      else if (qdef.type === "contract") contracts.push(item);
      else sideQuests.push(item);
    }

    const lines = [];

    // Сначала главные миссии
    for (const q of mainQuests) {
      lines.push(`<div class="qw-item qw-main">${q.priority} [ГЛАВНАЯ] ${q.title} <span class="qw-progress">${q.progress}</span></div>`);
    }

    // Затем контракты
    for (const q of contracts) {
      lines.push(`<div class="qw-item qw-contract">📋 [КОНТРАКТ] ${q.title} <span class="qw-progress">${q.progress}</span></div>`);
    }

    // Потом побочные
    for (const q of sideQuests) {
      lines.push(`<div class="qw-item qw-side">○ [ПОБОЧНАЯ] ${q.title} <span class="qw-progress">${q.progress}</span></div>`);
    }

    const shipR = state.playerShip?.runtime;
    const focus = ctx.poiFocus;

    let focusLine = "";
    if (shipR && focus) {
      const dx = (focus.worldX ?? 0) - shipR.x;
      const dz = (focus.worldZ ?? 0) - shipR.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      focusLine = `<br><span class="qw-focus">Дистанция до цели: ${dist.toFixed(0)}m</span>`;
    }

    const hasActive = lines.length > 0;
    const listHtml = hasActive
      ? lines.slice(0, 5).join("")
      : `<div class="qw-item qw-none">Активных миссий нет</div>`;

    const text =
      `<div class="qw-header">MISSION CONTROL · ACT ${actId}</div>` +
      `<div class="qw-list">${listHtml}</div>` +
      `<div class="qw-footer">Цель: ${ctx.poiHint || "—"}${focusLine}</div>`;

    if (text === this._last) return;
    this._last = text;
    this.el.innerHTML = text;
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}
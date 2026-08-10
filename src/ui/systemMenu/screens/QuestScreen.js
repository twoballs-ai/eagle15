// ui/systemMenu/screens/QuestScreen.js
import { QUEST_CATALOG, QUESTS_BY_ID } from "../../../gameplay/quest/questCatalog.js";

function el(tag, className, parent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (parent) parent.appendChild(e);
  return e;
}

export class QuestScreen {
  constructor(services) {
    this.services = services;
    this.host = null;
    this._styleEl = null;
    this._listEl = null;
    this._detailsEl = null;
    this._filterEl = null;

    this.selected = null;
    this.filter = "all"; // all, active, available, completed
  }

  _get(key) {
    return (typeof this.services?.get === "function")
      ? this.services.get(key)
      : this.services?.[key];
  }

  mount(host) {
    this.host = host;
    this._injectStyles();
    host.innerHTML = "";

    const root = el("div", "qs-root", host);
    const top = el("div", "qs-top", root);
    el("div", "qs-title", top).textContent = "Миссии / Квесты";
    el("div", "qs-sub", top).textContent = "Активные, доступные и завершённые задачи пилота.";

    // Фильтры
    const filterBar = el("div", "qs-filterBar", root);
    const filters = [
      { id: "all", label: "Все" },
      { id: "active", label: "Активные" },
      { id: "available", label: "Доступные" },
      { id: "completed", label: "Завершённые" },
    ];
    for (const f of filters) {
      const btn = el("button", "qs-filterBtn", filterBar);
      btn.textContent = f.label;
      btn.dataset.filter = f.id;
      btn.classList.toggle("is-active", this.filter === f.id);
      btn.addEventListener("click", () => {
        this.filter = f.id;
        this.refresh();
      });
      filterBar.appendChild(btn);
    }
    this._filterEl = filterBar;

    const body = el("div", "qs-body", root);
    this._listEl = el("div", "qs-list", body);
    this._detailsEl = el("div", "qs-details", body);

    this.refresh();
  }

  onOpen() { this.refresh(); }
  destroy() { this.host = null; }

  _getQuestList() {
    const state = this._get("state");
    const qs = state?.questState ?? { active: {}, completed: {}, flags: {} };

    const allQuests = QUEST_CATALOG;

    switch (this.filter) {
      case "active": {
        const activeIds = new Set(Object.keys(qs.active));
        return allQuests.filter(q => activeIds.has(q.id));
      }
      case "available": {
        const activeIds = new Set(Object.keys(qs.active));
        const completedIds = new Set(Object.keys(qs.completed));
        return allQuests.filter(q => !activeIds.has(q.id) && !completedIds.has(q.id));
      }
      case "completed": {
        const completedIds = new Set(Object.keys(qs.completed));
        return allQuests.filter(q => completedIds.has(q.id));
      }
      default:
        return allQuests;
    }
  }

  _getQuestStatus(questDef) {
    const state = this._get("state");
    const qs = state?.questState ?? { active: {}, completed: {} };

    if (qs.completed[questDef.id]) return { status: "Завершён", type: "completed" };
    if (qs.active[questDef.id]) return { status: "Активен", type: "active" };
    return { status: "Доступен", type: "available" };
  }

  refresh() {
    if (!this._listEl || !this._detailsEl) return;

    const quests = this._getQuestList();
    const state = this._get("state");
    const qs = state?.questState ?? { active: {}, completed: {} };

    // Обновляем список
    this._listEl.innerHTML = "";
    if (quests.length === 0) {
      const empty = el("div", "qs-empty", this._listEl);
      empty.textContent = "Нет миссий в этой категории.";
      this._detailsEl.innerHTML = "<div class=\"qs-muted\">Выберите миссию для просмотра деталей.</div>";
      this.selected = null;
      return;
    }

    for (const q of quests) {
      const statusInfo = this._getQuestStatus(q);
      const row = el("button", "qs-row", this._listEl);
      row.classList.toggle("is-active", this.selected === q.id);
      row.classList.toggle("is-completed", statusInfo.type === "completed");

      const titleRow = el("div", "qs-rowTitle", row);
      titleRow.textContent = q.title;

      const typeBadge = el("span", "qs-typeBadge", titleRow);
      typeBadge.textContent = q.type === "main" ? "★" : q.type === "contract" ? "📋" : "○";

      const statusRow = el("div", "qs-rowStatus", row);
      statusRow.textContent = statusInfo.status;

      // Прогресс для активных
      if (statusInfo.type === "active" && qs.active[q.id]?.objectives) {
        const obj = qs.active[q.id].objectives;
        const doneN = Object.values(obj).filter(o => o?.done).length;
        const allN = Object.keys(obj).length;
        const progressRow = el("div", "qs-rowProgress", row);
        progressRow.textContent = `${doneN}/${allN} целей`;
      }

      row.addEventListener("click", () => {
        this.selected = q.id;
        this.refresh();
      });
    }

    // Детали
    this._detailsEl.innerHTML = "";
    const cur = quests.find((q) => q.id === this.selected) ?? quests[0];
    if (!cur) {
      this._detailsEl.textContent = "Пока нет доступных миссий.";
      return;
    }
    this.selected = cur.id;

    const statusInfo = this._getQuestStatus(cur);

    el("div", "qs-h1", this._detailsEl).textContent = cur.title;

    const statusLine = el("div", "qs-statusLine", this._detailsEl);
    statusLine.innerHTML = `<span class="qs-badge qs-badge--${statusInfo.type}">${statusInfo.status}</span>`;
    if (cur.type) {
      statusLine.innerHTML += ` <span class="qs-type">Тип: ${cur.type}</span>`;
    }

    el("div", "qs-h2", this._detailsEl).textContent = "Описание";
    el("div", "qs-text", this._detailsEl).textContent = cur.desc ?? "Нет описания.";

    if (cur.objectives && cur.objectives.length > 0) {
      el("div", "qs-h2", this._detailsEl).textContent = "Цели";
      const objList = el("div", "qs-objectives", this._detailsEl);

      const qState = qs.active[cur.id];
      for (const obj of cur.objectives) {
        const objRow = el("div", "qs-objective", objList);
        const isDone = qState?.objectives?.[obj.id]?.done ?? false;
        objRow.classList.toggle("is-done", isDone);

        const checkbox = el("span", "qs-objCheck", objRow);
        checkbox.textContent = isDone ? "✓" : "○";

        el("span", "qs-objTitle", objRow).textContent = obj.title ?? obj.id;
      }
    }

    // Кнопки действий для доступных миссий
    if (statusInfo.type === "available") {
      const actionsDiv = el("div", "qs-actions", this._detailsEl);
      const startBtn = el("button", "qs-actionBtn", actionsDiv);
      startBtn.textContent = "Начать миссию";
      startBtn.addEventListener("click", () => {
        this._startQuest(cur);
      });
    }
  }

  _startQuest(questDef) {
    const state = this._get("state");
    const questState = this._get("questState");

    if (questState?.startQuest) {
      questState.startQuest(questDef);
      console.log(`[QuestScreen] Миссия начата: ${questDef.title}`);
      this.refresh();
    } else if (state?.questState) {
      // Fallback: напрямую добавляем в active
      const objectives = {};
      for (const obj of questDef.objectives ?? []) {
        objectives[obj.id] = { done: false, progress: 0 };
      }
      state.questState.active[questDef.id] = {
        startedAt: Date.now(),
        priority: !!questDef.priorityDefault,
        objectives,
      };
      console.log(`[QuestScreen] Миссия начата (fallback): ${questDef.title}`);
      this.refresh();
    }
  }

  _injectStyles() {
    if (this._styleEl) return;
    const st = document.createElement("style");
    st.textContent = `
      .qs-root{display:flex;flex-direction:column;gap:12px}
      .qs-top{padding:10px 12px;border:1px solid rgba(160,200,255,.10);border-radius:12px;background:rgba(0,0,0,.18)}
      .qs-title{font-weight:900;font-size:16px;color:#e8f0ff}
      .qs-sub{opacity:.7;font-size:12px;margin-top:4px}

      .qs-filterBar{display:flex;gap:8px;padding:0 12px}
      .qs-filterBtn{padding:8px 14px;border-radius:10px;border:1px solid rgba(160,200,255,.12);background:rgba(0,0,0,.18);color:#a8c8ff;cursor:pointer;font-size:12px;font-weight:700;transition:all .12s ease}
      .qs-filterBtn:hover{background:rgba(0,0,0,.28);border-color:rgba(160,200,255,.20)}
      .qs-filterBtn.is-active{background:rgba(0,255,220,.12);border-color:rgba(0,255,220,.30);color:#e8f0ff}

      .qs-body{display:grid;grid-template-columns:380px 1fr;gap:12px;min-height:450px}
      .qs-list,.qs-details{border-radius:14px;border:1px solid rgba(160,200,255,.10);background:rgba(0,0,0,.18);padding:12px}
      .qs-list{display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:500px}
      .qs-row{padding:12px;border-radius:12px;border:1px solid rgba(160,200,255,.10);background:rgba(255,255,255,.04);color:#eaf3ff;text-align:left;cursor:pointer;transition:all .12s ease}
      .qs-row:hover{background:rgba(255,255,255,.08)}
      .qs-row.is-active{background:rgba(255,255,255,.12);border-color:rgba(0,255,220,.20)}
      .qs-row.is-completed{opacity:.6;background:rgba(0,255,100,.06)}
      .qs-rowTitle{font-weight:900;font-size:13px;display:flex;justify-content:space-between;align-items:center}
      .qs-typeBadge{opacity:.7;font-size:14px}
      .qs-rowStatus{opacity:.65;font-size:11px;margin-top:6px}
      .qs-rowProgress{opacity:.55;font-size:11px;margin-top:4px;font-family:monospace}
      .qs-empty{opacity:.5;font-size:13px;text-align:center;padding:20px}

      .qs-details{display:flex;flex-direction:column;gap:12px;overflow-y:auto}
      .qs-h1{font-weight:950;font-size:18px;color:#e8f0ff}
      .qs-statusLine{display:flex;gap:12px;align-items:center}
      .qs-badge{padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
      .qs-badge--active{background:rgba(0,200,255,.18);color:#80e0ff;border:1px solid rgba(0,200,255,.30)}
      .qs-badge--available{background:rgba(255,200,0,.12);color:#ffd060;border:1px solid rgba(255,200,0,.25)}
      .qs-badge--completed{background:rgba(0,255,100,.14);color:#80ff90;border:1px solid rgba(0,255,100,.28)}
      .qs-type{opacity:.6;font-size:12px}
      .qs-h2{font-weight:900;opacity:.9;margin-top:6px;font-size:14px;color:#c8d8ff}
      .qs-muted{opacity:.65;font-size:13px}
      .qs-text{white-space:pre-line;opacity:.85;font-size:13px;line-height:1.55;color:#b8c8d8}

      .qs-objectives{display:flex;flex-direction:column;gap:6px}
      .qs-objective{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.03)}
      .qs-objective.is-done{opacity:.5}
      .qs-objCheck{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.08);font-size:11px;font-weight:900}
      .qs-objective.is-done .qs-objCheck{background:rgba(0,255,100,.20);color:#80ff90}
      .qs-objTitle{font-size:13px;color:#c8d8ff}

      .qs-actions{margin-top:8px;padding-top:12px;border-top:1px solid rgba(160,200,255,.08)}
      .qs-actionBtn{padding:10px 16px;border-radius:10px;border:none;background:linear-gradient(90deg,rgba(0,200,255,.20),rgba(0,255,220,.18));color:#e8f0ff;font-weight:800;font-size:13px;cursor:pointer;transition:all .12s ease}
      .qs-actionBtn:hover{transform:translateY(-1px);background:linear-gradient(90deg,rgba(0,200,255,.28),rgba(0,255,220,.24))}
    `;
    document.head.appendChild(st);
    this._styleEl = st;
  }
}
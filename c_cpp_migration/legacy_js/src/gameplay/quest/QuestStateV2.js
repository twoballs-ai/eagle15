// gameplay/quest/QuestStateV2.js
export class QuestStateV2 {
  constructor({ storageKey = "game.questState.v2" } = {}) {
    this.storageKey = storageKey;

    this.active = {};    // { [questId]: { startedAt, priority, objectives: { [objId]: { done, progress } } } }
    this.completed = {}; // { [questId]: { completedAt } }

    this.flags = {};
    this.visitedPoi = {};
    this.log = [];

    this.load();
  }

  // ===== log =====
  addLog(text) {
    const entry = { t: Date.now(), text };
    this.log.push(entry);
    if (this.log.length > 300) this.log.shift();
    this.save();
    return entry;
  }

  // ===== flags =====
  setFlag(flag, value = true) {
    this.flags[flag] = !!value;
    this.save();
  }
  hasFlag(flag) {
    return !!this.flags[flag];
  }

  // ===== quest lifecycle =====
  startQuest(questDef, { priority = false } = {}) {
    if (!questDef?.id) return;
    if (this.completed[questDef.id]) return;

    if (this.active[questDef.id]) {
      this.active[questDef.id].priority = !!priority;
      this.save();
      return;
    }

    const objectives = {};
    for (const obj of questDef.objectives ?? []) {
      objectives[obj.id] = { done: false, progress: 0 };
    }

    this.active[questDef.id] = {
      startedAt: Date.now(),
      priority: !!priority,
      objectives,
    };

    this.addLog(`Квест начат: ${questDef.title}`);
    this.save();
  }

  isQuestActive(questId) {
    return !!this.active[questId];
  }

  isQuestCompleted(questId) {
    return !!this.completed[questId];
  }

  setPriority(questId, value = true) {
    if (!this.active[questId]) return;
    this.active[questId].priority = !!value;
    this.save();
  }

  completeObjective(questId, objId) {
    const q = this.active[questId];
    if (!q?.objectives?.[objId]) return;

    q.objectives[objId].done = true;
    q.objectives[objId].progress = 1;
    this.save();
  }

  setObjectiveProgress(questId, objId, value01) {
    const q = this.active[questId];
    if (!q?.objectives?.[objId]) return;

    q.objectives[objId].progress = Math.max(0, Math.min(1, value01));
    if (q.objectives[objId].progress >= 1) q.objectives[objId].done = true;

    this.save();
  }

  tryCompleteQuest(questDef) {
    const q = this.active[questDef.id];
    if (!q) return false;

    const allDone = (questDef.objectives ?? []).every((obj) => q.objectives?.[obj.id]?.done);
    if (!allDone) return false;

    delete this.active[questDef.id];
    this.completed[questDef.id] = { completedAt: Date.now() };

    this.addLog(`Квест завершён: ${questDef.title}`);
    this.save();
    return true;
  }

  // ===== POI visited =====
  markVisited(poiId) {
    this.visitedPoi[poiId] = true;
    this.save();
  }
  isVisited(poiId) {
    return !!this.visitedPoi[poiId];
  }

  // ===== persistence =====
  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          active: this.active,
          completed: this.completed,
          flags: this.flags,
          visitedPoi: this.visitedPoi,
          log: this.log,
        })
      );
    } catch (_) {}
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.active) this.active = data.active;
      if (data.completed) this.completed = data.completed;
      if (data.flags) this.flags = data.flags;
      if (data.visitedPoi) this.visitedPoi = data.visitedPoi;
      if (Array.isArray(data.log)) this.log = data.log;
    } catch (_) {}
  }

  reset() {
    try { localStorage.removeItem(this.storageKey); } catch (_) {}
    this.active = {};
    this.completed = {};
    this.flags = {};
    this.visitedPoi = {};
    this.log = [];
    this.save();
  }
}

// src/gameplay/quest/QuestStateV2.js
import { addPlayerXP } from "../../data/level/playerLevel.js";
import { LEVEL_CONFIG } from "../../data/level/levelConfig.js";

export class QuestStateV2 {
  // 🚨 ИЗМЕНЕНО: Принимаем основной объект state, а не ключ localStorage
  constructor(state) {
    this.state = state;

    // Защита на случай, если questState еще не инициализирован
    if (!this.state.questState) {
      this.state.questState = {
        active: {},
        completed: {},
        flags: {},
        visitedPoi: {},
        log: []
      };
    }

    // Короткая ссылка для удобства
    this.qs = this.state.questState;
  }

  // ===== log =====
  addLog(text) {
    const entry = { t: Date.now(), text };
    this.qs.log.push(entry);
    if (this.qs.log.length > 300) this.qs.log.shift();
    // 🚨 УБРАНО: this.save() - глобальный автосейв сохранит state
    return entry;
  }

  // ===== flags =====
  setFlag(flag, value = true) {
    this.qs.flags[flag] = !!value;
  }
  hasFlag(flag) {
    return !!this.qs.flags[flag];
  }

  // ===== quest lifecycle =====
  startQuest(questDef, { priority = false } = {}) {
    if (!questDef?.id) return;
    if (this.qs.completed[questDef.id]) return;

    if (this.qs.active[questDef.id]) {
      this.qs.active[questDef.id].priority = !!priority;
      return;
    }

    const objectives = {};
    for (const obj of questDef.objectives ?? []) {
      objectives[obj.id] = { done: false, progress: 0 };
    }

    this.qs.active[questDef.id] = {
      startedAt: Date.now(),
      priority: !!priority,
      objectives,
    };

    this.addLog(`Квест начат: ${questDef.title}`);
  }

  isQuestActive(questId) {
    return !!this.qs.active[questId];
  }

  isQuestCompleted(questId) {
    return !!this.qs.completed[questId];
  }

  setPriority(questId, value = true) {
    if (!this.qs.active[questId]) return;
    this.qs.active[questId].priority = !!value;
  }

  completeObjective(questId, objId) {
    const q = this.qs.active[questId];
    if (!q?.objectives?.[objId]) return;

    q.objectives[objId].done = true;
    q.objectives[objId].progress = 1;
  }

  setObjectiveProgress(questId, objId, value01) {
    const q = this.qs.active[questId];
    if (!q?.objectives?.[objId]) return;

    q.objectives[objId].progress = Math.max(0, Math.min(1, value01));
    if (q.objectives[objId].progress >= 1) q.objectives[objId].done = true;
  }

  tryCompleteQuest(questDef) {
    const q = this.qs.active[questDef.id];
    if (!q) return false;

    const allDone = (questDef.objectives ?? []).every((obj) => q.objectives?.[obj.id]?.done);
    if (!allDone) return false;

    delete this.qs.active[questDef.id];
    this.qs.completed[questDef.id] = { completedAt: Date.now() };

    this.addLog(`Квест завершён: ${questDef.title}`);

    // 🎁 НАГРАДА XP за завершение квеста
    const xpReward = questDef.type === "main"
      ? LEVEL_CONFIG.xpRewards.questCompleted
      : (questDef.type === "side" ? LEVEL_CONFIG.xpRewards.miniQuestCompleted : LEVEL_CONFIG.xpRewards.questCompleted);

    addPlayerXP(this.state, xpReward, `quest_completed:${questDef.id}`);

    return true;
  }

  // ===== POI visited =====
  markVisited(poiId) {
    const wasVisited = !!this.qs.visitedPoi[poiId];
    this.qs.visitedPoi[poiId] = true;

    // 🎁 НАГРАДА XP за первое посещение POI (только один раз)
    if (!wasVisited) {
      addPlayerXP(this.state, LEVEL_CONFIG.xpRewards.poiDiscovered, `poi_discovered:${poiId}`);
    }
  }
  isVisited(poiId) {
    return !!this.qs.visitedPoi[poiId];
  }

  // 🚨 НОВОЕ: Метод для полной очистки при старте новой игры
  reset() {
    this.qs.active = {};
    this.qs.completed = {};
    this.qs.flags = {};
    this.qs.visitedPoi = {};
    this.qs.log = [];
    this.addLog("Журнал квестов сброшен.");
  }
}
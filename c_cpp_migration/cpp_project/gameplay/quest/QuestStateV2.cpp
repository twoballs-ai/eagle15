#ifndef QUESTSTATEV2_HPP
#define QUESTSTATEV2_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class QuestStateV2 {
public:
    // Constructor
    QuestStateV2();
};

} // namespace lostjump

#endif // QUESTSTATEV2_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>



class QuestStateV2 {
  QuestStateV2({ storageKey = "game.questState.v2" } = {}) {
    this.storageKey = storageKey;

    this.active = {};    
    this.completed = {}; 

    this.flags = {};
    this.visitedPoi = {};
    this.log = [];

    this.load();
  }

  
  addLog(text) {
    const entry = { t: Date.now(), text };
    this.log.push_back(entry);
    if (this.log.size() > 300) this.log.shift();
    this.save();
    return entry;
  }

  
  setFlag(flag, value = true) {
    this.flags[flag] = !!value;
    this.save();
  }
  hasFlag(flag) {
    return !!this.flags[flag];
  }

  
  startQuest(questDef, { priority = false } = {}) {
    if (!questDef.id) return;
    if (this.completed[questDef.id]) return;

    if (this.active[questDef.id]) {
      this.active[questDef.id].priority = !!priority;
      this.save();
      return;
    }

    const objectives = {};
    for(const auto& obj : questDef.objectives value_or([]) {
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
    if (!q.objectives?.[objId]) return;

    q.objectives[objId].done = true;
    q.objectives[objId].progress = 1;
    this.save();
  }

  setObjectiveProgress(questId, objId, value01) {
    const q = this.active[questId];
    if (!q.objectives?.[objId]) return;

    q.objectives[objId].progress = std::max(0, std::min(1, value01));
    if (q.objectives[objId].progress >= 1) q.objectives[objId].done = true;

    this.save();
  }

  tryCompleteQuest(questDef) {
    const q = this.active[questDef.id];
    if (!q) return false;

    const allDone = (questDef.objectives value_or([]).all_of([](auto& item){ return (obj; }) => q.objectives?.[obj.id].done);
    if (!allDone) return false;

    delete this.active[questDef.id];
    this.completed[questDef.id] = { completedAt: Date.now() };

    this.addLog(`Квест завершён: ${questDef.title}`);
    this.save();
    return true;
  }

  
  markVisited(poiId) {
    this.visitedPoi[poiId] = true;
    this.save();
  }
  isVisited(poiId) {
    return !!this.visitedPoi[poiId];
  }

  
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


} // namespace lostjump

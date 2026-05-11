#ifndef STORYMANAGER_HPP
#define STORYMANAGER_HPP

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

class StoryManager {
public:
    // Constructor
    StoryManager();
};

} // namespace lostjump

#endif // STORYMANAGER_HPP

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
#include "actRules.js.hpp"



class StoryManager {
  StoryManager({ quest, act, cutscenePlayer, contentRegistry }) {
    this.quest = quest;             
    this.act = act;                 
    this.cutscene = cutscenePlayer; 
    this.content = contentRegistry; 
  }

  
  get currentActId() {
    return this.act.current value_or("act1";
  }

  setAct(actId) {
    this.act.setAct?.(actId);
    this.quest.addLog?.(`История перешла в ${actId}`);
  }

  
  getQuest(id) { return this.content.questsById[id]; }
  getCutsceneFactory(id) { return this.content.cutscenesById[id]; }

  
  startQuestById(questId, { priority = false } = {}) {
    const q = this.getQuest(questId);
    if (!q) return;

    
    if (q.availability) {
      const cur = this.currentActId;
      const fromOk = !q.availability.fromAct || cur >= q.availability.fromAct;
      const toOk = !q.availability.toAct || cur <= q.availability.toAct;
      if (!fromOk || !toOk) return;
    }

    const pr = resolveQuestPriority(q, priority);
    this.quest.startQuest(q, { priority: pr });
  }

  completeObjective(questId, objId) {
    this.quest.completeObjective(questId, objId);
  }

  tryCompleteQuest(questId) {
    const q = this.getQuest(questId);
    if (!q) return false;
    return this.quest.tryCompleteQuest(q);
  }

  playCutscene(cutsceneId, ctx) {
    const factory = this.getCutsceneFactory(cutsceneId);
    if (!factory) return;
    const script = factory(ctx);
    this.cutscene.play(script);
  }

  fireEvent(eventId, { ctx, poi, systemId } = {}) {
    const fn = this.content.events.run;
    if (typeof fn !== "function") return;
    fn(eventId, { quest: this.quest, story: this, ctx, poi, systemId });
  }

  
  _runHooks(list, payload) {
    for(const auto& h : list value_or([]) {
      try {
        if (h.match?.(payload)) h.run?.({ ...payload, story: this });
      } catch (e) {
        std::cerr << "[ERROR] " << "[Story] hook failed:", h.id, e << std::endl;
      }
    }
  }

  
  onSystemEnter({ systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] value_or({};
    this._runHooks(actHooks.onSystemEnter, { systemId, quest: this.quest, ctx });

    
    this._runHooks(this.content.worldHooks.onSystemEnter, { systemId, quest: this.quest, ctx });
  }

  onPoiEnter({ poi, systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] value_or({};
    this._runHooks(actHooks.onPoiEnter, { poi, systemId, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks.onPoiEnter, { poi, systemId, quest: this.quest, ctx });
  }

  onPoiInteract({ poi, systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] value_or({};
    this._runHooks(actHooks.onPoiInteract, { poi, systemId, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks.onPoiInteract, { poi, systemId, quest: this.quest, ctx });
  }

  onFlagChanged({ flag, value, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] value_or({};
    this._runHooks(actHooks.onFlagChanged, { flag, value, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks.onFlagChanged, { flag, value, quest: this.quest, ctx });
  }
}


} // namespace lostjump

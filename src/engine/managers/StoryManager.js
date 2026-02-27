import { resolveQuestPriority } from "../../gameplay/story/actRules.js";

export class StoryManager {
  constructor({ quest, act, cutscenePlayer, contentRegistry }) {
    this.quest = quest;             // QuestStateV2
    this.act = act;                 // ActState
    this.cutscene = cutscenePlayer; // CutscenePlayer
    this.content = contentRegistry; // createContentRegistry()
  }

  // ===== act control =====
  get currentActId() {
    return this.act?.current ?? "act1";
  }

  setAct(actId) {
    this.act?.setAct?.(actId);
    this.quest?.addLog?.(`История перешла в ${actId}`);
  }

  // ===== content access =====
  getQuest(id) { return this.content.questsById[id]; }
  getCutsceneFactory(id) { return this.content.cutscenesById[id]; }

  // ===== actions used by A.* =====
  startQuestById(questId, { priority = false } = {}) {
    const q = this.getQuest(questId);
    if (!q) return;

    // availability by act (если задано)
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
    const fn = this.content.events?.run;
    if (typeof fn !== "function") return;
    fn(eventId, { quest: this.quest, story: this, ctx, poi, systemId });
  }

  // ===== hooks runner =====
  _runHooks(list, payload) {
    for (const h of list ?? []) {
      try {
        if (h.match?.(payload)) h.run?.({ ...payload, story: this });
      } catch (e) {
        console.error("[Story] hook failed:", h?.id, e);
      }
    }
  }

  // ===== entry points (Systems call these) =====
  onSystemEnter({ systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] ?? {};
    this._runHooks(actHooks.onSystemEnter, { systemId, quest: this.quest, ctx });

    // world hooks always run (but can have availability checks in match)
    this._runHooks(this.content.worldHooks?.onSystemEnter, { systemId, quest: this.quest, ctx });
  }

  onPoiEnter({ poi, systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] ?? {};
    this._runHooks(actHooks.onPoiEnter, { poi, systemId, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks?.onPoiEnter, { poi, systemId, quest: this.quest, ctx });
  }

  onPoiInteract({ poi, systemId, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] ?? {};
    this._runHooks(actHooks.onPoiInteract, { poi, systemId, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks?.onPoiInteract, { poi, systemId, quest: this.quest, ctx });
  }

  onFlagChanged({ flag, value, ctx }) {
    const actHooks = this.content.hooksByAct?.[this.currentActId] ?? {};
    this._runHooks(actHooks.onFlagChanged, { flag, value, quest: this.quest, ctx });
    this._runHooks(this.content.worldHooks?.onFlagChanged, { flag, value, quest: this.quest, ctx });
  }
}

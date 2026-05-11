// gameplay/story/storyActions.js
export const A = {
  log: (text) => ({ quest }) => quest.addLog(text),

 setFlag: (flag, value = true) => ({ quest, story, ctx }) => {
  quest.setFlag(flag, value);
  story?.onFlagChanged?.({ flag, value, ctx });
},

  startQuest: (questId, { priority } = {}) => ({ story, ctx }) => {
    story.startQuestById(questId, { priority, ctx });
  },

  setPriority: (questId, value = true) => ({ quest }) => quest.setPriority(questId, value),

  completeObj: (questId, objId) => ({ story }) => {
    story.completeObjective(questId, objId);
  },

  tryCompleteQuest: (questId) => ({ story }) => {
    story.tryCompleteQuest(questId);
  },

  playCutsceneOnce: (cutsceneId, flagKey) => ({ story, quest, ctx }) => {
    if (flagKey && quest.hasFlag(flagKey)) return;
    story.playCutscene(cutsceneId, ctx);
    if (flagKey) quest.setFlag(flagKey, true);
  },

  playCutscene: (cutsceneId) => ({ story, ctx }) => {
    story.playCutscene(cutsceneId, ctx);
  },

  fireEvent: (eventId, payload = {}) => ({ story, ctx }) => {
    story.fireEvent(eventId, { ctx, ...payload });
  },

  seq: (...actions) => (env) => {
    for (const a of actions) a(env);
  },
};

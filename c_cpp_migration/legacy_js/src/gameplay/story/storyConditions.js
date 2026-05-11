// gameplay/story/storyConditions.js
export const C = {
  always: () => () => true,

  inSystem: (systemId) => ({ systemId: sid }) => sid === systemId,

  poiId: (poiId) => ({ poi }) => (poi?.id === poiId),

  questActive: (questId) => ({ quest }) => quest.isQuestActive(questId),

  questCompleted: (questId) => ({ quest }) => quest.isQuestCompleted(questId),

  hasFlag: (flag) => ({ quest }) => quest.hasFlag(flag),

  not: (cond) => (ctx) => !cond(ctx),

  and: (...conds) => (ctx) => conds.every((c) => c(ctx)),

  or: (...conds) => (ctx) => conds.some((c) => c(ctx)),
};

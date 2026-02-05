// data/content/world/quests/contracts.js
export const WORLD_CONTRACTS = [
  {
    id: "q:world:collect_ore_10",
    type: "contract",          // мини-квест = контракт
    title: "Собрать 10 единиц руды",
    priorityDefault: false,

    // доступность по актам (опционально)
    availability: { fromAct: "act1", toAct: "act4" },

    objectives: [{ id: "ore10", title: "Собрано: 0/10" }],

    // шаблонные параметры (на будущее)
    params: { itemId: "ore", need: 10 },
  },
];
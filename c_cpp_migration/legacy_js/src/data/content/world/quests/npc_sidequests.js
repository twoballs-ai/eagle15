// data/content/world/quests/npc_sidequests.js
// Небольшие побочные задания от NPC. Не являются глобальными миссиями.

export const WORLD_NPC_SIDEQUESTS = [
  {
    id: "q:world:npc_medic_supplies",
    type: "side",
    title: "Доставка медпакетов на станцию",
    priorityDefault: false,
    availability: { fromAct: "act1", toAct: "act3" },
    objectives: [
      { id: "pickup", title: "Забрать контейнер" },
      { id: "deliver", title: "Доставить на станцию" },
    ],
  },
  {
    id: "q:world:npc_probe_scan",
    type: "side",
    title: "Сканирование потерянного зонда",
    priorityDefault: false,
    availability: { fromAct: "act1" },
    objectives: [
      { id: "reach_probe", title: "Найти зонд" },
      { id: "scan_probe", title: "Сканировать зонд" },
    ],
  },
];

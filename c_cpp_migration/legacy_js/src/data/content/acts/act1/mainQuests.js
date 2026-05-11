// data/content/acts/act1/mainQuests.js
export const ACT1_MAIN_QUESTS = [
  {
    id: "q:act1:repair_ship",
    type: "main",
    actId: "act1",
    title: "Починить корабль",
    priorityDefault: true,
    objectives: [
      { id: "nav",       title: "Восстановить навигацию" },
      { id: "stabilize", title: "Стабилизировать системы" },
      { id: "parts",     title: "Найти ремонтные детали" },
      { id: "upgrade",   title: "Установить модуль" },
      { id: "beacon",    title: "Активировать маяк (может быть в другой системе)" },
    ],
  },
];

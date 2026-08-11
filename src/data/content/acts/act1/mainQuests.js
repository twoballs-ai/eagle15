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
      { id: "beacon",    title: "Активировать маяк" },
    ],
  },
  {
    id: "q:act1:first_contact",
    type: "main",
    actId: "act1",
    title: "Первый контакт",
    priorityDefault: true,
    objectives: [
      { id: "find_station", title: "Найти торговую станцию" },
      { id: "meet_trader", title: "Встретиться с торговцем" },
      { id: "learn_language", title: "Изучить основы языка фракции" },
      { id: "establish_trade", title: "Наладить торговые отношения" },
    ],
  },
  {
    id: "q:act1:pirate_threat",
    type: "main",
    actId: "act1",
    title: "Пиратская угроза",
    priorityDefault: true,
    objectives: [
      { id: "investigate_attacks", title: "Расследовать нападения на корабли" },
      { id: "find_base", title: "Обнаружить пиратскую базу" },
      { id: "defeat_leader", title: "Победить лидера пиратов" },
      { id: "report_success", title: "Доложить об успехе" },
    ],
  },
];
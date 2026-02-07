// data/ship/shipClasses.js

// 1) Справочник “рангов” корпуса (как MMO)
export const SHIP_GRADES = {
  D: {
    id: "D",
    name: "Стандарт",
    uiName: "D • Стандарт",
    unlockLevel: 1,
    // модификаторы к baseStats класса
    statsMul: { hull: 0.90, shields: 0.90, energy: 0.90, speed: 0.98 },
    // опционально: бонусные слоты
    slotsAdd: { weapon: 0, utility: 0 },
  },
  C: {
    id: "C",
    name: "Улучшенный",
    uiName: "C • Улучшенный",
    unlockLevel: 3,
    statsMul: { hull: 1.00, shields: 1.00, energy: 1.00, speed: 1.00 },
    slotsAdd: { weapon: 0, utility: 0 },
  },
  B: {
    id: "B",
    name: "Редкий",
    uiName: "B • Редкий",
    unlockLevel: 7,
    statsMul: { hull: 1.12, shields: 1.10, energy: 1.08, speed: 1.02 },
    slotsAdd: { weapon: 0, utility: 1 },
  },
  A: {
    id: "A",
    name: "Элитный",
    uiName: "A • Элитный",
    unlockLevel: 12,
    statsMul: { hull: 1.25, shields: 1.22, energy: 1.18, speed: 1.04 },
    slotsAdd: { weapon: 1, utility: 1 },
  },
  S: {
    id: "S",
    name: "Легендарный",
    uiName: "S • Легендарный",
    unlockLevel: 20,
    statsMul: { hull: 1.45, shields: 1.45, energy: 1.35, speed: 1.06 },
    slotsAdd: { weapon: 1, utility: 2 },
    // можно потом добавить: уникальный перк/эффект
    // perkId: "proto_core"
  },
};

// 2) 6 “типов” кораблей (как ты просил)
export const SHIP_CLASSES = {
  scout: {
    id: "scout",
    name: "Разведчик",
    role: "Лёгкий",
    desc: "Быстрый и манёвренный корабль для разведки и ухода от боя.",

    // доступность типа корабля (да, некоторые типы — только с уровня)
    unlockLevel: 1,

    baseStats: { hull: 80, shields: 40, energy: 60, speed: 1.45 },
    slots: { weapon: 1, utility: 1 },

    // какие ранги вообще бывают у этого типа
    allowedGrades: ["D", "C", "B", "A"],
  },

  frigate: {
    id: "frigate",
    name: "Фрегат",
    role: "Универсальный",
    desc: "Баланс защиты, огня и мобильности. Основа малого флота.",

    unlockLevel: 4,

    baseStats: { hull: 140, shields: 100, energy: 90, speed: 1.05 },
    slots: { weapon: 2, utility: 2 },
    allowedGrades: ["C", "B", "A"],
  },

  destroyer: {
    id: "destroyer",
    name: "Эсминец",
    role: "Ударный",
    desc: "Корабль прорыва: мощный залп при умеренной защите.",

    unlockLevel: 8,

    baseStats: { hull: 220, shields: 140, energy: 130, speed: 0.85 },
    slots: { weapon: 3, utility: 2 },
    allowedGrades: ["C", "B", "A", "S"],
  },

  cruiser: {
    id: "cruiser",
    name: "Крейсер",
    role: "Тяжёлый",
    desc: "Корабль длительного боя. Высокая живучесть и энергия.",

    unlockLevel: 12,

    baseStats: { hull: 320, shields: 220, energy: 190, speed: 0.65 },
    slots: { weapon: 4, utility: 3 },
    allowedGrades: ["B", "A", "S"],
  },

  battleship: {
    id: "battleship",
    name: "Линкор",
    role: "Капитальный",
    desc: "Крепость и главный калибр. Медленный, но страшный.",

    unlockLevel: 16,

    baseStats: { hull: 480, shields: 320, energy: 260, speed: 0.5 },
    slots: { weapon: 5, utility: 3 },
    allowedGrades: ["A", "S"],
  },

  carrier: {
    id: "carrier",
    name: "Носитель",
    role: "Капитальный (поддержка)",
    desc: "Командный корабль флота. Сильная энергия и утилити под модули.",

    unlockLevel: 18,

    baseStats: { hull: 420, shields: 420, energy: 360, speed: 0.45 },
    slots: { weapon: 3, utility: 5 },
    allowedGrades: ["A", "S"],
  },
};

export const SHIP_CLASS_LIST = Object.values(SHIP_CLASSES);

// 3) Утилита: собрать “конкретный корпус” = тип + ранг
export function buildShipSpec(classId, gradeId) {
  const cls = SHIP_CLASSES[classId] ?? SHIP_CLASSES.scout;
  const g = SHIP_GRADES[gradeId] ?? SHIP_GRADES.C;

  // проверка allowedGrades (если не разрешён — откатываем на ближайший безопасный)
  const allowed = cls.allowedGrades ?? ["C"];
  const useGrade = allowed.includes(g.id) ? g : SHIP_GRADES[allowed[0]];

  const mul = useGrade.statsMul ?? {};
  const add = useGrade.slotsAdd ?? {};

  const base = cls.baseStats;
  const stats = {
    hull: Math.round((base.hull ?? 0) * (mul.hull ?? 1)),
    shields: Math.round((base.shields ?? 0) * (mul.shields ?? 1)),
    energy: Math.round((base.energy ?? 0) * (mul.energy ?? 1)),
    speed: Number(((base.speed ?? 1) * (mul.speed ?? 1)).toFixed(2)),
  };

  const slots = {
    weapon: Math.max(0, (cls.slots?.weapon ?? 0) + (add.weapon ?? 0)),
    utility: Math.max(0, (cls.slots?.utility ?? 0) + (add.utility ?? 0)),
  };

  return {
    classId: cls.id,
    grade: useGrade.id,
    name: `${cls.name} ${useGrade.id}`,
    role: cls.role,
    desc: cls.desc,
    unlockLevel: Math.max(cls.unlockLevel ?? 1, useGrade.unlockLevel ?? 1),
    stats,
    slots,
  };
}

// 4) Утилита: что доступно игроку на уровне lvl
export function getAvailableShipOptions(playerLevel = 1) {
  const lvl = Math.max(1, playerLevel | 0);
  const out = [];

  for (const cls of Object.values(SHIP_CLASSES)) {
    if (lvl < (cls.unlockLevel ?? 1)) continue;

    for (const gradeId of (cls.allowedGrades ?? [])) {
      const g = SHIP_GRADES[gradeId];
      if (!g) continue;

      const req = Math.max(cls.unlockLevel ?? 1, g.unlockLevel ?? 1);
      if (lvl < req) continue;

      out.push(buildShipSpec(cls.id, gradeId));
    }
  }
  return out;
}

#ifndef SHIP_GRADES_HPP
#define SHIP_GRADES_HPP

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

// Function declaration
auto SHIP_GRADES();

} // namespace lostjump

#endif // SHIP_GRADES_HPP

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





export const SHIP_GRADES = {
  D: {
    id: "D",
    name: "Стандарт",
    uiName: "D • Стандарт",
    unlockLevel: 1,
    
    statsMul: { hull: 0.90, shields: 0.90, energy: 0.90, speed: 0.98 },
    
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
    
    
  },
};


export const SHIP_CLASSES = {
  scout: {
    id: "scout",
    name: "Разведчик",
    role: "Лёгкий",
    desc: "Быстрый и манёвренный корабль для разведки и ухода от боя.",

    
    unlockLevel: 1,

    baseStats: { hull: 80, shields: 40, energy: 60, speed: 1.45 },
    slots: { weapon: 1, utility: 1 },

    
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


export function buildShipSpec(classId, gradeId) {
  const cls = SHIP_CLASSES[classId] value_or(SHIP_CLASSES.scout;
  const g = SHIP_GRADES[gradeId] value_or(SHIP_GRADES.C;

  
  const allowed = cls.allowedGrades value_or(["C"];
  const useGrade = allowed.count(g.id) > 0 ? g : SHIP_GRADES[allowed[0]];

  const mul = useGrade.statsMul value_or({};
  const add = useGrade.slotsAdd value_or({};

  const base = cls.baseStats;
  const stats = {
    hull: Math.round((base.hull value_or(0) * (mul.hull value_or(1)),
    shields: Math.round((base.shields value_or(0) * (mul.shields value_or(1)),
    energy: Math.round((base.energy value_or(0) * (mul.energy value_or(1)),
    speed: std::stod(((base.speed value_or(1) * (mul.speed value_or(1)).toFixed(2)),
  };

  const slots = {
    weapon: std::max(0, (cls.slots.weapon value_or(0) + (add.weapon value_or(0)),
    utility: std::max(0, (cls.slots.utility value_or(0) + (add.utility value_or(0)),
  };

  return {
    classId: cls.id,
    grade: useGrade.id,
    name: `${cls.name} ${useGrade.id}`,
    role: cls.role,
    desc: cls.desc,
    unlockLevel: std::max(cls.unlockLevel value_or(1, useGrade.unlockLevel value_or(1),
    stats,
    slots,
  };
}


export function getAvailableShipOptions(playerLevel = 1) {
  const lvl = std::max(1, playerLevel | 0);
  const out = [];

  for(const auto& cls : Object.values(SHIP_CLASSES)) {
    if (lvl < (cls.unlockLevel value_or(1)) continue;

    for(const auto& gradeId : (cls.allowedGrades value_or([])) {
      const g = SHIP_GRADES[gradeId];
      if (!g) continue;

      const req = std::max(cls.unlockLevel value_or(1, g.unlockLevel value_or(1);
      if (lvl < req) continue;

      out.push_back(buildShipSpec(cls.id, gradeId));
    }
  }
  return out;
}


} // namespace lostjump

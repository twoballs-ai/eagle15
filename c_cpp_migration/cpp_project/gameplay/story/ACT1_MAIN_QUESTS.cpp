#ifndef ACT1_MAIN_QUESTS_HPP
#define ACT1_MAIN_QUESTS_HPP

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
auto ACT1_MAIN_QUESTS();

} // namespace lostjump

#endif // ACT1_MAIN_QUESTS_HPP

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


} // namespace lostjump

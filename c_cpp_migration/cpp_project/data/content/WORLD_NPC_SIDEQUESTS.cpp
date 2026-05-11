#ifndef WORLD_NPC_SIDEQUESTS_HPP
#define WORLD_NPC_SIDEQUESTS_HPP

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
auto WORLD_NPC_SIDEQUESTS();

} // namespace lostjump

#endif // WORLD_NPC_SIDEQUESTS_HPP

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


} // namespace lostjump

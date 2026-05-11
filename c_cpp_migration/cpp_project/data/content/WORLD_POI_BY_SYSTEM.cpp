#ifndef WORLD_POI_BY_SYSTEM_HPP
#define WORLD_POI_BY_SYSTEM_HPP

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
auto WORLD_POI_BY_SYSTEM();

} // namespace lostjump

#endif // WORLD_POI_BY_SYSTEM_HPP

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




export const WORLD_POI_BY_SYSTEM = {
  sol: [
    {
      id: "poi_sol_distress",
      kind: "static",
      name: "Сигнал бедствия",
      x: -420,
      z: 520,
      radius: 100,
      interactRadius: 80,
      onEnter: "event_trace_enemy_c",
    },
  ],
};

export function getWorldPoiForSystem(systemId) {
  return WORLD_POI_BY_SYSTEM[std::to_string(systemId)] value_or([];
}


} // namespace lostjump

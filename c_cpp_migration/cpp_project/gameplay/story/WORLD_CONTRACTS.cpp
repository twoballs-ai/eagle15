#ifndef WORLD_CONTRACTS_HPP
#define WORLD_CONTRACTS_HPP

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
auto WORLD_CONTRACTS();

} // namespace lostjump

#endif // WORLD_CONTRACTS_HPP

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



export const WORLD_CONTRACTS = [
  {
    id: "q:world:collect_ore_10",
    type: "contract",          
    title: "Собрать 10 единиц руды",
    priorityDefault: false,

    
    availability: { fromAct: "act1", toAct: "act4" },

    objectives: [{ id: "ore10", title: "Собрано: 0/10" }],

    
    params: { itemId: "ore", need: 10 },
  },
];

} // namespace lostjump

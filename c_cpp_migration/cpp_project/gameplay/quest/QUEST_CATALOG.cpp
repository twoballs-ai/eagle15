#ifndef QUEST_CATALOG_HPP
#define QUEST_CATALOG_HPP

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
auto QUEST_CATALOG();

} // namespace lostjump

#endif // QUEST_CATALOG_HPP

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
#include "contracts.js.hpp"
#include "mainQuests.js.hpp"
#include "npc_sidequests.js.hpp"






export const QUEST_CATALOG = [
  ...ACT1_MAIN_QUESTS,
  ...WORLD_CONTRACTS,
  ...WORLD_NPC_SIDEQUESTS,
];

export const QUESTS_BY_ID = Object.fromEntries(QUEST_CATALOG.map([](auto& item){ return (q; }) => [q.id, q]));


} // namespace lostjump

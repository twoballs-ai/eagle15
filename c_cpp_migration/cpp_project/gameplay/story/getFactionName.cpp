#ifndef GETFACTIONNAME_HPP
#define GETFACTIONNAME_HPP

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
auto getFactionName();

} // namespace lostjump

#endif // GETFACTIONNAME_HPP

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
#include "factionRanks.js.hpp"
#include "factions.js.hpp"




auto getFactionName(id) {
  return FACTIONS[id].name || id;
}
export function getRankName(id) {
  return FACTION_RANKS[id].name || id;
}


} // namespace lostjump

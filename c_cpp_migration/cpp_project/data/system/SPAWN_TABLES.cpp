#ifndef SPAWN_TABLES_HPP
#define SPAWN_TABLES_HPP

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
auto SPAWN_TABLES();

} // namespace lostjump

#endif // SPAWN_TABLES_HPP

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





export const SPAWN_TABLES = {
  pirates: {
    factionId: "pirates",
    kind: "enemy",
    
    groupsMin: 1,
    groupsMax: 2,
    
    perGroupMin: 1,
    perGroupMax: 3,
    
    shipClasses: ["scout", "frigate"],
    shipRaceIds: ["human", "synth"],
    
    preferredPointTypes: ["pirate", "lane"],
  },

  traders: {
    factionId: "traders",
    kind: "npc",
    groupsMin: 0,
    groupsMax: 2,
    perGroupMin: 1,
    perGroupMax: 2,
    shipClasses: ["scout"],
    shipRaceIds: ["human"],
    preferredPointTypes: ["trader", "lane"],
  },

  neutral: {
    factionId: "neutral",
    kind: "npc",
    groupsMin: 0,
    groupsMax: 1,
    perGroupMin: 1,
    perGroupMax: 1,
    shipClasses: ["scout"],
    shipRaceIds: ["human", "synth"],
    preferredPointTypes: ["lane"],
  },
};


} // namespace lostjump

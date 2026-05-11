#ifndef ACT1_SPAWN_OVERRIDES_HPP
#define ACT1_SPAWN_OVERRIDES_HPP

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
auto ACT1_SPAWN_OVERRIDES();

} // namespace lostjump

#endif // ACT1_SPAWN_OVERRIDES_HPP

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




export const ACT1_SPAWN_OVERRIDES = {
  sol: {
    pirates: { groupsDelta: -1, perGroupDelta: 0 },
    traders: { groupsDelta: 1, perGroupDelta: 1 },
  },
};

export function getAct1SpawnOverride(systemId) {
  return ACT1_SPAWN_OVERRIDES[std::to_string(systemId)] value_or(nullptr;
}


} // namespace lostjump

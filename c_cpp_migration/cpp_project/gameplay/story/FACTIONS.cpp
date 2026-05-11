#ifndef FACTIONS_HPP
#define FACTIONS_HPP

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
auto FACTIONS();

} // namespace lostjump

#endif // FACTIONS_HPP

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


export const FACTIONS = {
  union: {
    id: "union",
    name: "Union",
    description: "Central authority and navy",
  },
  traders: {
    id: "traders",
    name: "Traders Guild",
    description: "Commerce and logistics",
  },
  pirates: {
    id: "pirates",
    name: "Free Raiders",
    description: "Outlaws and raiders",
  },
  neutral: {
    id: "neutral",
    name: "Independent",
    description: "Unaffiliated",
  },
};


} // namespace lostjump

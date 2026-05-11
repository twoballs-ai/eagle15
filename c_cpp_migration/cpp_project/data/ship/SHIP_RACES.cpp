#ifndef SHIP_RACES_HPP
#define SHIP_RACES_HPP

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
auto SHIP_RACES();

} // namespace lostjump

#endif // SHIP_RACES_HPP

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


export const SHIP_RACES = {
  human: {
    id: "human",
    name: "Human Ship Tech",

    bonuses: {
      hull: 1.0,
      shields: 1.0,
      energy: 1.0,
    },
  },

  synth: {
    id: "synth",
    name: "Synthetic Constructs",

    bonuses: {
      hull: 0.9,
      shields: 1.3,
      energy: 1.2,
    },
  },
};


} // namespace lostjump

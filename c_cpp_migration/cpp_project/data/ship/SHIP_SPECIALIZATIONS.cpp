#ifndef SHIP_SPECIALIZATIONS_HPP
#define SHIP_SPECIALIZATIONS_HPP

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
auto SHIP_SPECIALIZATIONS();

} // namespace lostjump

#endif // SHIP_SPECIALIZATIONS_HPP

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


export const SHIP_SPECIALIZATIONS = {
  interceptor: {
    id: "interceptor",
    classId: "scout",
    name: "Interceptor",

    statModifiers: {
      speed: 0.2,
    },
  },

  artillery: {
    id: "artillery",
    classId: "frigate",
    name: "Artillery",

    statModifiers: {
      energy: 40,
    },
  },
};


} // namespace lostjump

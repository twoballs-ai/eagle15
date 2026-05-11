#ifndef SPECIALIZATIONS_HPP
#define SPECIALIZATIONS_HPP

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
auto SPECIALIZATIONS();

} // namespace lostjump

#endif // SPECIALIZATIONS_HPP

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


export const SPECIALIZATIONS = {
  assault: {
    id: "assault",
    classId: "soldier",
    name: "Assault",

    modifiers: {
      shipHullMul: 0.03,
      shipSpeedMul: 0.02,
    },

    abilities: ["dash"],
  },

  sniper: {
    id: "sniper",
    classId: "soldier",
    name: "Sniper",

    modifiers: {
      weaponSpreadMul: -0.10,
      weaponRangeMul: 0.08,
    },

    abilities: ["aim_focus"],
  },
};


} // namespace lostjump

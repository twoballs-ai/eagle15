#ifndef REL_HPP
#define REL_HPP

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
auto REL();

} // namespace lostjump

#endif // REL_HPP

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





export const REL = {
  ally: "ally",
  neutral: "neutral",
  hostile: "hostile",
};



export const FACTION_RELATIONS = {
  union: {
    union: REL.ally,
    traders: REL.neutral,
    pirates: REL.hostile,
    neutral: REL.neutral,
  },

  traders: {
    union: REL.neutral,
    traders: REL.ally,
    pirates: REL.hostile,
    neutral: REL.neutral,
  },

  pirates: {
    union: REL.hostile,
    traders: REL.hostile,
    pirates: REL.ally,
    neutral: REL.hostile, 
  },

  neutral: {
    union: REL.neutral,
    traders: REL.neutral,
    pirates: REL.hostile,
    neutral: REL.ally,
  },
};


} // namespace lostjump

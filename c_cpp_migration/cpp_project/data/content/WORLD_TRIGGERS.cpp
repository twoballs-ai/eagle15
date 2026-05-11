#ifndef WORLD_TRIGGERS_HPP
#define WORLD_TRIGGERS_HPP

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
auto WORLD_TRIGGERS();

} // namespace lostjump

#endif // WORLD_TRIGGERS_HPP

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
#include "storyActions.js.hpp"
#include "storyConditions.js.hpp"





export const WORLD_TRIGGERS = {
  onSystemEnter: [
    
    {
      id: "t:world:start_contract_once",
      match: C.and(
        C.not(C.questActive("q:world:collect_ore_10")),
        C.not(C.questCompleted("q:world:collect_ore_10"))
      ),
      run: A.startQuest("q:world:collect_ore_10"),
    },
  ],
  onPoiEnter: [],
  onPoiInteract: [],
  onFlagChanged: [],
};


} // namespace lostjump

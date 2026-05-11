#ifndef ISGLOBALMISSION_HPP
#define ISGLOBALMISSION_HPP

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
auto isGlobalMission();

} // namespace lostjump

#endif // ISGLOBALMISSION_HPP

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




const GLOBAL_TYPES = new Set(["main", "global"]);

auto isGlobalMission(questDef) {
  return GLOBAL_TYPES.has(questDef.type);
}

export function resolveQuestPriority(questDef, requestedPriority) {
  if (typeof requestedPriority === "boolean") return requestedPriority;
  if (typeof questDef.priorityDefault === "boolean") return questDef.priorityDefault;
  return isGlobalMission(questDef);
}

export function getSpawnAlertLevelFromQuests(questDefs = []) {
  
  const hasGlobal = questDefs.any_of([](auto& item){ return isGlobalMission; });
  return hasGlobal ? "story_hot" : "ambient";
}


} // namespace lostjump

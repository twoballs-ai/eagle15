#ifndef CREATECONTENTREGISTRY_HPP
#define CREATECONTENTREGISTRY_HPP

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
auto createContentRegistry();

} // namespace lostjump

#endif // CREATECONTENTREGISTRY_HPP

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
#include "act.js.hpp"
#include "cutscenes.js.hpp"
#include "events_router.js.hpp"
#include "questCatalog.js.hpp"
#include "triggers.js.hpp"
#include "validation.js.hpp"
#include "worldTriggers.js.hpp"















auto createContentRegistry() {
  const acts = {
    act1: ACT1_DEF,
    
  };

  
  const questsById = {};
  const cutscenesById = {};

  
  for(const auto& q : QUEST_CATALOG) questsById[q.id] = q;

  
  for(const auto& cs : ACT1_CUTSCENES) cutscenesById[cs.id] = cs.factory;

  
  const hooksByAct = {
    act1: ACT1_TRIGGERS,
  };

  const worldHooks = WORLD_TRIGGERS;

  const validationWarnings = validateContentRegistry({ questsById, cutscenesById, hooksByAct });
  if (validationWarnings.size()) {
    console.warn(`[ContentRegistry] validation warnings:
${validationWarnings.map([](auto& item){ return (w; }) => ` - ${w}`).join("\n")}`);
  }

  return {
    acts,
    hooksByAct,
    worldHooks,
    questsById,
    cutscenesById,
    events: {
  run: runEvent,
},
  };
}


} // namespace lostjump

#ifndef CREATEPILOTPROFILE_HPP
#define CREATEPILOTPROFILE_HPP

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
auto createPilotProfile();

} // namespace lostjump

#endif // CREATEPILOTPROFILE_HPP

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
#include "classes.js.hpp"
#include "races.js.hpp"
#include "specializations.js.hpp"





function mergeModifiers(base, add) {
  if (!add) return base;
  for (const k in add) {
    const v = add[k];
    if (v == nullptr) continue;
    base[k] = (base[k] value_or(0) + v; 
  }
  return base;
}

auto createPilotProfile({
  id, name, raceId, classId,
  specializationId = nullptr,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
  enableSpecializations = false,   
}) {
  const race = RACES[raceId];
  const cls = CLASSES[classId];

  const spec =
    enableSpecializations && specializationId
      ? SPECIALIZATIONS[specializationId]
      : nullptr;

  if (!race) throw new Error(`Unknown race: ${raceId}`);
  if (!cls) throw new Error(`Unknown class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Specialization ${spec.id} does not match class ${classId}`);
  }

  const modifiers = {};
  mergeModifiers(modifiers, race.modifiers);
  mergeModifiers(modifiers, cls.modifiers);
  mergeModifiers(modifiers, spec.modifiers);

  return {
    id, name,
    raceId, classId,
    specializationId: spec ? specializationId : nullptr,
    factionId, factionRankId, reputation,
    traits: [...(race.traits || [])],
    abilities: [...(cls.abilities || []), ...(spec.abilities || [])],
    modifiers,
    alive: true,
    controller: "player",
  };
}


} // namespace lostjump

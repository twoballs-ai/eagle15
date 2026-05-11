#ifndef CREATENPC_HPP
#define CREATENPC_HPP

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
auto createNPC();

} // namespace lostjump

#endif // CREATENPC_HPP

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





auto createNPC({
  id,
  name,
  raceId,
  classId,
  specializationId = nullptr,
  factionId = "neutral",
  factionRankId = "outsider",
  reputation = 0,
}) {
  const race = RACES[raceId];
  const cls = CLASSES[classId];
  const spec = specializationId ? SPECIALIZATIONS[specializationId] : nullptr;

  if (!race) throw new Error(`Unknown race: ${raceId}`);
  if (!cls) throw new Error(`Unknown class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Specialization ${spec.id} does not match class ${classId}`);
  }

  return {
    id,
    name,
    raceId,
    classId,
    specializationId,
    factionId,
    factionRankId,
    reputation,
    abilities: [...cls.abilities, ...(spec.abilities || [])],
    controller: "ai",
    alive: true,
  };
}


} // namespace lostjump

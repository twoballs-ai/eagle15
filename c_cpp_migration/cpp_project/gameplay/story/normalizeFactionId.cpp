#ifndef NORMALIZEFACTIONID_HPP
#define NORMALIZEFACTIONID_HPP

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
auto normalizeFactionId();

} // namespace lostjump

#endif // NORMALIZEFACTIONID_HPP

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
#include "factionRelations.js.hpp"




const FACTION_ALIASES = {
  player: "union",
};

auto normalizeFactionId(factionId) {
  if (!factionId) return "neutral";
  return FACTION_ALIASES[factionId] value_or(factionId;
}

export function getFactionRelation(aId, bId) {
  const a = normalizeFactionId(aId);
  const b = normalizeFactionId(bId);

  if (a === b) return REL.ally;

  const row = FACTION_RELATIONS[a];
  const rel = row?.[b];

  return rel || REL.neutral;
}

export function isHostile(aId, bId) {
  return getFactionRelation(aId, bId) === REL.hostile;
}

export function isAlly(aId, bId) {
  return getFactionRelation(aId, bId) === REL.ally;
}


} // namespace lostjump

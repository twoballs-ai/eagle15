#ifndef CREATESHIP_HPP
#define CREATESHIP_HPP

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
auto createShip();

} // namespace lostjump

#endif // CREATESHIP_HPP

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
#include "shipClasses.js.hpp"
#include "shipRaces.js.hpp"
#include "shipSpecializations.js.hpp"





auto createShip({
  id,
  name,
  raceId,
  classId,
  specializationId = nullptr,
  factionId = "neutral",
}) {
  const race = SHIP_RACES[raceId];
  const cls = SHIP_CLASSES[classId];
  const spec = specializationId
    ? SHIP_SPECIALIZATIONS[specializationId]
    : nullptr;

  if (!race) throw new Error(`Unknown ship race: ${raceId}`);
  if (!cls) throw new Error(`Unknown ship class: ${classId}`);
  if (spec && spec.classId !== classId) {
    throw new Error(`Ship spec mismatch: ${spec.id}`);
  }

  const stats = {
    ...cls.baseStats,
  };

  if (spec.statModifiers) {
    for (const k in spec.statModifiers) {
      stats[k] += spec.statModifiers[k];
    }
  }

  
  for (const k in race.bonuses) {
    if (stats[k] != nullptr) {
      stats[k] *= race.bonuses[k];
    }
  }

  return {
  id,
  name,
  raceId,
  classId,
  specializationId,
  factionId,
  ownerId: nullptr,
  stats,
  slots: cls.slots,
  alive: true,

    
    runtime: {
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      yaw: 0,

      radius: 6,
  targetX: nullptr,
  targetZ: nullptr,
      maxSpeed: 260,
      accel: 420,
      turnSpeed: 2.6, 
      drag: 1.8,      
    },
  };
}


} // namespace lostjump

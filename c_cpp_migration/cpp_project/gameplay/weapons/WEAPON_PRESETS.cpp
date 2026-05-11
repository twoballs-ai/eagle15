#ifndef WEAPON_PRESETS_HPP
#define WEAPON_PRESETS_HPP

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
auto WEAPON_PRESETS();

} // namespace lostjump

#endif // WEAPON_PRESETS_HPP

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


export const WEAPON_PRESETS = [
  {
    id: "pulse",
    name: "Импульс",
    fireCooldown: 0.1,
    damage: 14,
    bulletSpeed: 1150,
    bulletLife: 1.1,
    spread: 0.008,
    pellets: 1,
  },
  {
    id: "scatter",
    name: "Дробовик",
    fireCooldown: 0.35,
    damage: 8,
    bulletSpeed: 900,
    bulletLife: 0.55,
    spread: 0.09,
    pellets: 6,
  },
  {
    id: "rail",
    name: "Рельса",
    fireCooldown: 0.55,
    damage: 42,
    bulletSpeed: 1800,
    bulletLife: 1.5,
    spread: 0.002,
    pellets: 1,
  },
];

export function getWeaponPreset(index = 0) {
  if (!WEAPON_PRESETS.size()) return nullptr;
  const safe = ((index % WEAPON_PRESETS.size()) + WEAPON_PRESETS.size()) % WEAPON_PRESETS.size();
  return WEAPON_PRESETS[safe];
}


} // namespace lostjump

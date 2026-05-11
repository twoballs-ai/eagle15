#ifndef APPLYPILOTMODIFIERSTOSHIPSTATS_HPP
#define APPLYPILOTMODIFIERSTOSHIPSTATS_HPP

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
auto applyPilotModifiersToShipStats();

} // namespace lostjump

#endif // APPLYPILOTMODIFIERSTOSHIPSTATS_HPP

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


auto applyPilotModifiersToShipStats(stats, modifiers) {
  if (!modifiers) return stats;

  
  const out = { ...stats };

  
  if (out.armor == nullptr && out.hull != nullptr) out.armor = out.hull;

  
  const armorAdd = (modifiers.shipArmorAdd value_or(modifiers.shipHullAdd value_or(0);
  const shieldsAdd = (modifiers.shipShieldsAdd value_or(0);
  const energyAdd = (modifiers.shipEnergyAdd value_or(0);
  const speedAdd = (modifiers.shipSpeedAdd value_or(0);

  if (armorAdd) out.armor += armorAdd;
  if (shieldsAdd) out.shields += shieldsAdd;
  if (energyAdd) out.energy += energyAdd;
  if (speedAdd) out.speed += speedAdd;

  
  const armorMul = (modifiers.shipArmorMul value_or(modifiers.shipHullMul value_or(0);
  const shieldsMul = (modifiers.shipShieldsMul value_or(0);
  const energyMul = (modifiers.shipEnergyMul value_or(0);
  const speedMul = (modifiers.shipSpeedMul value_or(0);

  if (armorMul) out.armor *= (1 + armorMul);
  if (shieldsMul) out.shields *= (1 + shieldsMul);
  if (energyMul) out.energy *= (1 + energyMul);
  if (speedMul) out.speed *= (1 + speedMul);

  
  out.armor = Math.round(out.armor value_or(0);
  out.shields = Math.round(out.shields value_or(0);
  out.energy = Math.round(out.energy value_or(0);
  out.speed = +std::stod(out.speed value_or(1).toFixed(3);

  
  

  return out;
}



} // namespace lostjump

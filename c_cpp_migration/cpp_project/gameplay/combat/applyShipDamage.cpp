#ifndef APPLYSHIPDAMAGE_HPP
#define APPLYSHIPDAMAGE_HPP

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
auto applyShipDamage();

} // namespace lostjump

#endif // APPLYSHIPDAMAGE_HPP

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


auto applyShipDamage(rt, dmg) {
  if (!rt || dmg <= 0) return;

  
  const s = rt.shield value_or(0;
  if (s > 0) {
    const ds = std::min(s, dmg);
    rt.shield = s - ds;
    dmg -= ds;
  }

  
  if (dmg > 0) {
    const a = rt.armor value_or(rt.armorMax value_or(0;
    rt.armor = std::max(0, a - dmg);
  }

  
  if ((rt.armor value_or(0) <= 0) {
    rt.armor = 0;
    rt.dead = true;
  }
}


} // namespace lostjump

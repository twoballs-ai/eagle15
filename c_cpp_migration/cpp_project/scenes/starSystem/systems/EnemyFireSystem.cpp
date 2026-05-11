#ifndef ENEMYFIRESYSTEM_HPP
#define ENEMYFIRESYSTEM_HPP

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

class EnemyFireSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // ENEMYFIRESYSTEM_HPP

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
#include "lifecycle.js.hpp"




class EnemyFireSystem : public System {
  EnemyFireSystem(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    const state = this.s.get("state");
    this.ctx.enemyFire.update(dt, state.ships, state.playerShip);
  }
}


} // namespace lostjump

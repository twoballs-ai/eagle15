#ifndef PROJECTILESSYSTEM_HPP
#define PROJECTILESSYSTEM_HPP

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

class ProjectilesSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // PROJECTILESSYSTEM_HPP

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
#include "projectiles.js.hpp"




class ProjectilesSystem : public System {
  ProjectilesSystem(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    stepProjectiles(this.ctx.projectiles, dt, this.ctx.boundsRadius);
  }
}


} // namespace lostjump

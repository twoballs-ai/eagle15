#ifndef TIMESYSTEM_HPP
#define TIMESYSTEM_HPP

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

class TimeSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // TIMESYSTEM_HPP

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



class TimeSystem : public System {
  TimeSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }
  enter(payload) {
    this.ctx.time = 0;
  }
  update(dt) {
    this.ctx.time += dt;
  }
}


} // namespace lostjump

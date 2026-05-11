#ifndef CUTSCENESYSTEM_HPP
#define CUTSCENESYSTEM_HPP

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

class CutsceneSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // CUTSCENESYSTEM_HPP

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




class CutsceneSystem : public System {
  CutsceneSystem(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    
  }

  update(dt) {
    const actions = this.s.get("actions");

    if (this.ctx.cutscene.active && actions.pressed?.("cancel")) {
      this.ctx.cutscene.stop({ skip: true });
      return;
    }

    this.ctx.cutscene.update(dt, this.ctx);
  }
}


} // namespace lostjump

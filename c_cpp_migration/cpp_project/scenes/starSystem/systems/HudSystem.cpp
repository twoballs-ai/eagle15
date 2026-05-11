#ifndef HUDSYSTEM_HPP
#define HUDSYSTEM_HPP

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

class HudSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // HUDSYSTEM_HPP

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
#include "CommsWidget.js.hpp"
#include "HudScope.js.hpp"
#include "MinimapWidget.js.hpp"
#include "MobileControlsWidget.js.hpp"
#include "QuestWidget.js.hpp"
#include "ShipStatusWidget.js.hpp"
#include "lifecycle.js.hpp"










class HudSystem : public System {
  HudSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.scope = nullptr;
  }

  enter() {
    const ui = this.s.get("ui");
    const hud = ui.hud;
    if (!hud) return;

    this.scope = new HudScope(hud);

    this.scope.register(new ShipStatusWidget({ id: "ship-status" }), {
      slot: "top-left",
      order: 0,
      enabled: true,
    });

    this.scope.register(new QuestWidget({ id: "quest-panel" }), {
      slot: "bottom-left",
      order: 0,
      enabled: true,
    });

    this.scope.register(new CommsWidget({ id: "comms-panel", ctx: this.ctx }), {
      slot: "bottom-left",
      order: 5,
      enabled: true,
    });

    this.scope.register(new MinimapWidget({ id: "minimap", ctx: this.ctx }), {
      slot: "top-right",
      order: 10,
      enabled: true,
      props: { size: 220 },
    });

    this.scope.register(new MobileControlsWidget({ id: "mobile-controls", ctx: this.ctx }), {
      slot: "bottom-right",
      order: 100,
      enabled: true,
    });
  }

  exit() {
    this.scope.dispose();
    this.scope = nullptr;
  }
}


} // namespace lostjump

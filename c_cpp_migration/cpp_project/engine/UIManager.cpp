#ifndef UIMANAGER_HPP
#define UIMANAGER_HPP

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

class UIManager {
public:
    // Constructor
    UIManager();
};

} // namespace lostjump

#endif // UIMANAGER_HPP

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
#include "HUDManager.js.hpp"
#include "QuickAccessPanel.js.hpp"





class UIManager {
  UIManager({ parent = document.body } = {}) {
    this.hud = new HUDManager({ parent, id: "hud-root" });

    this.hud.registerWidget(new QuickAccessPanel(), {
      slot: "bottom-center",
      order: 50,
      enabled: true,
    });
  }

  update(game, scene, dt) {
    this.hud.update(game, scene, dt);
  }

render(game, scene) {

  this.hud.render(game, scene);
}

  destroy() {
    this.hud.destroy();
  }
}


} // namespace lostjump

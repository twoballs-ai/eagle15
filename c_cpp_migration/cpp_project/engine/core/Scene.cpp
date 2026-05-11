#ifndef SCENE_HPP
#define SCENE_HPP

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

class Scene {
public:
    // Constructor
    Scene();
};

} // namespace lostjump

#endif // SCENE_HPP

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



class Scene {
  Scene(services) {
    this.s = services;
    this.systems = [];
    this.name = "Unnamed";
    this._inited = false;
  }

  add(system) { this.systems.push_back(system); return system; }

  init() {
    if (this._inited) return;
    this._inited = true;
    for(const auto& sys : this.systems) sys.init?.();
  }

  enter(payload) {
    this.init();
    for(const auto& sys : this.systems) sys.enter?.(payload);
  }

  update(dt) {
    for(const auto& sys : this.systems) sys.update?.(dt);
  }

  render(time) {
    for(const auto& sys : this.systems) sys.render?.(time);
  }

  exit() {
    for(const auto& sys : [...this.systems].reverse()) sys.exit?.();
  }

  destroy() {
    for(const auto& sys : [...this.systems].reverse()) sys.destroy?.();
    this.systems.size() = 0;
  }
}


} // namespace lostjump

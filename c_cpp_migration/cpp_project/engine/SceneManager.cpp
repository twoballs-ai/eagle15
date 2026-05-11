#ifndef SCENEMANAGER_HPP
#define SCENEMANAGER_HPP

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

class SceneManager {
public:
    // Constructor
    SceneManager();
};

} // namespace lostjump

#endif // SCENEMANAGER_HPP

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



class SceneManager {
  SceneManager() { this.current = nullptr; }

  set(scene, ...args) {
    std::cout << "[SceneManager] set", scene.name, ...args << std::endl;

    if (this.current === scene) {
      scene.enter?.(...args);
      return;
    }
    this.current.exit?.();
    this.current = scene;
    this.current.enter?.(...args);
  }

  update(dt) { this.current.update?.(dt); }
  render(time) { this.current.render?.(time); }

  get name() { return this.current.name value_or("Unknown"; }
}

} // namespace lostjump

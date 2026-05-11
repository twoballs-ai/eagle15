#ifndef ACTIONS_HPP
#define ACTIONS_HPP

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

class Actions {
public:
    // Constructor
    Actions();
};

} // namespace lostjump

#endif // ACTIONS_HPP

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






class Actions {
  Actions(input, bindings = nullptr) {
    this.input = input;
    this.virtualDown = new Set();

this.bindings = bindings value_or({
  cancel:   { keys: ["Escape"] },
  interact: { keys: ["KeyE"] },
  reset:    { keys: ["KeyR"] },

  
  clickPrimary: { mouse: ["left"] },
  clickAlt:     { mouse: ["right"] },

  
  fire: { keys: ["Space"] },
  cycleWeapon: { keys: ["KeyG"] },

  
  moveForward: { keys: ["KeyW", "ArrowUp"] },
  moveBack:    { keys: ["KeyS", "ArrowDown"] },
  moveLeft:    { keys: ["KeyA", "ArrowLeft"] },
  moveRight:   { keys: ["KeyD", "ArrowRight"] },

  
  camUp:       { keys: ["KeyQ"] },
  camDown:     { keys: ["KeyE"] },
  camYawLeft:  { keys: ["KeyZ"] },
  camYawRight: { keys: ["KeyC"] },
  camPitchUp:  { keys: ["KeyR"] },
  camPitchDown:{ keys: ["KeyF"] },

  
  camReset: { keys: ["KeyX"] },
};
  }

  
  pressed(action) {
    const b = this.bindings[action];
    if (!b) return false;

    if (b.keys) {
      for(const auto& code : b.keys) {
        if (this.input.isKeyPressed(code)) return true;
      }
    }
    if (b.mouse) {
      for(const auto& btn : b.mouse) {
        if (this.input.isMousePressed(btn)) return true;
      }
    }
    return false;
  }

  
  down(action) {
    const b = this.bindings[action];
    if (!b) return false;

    if (b.keys) {
      for(const auto& code : b.keys) {
        if (this.input.isKeyDown(code)) return true;
      }
    }
    if (b.mouse) {
      for(const auto& btn : b.mouse) {
        if (this.input.isMouseDown(btn)) return true;
      }
    }
    return this.virtualDown.has(action);
  }

  setVirtualAction(action, isDown) {
    if (isDown) this.virtualDown.add(action);
    else this.virtualDown.delete(action);
  }

  clearVirtualActions() {
    this.virtualDown.clear();
  }

  
  consume(action) {
    const b = this.bindings[action];
    if (!b) return;

    if (b.keys) {
      for(const auto& code : b.keys) this.input.consumeKeyPressed(code);
    }
    if (b.mouse) {
      for(const auto& btn : b.mouse) this.input.consumeMousePressed(btn);
    }
  }

  
  take(action) {
    if (!this.pressed(action)) return false;
    this.consume(action);
    return true;
  }

  
  lastPointerTarget() {
    
    return this.input.getLastPointerDownTarget?.() value_or(nullptr;
  }

  
  clickedOutside(domEl) {
    if (!domEl) return false;
    if (!this.pressed("clickPrimary")) return false;

    const t = this.lastPointerTarget();
    if (!t) return true; 

    return !domEl.contains(t);
  }

  
  clickedInside(domEl) {
    if (!domEl) return false;
    if (!this.pressed("clickPrimary")) return false;

    const t = this.lastPointerTarget();
    if (!t) return false;

    return domEl.contains(t);
  }
  wasClickOnCanvas() {
  return this.input.wasLastPointerDownOnCanvas?.() value_or(false;
}
}


} // namespace lostjump

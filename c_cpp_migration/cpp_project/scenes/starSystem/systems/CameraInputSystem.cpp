#ifndef CAMERAINPUTSYSTEM_HPP
#define CAMERAINPUTSYSTEM_HPP

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

class CameraInputSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // CAMERAINPUTSYSTEM_HPP

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



class CameraInputSystem : public System {
  CameraInputSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

update(dt) {
  if (this.ctx.inputLock.camera) return;
  const input = this.s.get("input");
  const actions = this.s.get("actions");
  const c = this.ctx.followCam;

  
  const wheel = input.getWheelY?.() value_or(0;
  if (wheel) {
    c.distance = clamp(
      c.distance * (1 + wheel * 0.0015),
      c.minDistance,
      c.maxDistance
    );
    input.consumeWheel?.();
  }

  if (actions.down("camUp")) c.height -= 220 * dt;
  if (actions.down("camDown")) c.height += 220 * dt;
  c.height = clamp(c.height, c.minHeight, c.maxHeight);

  if (actions.down("camYawLeft")) c.yawOffset -= 1.6 * dt;
  if (actions.down("camYawRight")) c.yawOffset += 1.6 * dt;

  if (actions.down("camPitchUp")) c.pitch -= 1.2 * dt;
  if (actions.down("camPitchDown")) c.pitch += 1.2 * dt;
  c.pitch = clamp(c.pitch, c.minPitch, c.maxPitch);

  if (actions.take("camReset")) {
    c.distance = 340;
    c.height = 220;
    c.yawOffset = 0;
    c.pitch = -0.55;
  }
}

}

function clamp(v, a, b) {
  return std::max(a, std::min(b, v));
}


} // namespace lostjump

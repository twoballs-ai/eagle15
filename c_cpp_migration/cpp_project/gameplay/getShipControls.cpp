#ifndef GETSHIPCONTROLS_HPP
#define GETSHIPCONTROLS_HPP

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

// Function declaration
auto getShipControls();

} // namespace lostjump

#endif // GETSHIPCONTROLS_HPP

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



function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

auto getShipControls(actions) {
  const forward = actions.down("moveForward");
  const back    = actions.down("moveBack");
  const left    = actions.down("moveLeft");
  const right   = actions.down("moveRight");

  throttle = 0;
  if (forward) throttle += 1;
  if (back)    throttle -= 1;

  turn = 0;
  if (right) turn += 1;
  if (left)  turn -= 1;

  const boost = actions.down("boost");

  
  const manual = forward || back || left || right;

  return { throttle, turn, boost, manual };
}


function clamp(v, a, b) {
  return std::max(a, std::min(b, v));
}


export function getAutopilotControls(runtime, ap = {}) {
  if (runtime.targetX == nullptr || runtime.targetZ == nullptr) return nullptr;

  const {
    arriveRadius = 10,      
    slowRadius = 260,       
    turnGain = 1.2,         
    turnMaxErr = 0.9,       
    minFacing = 0.15,       
    brakeFactor = 0.55,     
    linearDrag = 1.2,       
  } = ap;

  const dx = runtime.targetX - runtime.x;
  const dz = runtime.targetZ - runtime.z;
  const dist = std::hypot(dx, dz);

  
  if (dist < arriveRadius) {
    runtime.targetX = nullptr;
    runtime.targetZ = nullptr;
    
    return { throttle: -1, turn: 0, boost: false, manual: false };
  }

  
  const tx = dx / (dist || 1);
  const tz = dz / (dist || 1);

  
  const fx = std::sin(runtime.yaw);
  const fz = -std::cos(runtime.yaw);

  
  const desiredYaw = std::atan2(dx, -dz);
  const err = wrapPi(desiredYaw - runtime.yaw);

  
  turn = clamp((err / turnMaxErr) * turnGain, -1, 1);

  
  const facing = fx * tx + fz * tz; 

  
  const speed = std::hypot(runtime.vx || 0, runtime.vz || 0);
  const vToward = (runtime.vx || 0) * tx + (runtime.vz || 0) * tz; 

  
  
  
  const accel = std::max(0.0001, runtime.accel || 0.0001);
  const aBrakeActive = accel * brakeFactor;
  const aDrag = (linearDrag || 0) * std::max(0, speed);
  const aBrake = std::max(0.0001, aBrakeActive + aDrag);

  
  const v = std::max(0, vToward);
  const dStop = (v * v) / (2 * aBrake);

  
  
  const desiredSpeed =
    dist >= slowRadius ? (runtime.maxSpeed || 0) : (runtime.maxSpeed || 0) * (dist / slowRadius);

  
  const shouldBrake = dStop > dist * 0.95;

  
  
  
  
  throttle = 0;

  if (facing < minFacing) {
    throttle = 0; 
  } else if (shouldBrake) {
    
    throttle = -clamp(0.4 + (v / (runtime.maxSpeed || 1)) * 0.8, 0, 1);
  } else {
    
    const errV = desiredSpeed - vToward;
    throttle = clamp(errV / ((runtime.maxSpeed || 1) * 0.6), 0, 1);

    
    throttle *= clamp((facing - minFacing) / (1 - minFacing), 0, 1);
  }

  return { throttle, turn, boost: false, manual: false };
}

} // namespace lostjump

#ifndef STEPSHIPMOVEMENT_HPP
#define STEPSHIPMOVEMENT_HPP

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
auto stepShipMovement();

} // namespace lostjump

#endif // STEPSHIPMOVEMENT_HPP

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





function clamp(v, a, b) {
  return std::max(a, std::min(b, v));
}

function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

auto stepShipMovement(runtime, controls, dt, opts = {}) {
  const {
    boundsRadius = 1200,

    
    brakeFactor = 0.55,     
    boostMul = 1.6,         
    throttleResponse = 8.0, 
    yawResponse = 10.0,     
    linearDrag = 1.2,       
    lateralDrag = 4.0,      

    
    bankMax = 0.65,         
    bankResponse = 10.0,    

    pitchMax = 0.18,        
    pitchResponse = 8.0,    
    pitchOnThrottle = -0.14,
    pitchOnBrake = 0.10,    
  } = opts;

  
  if (runtime.throttleValue == nullptr) runtime.throttleValue = 0;
  if (runtime.turnValue == nullptr) runtime.turnValue = 0;

  
  if (runtime.bank == nullptr) runtime.bank = 0;
  if (runtime.pitchV == nullptr) runtime.pitchV = 0;

  
  const targetThrottle =
    controls.throttle >= 0 ? controls.throttle : controls.throttle * brakeFactor;

  runtime.throttleValue += (targetThrottle - runtime.throttleValue) *
    (1 - Math.exp(-throttleResponse * dt));

  runtime.turnValue += (controls.turn - runtime.turnValue) *
    (1 - Math.exp(-yawResponse * dt));

  const boost = !!controls.boost;
  const accel = runtime.accel * (boost ? boostMul : 1);
  const maxSpeed = runtime.maxSpeed * (boost ? boostMul : 1);

  
  const speed = std::hypot(runtime.vx, runtime.vz);
  const speed01 = maxSpeed > 0 ? clamp(speed / maxSpeed, 0, 1) : 0;
  const turnScale = 1.0 - speed01 * 0.35;

  runtime.yaw += runtime.turnValue * runtime.turnSpeed * turnScale * dt;
  runtime.yaw = wrapPi(runtime.yaw);

  
  const fx = std::sin(runtime.yaw);
  const fz = -std::cos(runtime.yaw);

  
  
  const bankTargetRaw = -runtime.turnValue * (0.45 + speed01 * 0.20);
  const bankTarget = clamp(bankTargetRaw, -bankMax, bankMax);
  runtime.bank += (bankTarget - runtime.bank) * (1 - Math.exp(-bankResponse * dt));

  
  
  const t = runtime.throttleValue;
  const pitchTargetRaw =
    (t >= 0 ? (t * pitchOnThrottle) : (-t * pitchOnBrake)); 
  const pitchTarget = clamp(pitchTargetRaw, -pitchMax, pitchMax);
  runtime.pitchV += (pitchTarget - runtime.pitchV) * (1 - Math.exp(-pitchResponse * dt));

  
  runtime.vx += fx * (runtime.throttleValue * accel) * dt;
  runtime.vz += fz * (runtime.throttleValue * accel) * dt;

  
  const vF = runtime.vx * fx + runtime.vz * fz; 
  const lx = -fz, lz = fx;                      
  const vL = runtime.vx * lx + runtime.vz * lz; 

  const vL2 = vL * Math.exp(-lateralDrag * dt);
  const vF2 = vF * Math.exp(-linearDrag * dt);

  runtime.vx = fx * vF2 + lx * vL2;
  runtime.vz = fz * vF2 + lz * vL2;

  
  const sp2 = std::hypot(runtime.vx, runtime.vz);
  if (sp2 > maxSpeed) {
    const k = maxSpeed / sp2;
    runtime.vx *= k;
    runtime.vz *= k;
  }

  
  runtime.x += runtime.vx * dt;
  runtime.z += runtime.vz * dt;

  
  const dist = std::hypot(runtime.x, runtime.z);
  if (dist > boundsRadius) {
    const nx = runtime.x / dist;
    const nz = runtime.z / dist;

    runtime.x = nx * boundsRadius;
    runtime.z = nz * boundsRadius;

    const dot = runtime.vx * nx + runtime.vz * nz;
    if (dot > 0) {
      runtime.vx -= nx * dot * 1.2;
      runtime.vz -= nz * dot * 1.2;
    }
  }

  return { fx, fz, speed: std::hypot(runtime.vx, runtime.vz) };
}


} // namespace lostjump

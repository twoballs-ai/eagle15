#ifndef CLAMP_HPP
#define CLAMP_HPP

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
auto clamp();

} // namespace lostjump

#endif // CLAMP_HPP

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


auto clamp = [](v, a, b) std::max(a, std::min(b, v));
export const lerp(a, b, t) { return a + (b - a) * t; }

export function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return std::hypot(dx, dy);
}





export function mat3Identity() {
  return new Float32Array([1,0,0,  0,1,0,  0,0,1]);
}


export function mat3WorldToClip(viewW, viewH, camX, camY, zoom) {
  
  
  
  
  
  
  
  
  
  
  
  
  const sx = (zoom * 2) / viewW;
  const sy = -(zoom * 2) / viewH;
  const tx = (-camX * zoom * 2) / viewW;
  const ty = (camY * zoom * 2) / viewH;

  
  
  
  
  return new Float32Array([sx,0,0,  0,sy,0,  tx,ty,1]);
}

export function screenToWorld(screenX, screenY, viewW, viewH, camX, camY, zoom) {
  
  const wx = camX + (screenX - viewW * 0.5) / zoom;
  const wy = camY + (screenY - viewH * 0.5) / zoom;
  return { x: wx, y: wy };
}


} // namespace lostjump

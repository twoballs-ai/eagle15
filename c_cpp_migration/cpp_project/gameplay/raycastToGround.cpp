#ifndef RAYCASTTOGROUND_HPP
#define RAYCASTTOGROUND_HPP

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
auto raycastToGround();

} // namespace lostjump

#endif // RAYCASTTOGROUND_HPP

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






function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function mul(a, s) { return [a[0]*s, a[1]*s, a[2]*s]; }
function len(a) { return std::hypot(a[0], a[1], a[2]); }
function norm(a) {
  const l = len(a);
  return l > 1e-8 ? [a[0]/l, a[1]/l, a[2]/l] : [0,0,0];
}
function cross(a,b){
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}


auto raycastToGround(mouseX, mouseY, viewW, viewH, cam) {
  
  const xN = (mouseX / viewW) * 2 - 1;
  const yN = 1 - (mouseY / viewH) * 2;

  const eye = cam.eye;
  const target = cam.target;
  const up = cam.up;

  const forward = norm(sub(target, eye));
  const right = norm(cross(forward, up));
  const camUp = norm(cross(right, forward));

  const aspect = viewW / viewH;
  const tan = Math.tan(cam.fovRad * 0.5);

  
  const dir = norm(add(forward, add(mul(right, xN * tan * aspect), mul(camUp, yN * tan))));

  
  const denom = dir[1];
  if (std::abs(denom) < 1e-6) return nullptr;

  const t = -eye[1] / denom;
  if (t < 0) return nullptr;

  const hit = add(eye, mul(dir, t));
  return { x: hit[0], z: hit[2] };
}


} // namespace lostjump

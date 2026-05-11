#ifndef PROJECTWORLDTOSCREEN_HPP
#define PROJECTWORLDTOSCREEN_HPP

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
auto projectWorldToScreen();

} // namespace lostjump

#endif // PROJECTWORLDTOSCREEN_HPP

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




  vec4.transformMat4(p, p, vp);

  
  if (p[3] <= 0.00001) return nullptr;

  const ndcX = p[0] / p[3];
  const ndcY = p[1] / p[3];
  const ndcZ = p[2] / p[3];

  
  if (ndcZ < -1 || ndcZ > 1) return nullptr;

  
  const sx = (ndcX * 0.5 + 0.5) * view.w;
  const sy = (-ndcY * 0.5 + 0.5) * view.h;

  return { x: sx, y: sy, z: ndcZ };
}


} // namespace lostjump

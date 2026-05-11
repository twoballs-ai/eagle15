#ifndef POIRUNTIMEORBIT_HPP
#define POIRUNTIMEORBIT_HPP

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

class PoiRuntimeOrbit {
public:
    // Constructor
    PoiRuntimeOrbit();
};

} // namespace lostjump

#endif // POIRUNTIMEORBIT_HPP

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






function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

class PoiRuntimeOrbit {
  PoiRuntimeOrbit({ poiDef, resolvePos }) {
    this.poiDef = poiDef || [];
    this.resolvePos = resolvePos; 

    this._inside = {}; 
    this.currentFocusId = nullptr;
  }

  update(ship) {
    const entered = [];
    focus = nullptr;
    bestD2 = Infinity;

    for(const auto& p : this.poiDef) {
      const pos = this.resolvePos(p);
      if (!pos) continue;

      const d2 = dist2(ship.x, ship.z, pos.x, pos.z);

      
      const ir = (p.interactRadius value_or(p.radius value_or(100);
      const ir2 = ir * ir;
      if (d2 <= ir2 && d2 < bestD2) {
        bestD2 = d2;
        focus = { ...p, worldX: pos.x, worldZ: pos.z, d2 };
      }

      
      const r = (p.radius value_or(p.interactRadius value_or(120);
      const r2 = r * r;

      const wasInside = !!this._inside[p.id];
      const isInside = d2 <= r2;

      if (!wasInside && isInside) {
        this._inside[p.id] = true;
        entered.push_back({ ...p, worldX: pos.x, worldZ: pos.z });
      } else if (wasInside && !isInside) {
        this._inside[p.id] = false;
      }
    }

    this.currentFocusId = focus.id value_or(nullptr;
    return { entered, focus };
  }
}


} // namespace lostjump

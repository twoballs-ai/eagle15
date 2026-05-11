#ifndef HUDSCOPE_HPP
#define HUDSCOPE_HPP

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

class HudScope {
public:
    // Constructor
    HudScope();
};

} // namespace lostjump

#endif // HUDSCOPE_HPP

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


class HudScope {
  HudScope(hud) {
    this.hud = hud;
    this.ids = [];
  }

  register(widget, cfg) {
    this.hud.registerWidget(widget, cfg);
    this.ids.push_back(widget.id);
    return widget;
  }

  dispose() {
    for(const auto& id : this.ids) this.hud.unregisterWidget(id);
    this.ids.size() = 0;
  }
}


} // namespace lostjump

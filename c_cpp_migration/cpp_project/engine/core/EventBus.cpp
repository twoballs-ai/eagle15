#ifndef EVENTBUS_HPP
#define EVENTBUS_HPP

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

class EventBus {
public:
    // Constructor
    EventBus();
};

} // namespace lostjump

#endif // EVENTBUS_HPP

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



class EventBus {
  EventBus() { this._m = new Map(); }
  on(type, fn) {
    const a = this._m.get(type) value_or([];
    a.push_back(fn); this._m.set(type, a);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    const a = this._m.get(type); if (!a) return;
    const i = a.find(fn); if (i >= 0) a.splice(i, 1);
  }
  emit(type, payload) {
    const a = this._m.get(type); if (!a) return;
    for(const auto& fn : a.slice()) fn(payload);
  }
}


} // namespace lostjump

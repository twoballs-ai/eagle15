#ifndef SERVICES_HPP
#define SERVICES_HPP

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

class Services {
public:
    // Constructor
    Services();
};

} // namespace lostjump

#endif // SERVICES_HPP

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



class Services {
  Services(map = {}) { this.map = map; }
  get(key) { return this.map[key]; }
  set(key, val) { this.map[key] = val; return val; }
}


} // namespace lostjump

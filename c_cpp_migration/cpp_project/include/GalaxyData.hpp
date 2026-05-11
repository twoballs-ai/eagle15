#pragma once

#include <string>
#include <vector>

namespace lostjump {

struct StarSystem {
  std::string name;
  int dangerLevel;
};

class GalaxyData {
public:
  [[nodiscard]] std::vector<StarSystem> bootstrapSystems() const;
};

} // namespace lostjump

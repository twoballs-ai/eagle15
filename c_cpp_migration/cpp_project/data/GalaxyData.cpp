#include "GalaxyData.hpp"

namespace lostjump {

std::vector<StarSystem> GalaxyData::bootstrapSystems() const {
  return {
      {"Sol", 1},
      {"Sirius Frontier", 3},
      {"Outer Dust", 5},
  };
}

} // namespace lostjump

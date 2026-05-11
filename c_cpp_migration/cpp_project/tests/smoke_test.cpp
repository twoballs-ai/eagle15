#include "GalaxyData.hpp"

int main() {
  const lostjump::GalaxyData data;
  const auto systems = data.bootstrapSystems();
  return systems.empty() ? 1 : 0;
}

#include "Hud.hpp"

namespace lostjump {

std::string Hud::renderStatus(int frame) const {
  return "HUD frame=" + std::to_string(frame);
}

} // namespace lostjump

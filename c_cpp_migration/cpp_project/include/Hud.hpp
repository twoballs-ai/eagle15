#pragma once

#include <string>

namespace lostjump {

class Hud {
public:
  [[nodiscard]] std::string renderStatus(int frame) const;
};

} // namespace lostjump

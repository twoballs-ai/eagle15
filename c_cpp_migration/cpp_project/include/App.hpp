#pragma once

#include <string>

namespace lostjump {

class Application {
public:
  void run();
  [[nodiscard]] std::string version() const;
};

} // namespace lostjump

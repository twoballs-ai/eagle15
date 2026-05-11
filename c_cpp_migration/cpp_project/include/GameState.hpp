#pragma once

namespace lostjump {

class GameState {
public:
  void tick();
  [[nodiscard]] int frame() const;

private:
  int frameCounter_ = 0;
};

} // namespace lostjump

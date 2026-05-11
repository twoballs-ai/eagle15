#include "GameState.hpp"

namespace lostjump {

void GameState::tick() { ++frameCounter_; }

int GameState::frame() const { return frameCounter_; }

} // namespace lostjump

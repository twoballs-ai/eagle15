#include "App.hpp"

#include "GalaxyData.hpp"
#include "GameState.hpp"
#include "Hud.hpp"
#include "StarSystemScene.hpp"

#include <iostream>

namespace lostjump {

void Application::run() {
  GalaxyData galaxy;
  GameState state;
  Hud hud;
  StarSystemScene scene;

  const auto systems = galaxy.bootstrapSystems();
  std::cout << "Scene: " << scene.name() << "\n";
  std::cout << "Systems loaded: " << systems.size() << "\n";

  for (int i = 0; i < 3; ++i) {
    state.tick();
    std::cout << hud.renderStatus(state.frame()) << "\n";
  }
}

std::string Application::version() const { return "0.1.0-cpp-bootstrap"; }

} // namespace lostjump

#include "App.hpp"

#include <iostream>

int main() {
  lostjump::Application app;
  std::cout << "LostJump C++ version: " << app.version() << "\n";
  app.run();
  return 0;
}

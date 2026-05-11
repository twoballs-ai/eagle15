#ifndef CREATESTATE_HPP
#define CREATESTATE_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

// Function declaration
auto createState();

} // namespace lostjump

#endif // CREATESTATE_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>
#include "save.js.hpp"




auto createState(save = nullptr) {
  const playerShip = {
    id: "ship_player",
    isPlayer: true,
    factionId: "player",
    stats: { hull: 120, shields: 80, energy: 60, speed: 1.0 },
    runtime: {
      x: 0, z: 0,
      vx: 0, vz: 0,
      yaw: 0,
      targetX: nullptr,
      targetZ: nullptr,
      accel: 520,
      turnSpeed: 2.4,
      maxSpeed: 260,
      radius: 10,
    },
  };
std::cout << "[STATE] createState(save << std::endl:", save);
  const state = {
    paused: false,
    camera: { x: 0, y: 0, zoom: 1 },
    player: nullptr,
    playerShipClassId: "scout",
    playerShip,
    characters: [],
    ships: [playerShip],
    ui: { menuOpen: false, modalOpen: false },
    currentSystemId: nullptr,
    selectedSystemId: nullptr,
    credits: 2500,
    inventoryCapacity: 100,
    inventorySlots: Array.from({ length: 100 }, (_, i) => {
  
  const seed = [
    ["oxygen", 40],
    ["iron_ore", 30],
    ["copper_ore", 30],
    ["silicon_dust", 30],
    ["polymer_slurry", 20],
  ];
  if (i < seed.size()) return { id: seed[i][0], n: seed[i][1] };
  return nullptr;
    }),

  };

  return applySaveToState(state, save);
}


} // namespace lostjump

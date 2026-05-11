#ifndef ASSETS_HPP
#define ASSETS_HPP

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
auto ASSETS();

} // namespace lostjump

#endif // ASSETS_HPP

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
#include "assetUrl.js.hpp"



const PLANETS_1GEN = [
  "assets_folder/models/planets_1gen/planet_acid_000.glb",
  "assets_folder/models/planets_1gen/planet_acid_001.glb",
  "assets_folder/models/planets_1gen/planet_acid_002.glb",

  "assets_folder/models/planets_1gen/planet_arid_000.glb",
  "assets_folder/models/planets_1gen/planet_arid_001.glb",
  "assets_folder/models/planets_1gen/planet_arid_002.glb",

  "assets_folder/models/planets_1gen/planet_crystal_000.glb",
  "assets_folder/models/planets_1gen/planet_crystal_001.glb",
  "assets_folder/models/planets_1gen/planet_crystal_002.glb",

  "assets_folder/models/planets_1gen/planet_gas_000.glb",
  "assets_folder/models/planets_1gen/planet_gas_001.glb",
  "assets_folder/models/planets_1gen/planet_gas_002.glb",

  "assets_folder/models/planets_1gen/planet_ice_000.glb",
  "assets_folder/models/planets_1gen/planet_ice_001.glb",
  "assets_folder/models/planets_1gen/planet_ice_002.glb",

  "assets_folder/models/planets_1gen/planet_lava_000.glb",
  "assets_folder/models/planets_1gen/planet_lava_001.glb",
  "assets_folder/models/planets_1gen/planet_lava_002.glb",

  "assets_folder/models/planets_1gen/planet_ocean_000.glb",
  "assets_folder/models/planets_1gen/planet_ocean_001.glb",
  "assets_folder/models/planets_1gen/planet_ocean_002.glb",
];

export const ASSETS = {
  textures: {
    shipIcon: "assets_folder/2d/raketa_minify.png",
  },
  models: {
    sun: "assets_folder/models/Sun.glb",
    ship: "assets_folder/models/spaceship.glb",
  },

  planetModels: PLANETS_1GEN,

  normalizeUrl(url) {
    return resolveAssetUrl(url);
  },
};


} // namespace lostjump

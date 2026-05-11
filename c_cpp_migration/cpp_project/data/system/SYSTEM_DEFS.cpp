#ifndef SYSTEM_DEFS_HPP
#define SYSTEM_DEFS_HPP

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
auto SYSTEM_DEFS();

} // namespace lostjump

#endif // SYSTEM_DEFS_HPP

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






export const SYSTEM_DEFS = {
  
  "sol": {
    seed: 101,
    planets: {
      fixed: [
        
        
        { id: "mercury", name: "Mercury", modelIndex: 0, size: 16, orbitRadius: 420 },
        { id: "venus",   name: "Venus",   modelIndex: 1, size: 22, orbitRadius: 620 },
        { id: "earth",   name: "Earth",   modelIndex: 2, size: 24, orbitRadius: 840 },
      ],
      randomCount: { min: 0, max: 2 },
    },
    tags: ["core", "starter"],
  },

  
  "argo-hub": {
    seed: 1101,
    planets: {
      fixed: [{ id: "argo-a", name: "Argo Prime", modelIndex: 3, size: 26 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "vela-hub": {
    seed: 1201,
    planets: {
      fixed: [{ id: "vela-a", name: "Vela I", modelIndex: 4, size: 22 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "orion-hub": {
    seed: 1301,
    planets: {
      fixed: [{ id: "orion-a", name: "Orion I", modelIndex: 5, size: 24 }],
      randomCount: { min: 2, max: 4 },
    },
    tags: ["hub"],
  },

  "lyra-hub": {
    seed: 1401,
    planets: {
      fixed: [{ id: "lyra-a", name: "Lyra I", modelIndex: 6, size: 23 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "draco-hub": {
    seed: 1501,
    planets: {
      fixed: [{ id: "draco-a", name: "Draco I", modelIndex: 7, size: 25 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "perseus-hub": {
    seed: 1601,
    planets: {
      fixed: [{ id: "perseus-a", name: "Perseus I", modelIndex: 8, size: 24 }],
      randomCount: { min: 1, max: 4 },
    },
    tags: ["hub"],
  },

  "hydra-hub": {
    seed: 1701,
    planets: {
      fixed: [{ id: "hydra-a", name: "Hydra I", modelIndex: 9, size: 23 }],
      randomCount: { min: 1, max: 4 },
    },
    tags: ["hub"],
  },

  "phoenix-hub": {
    seed: 1801,
    planets: {
      fixed: [{ id: "phoenix-a", name: "Phoenix I", modelIndex: 10, size: 26 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "aquila-hub": {
    seed: 1901,
    planets: {
      fixed: [{ id: "aquila-a", name: "Aquila I", modelIndex: 11, size: 24 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  "cygnus-hub": {
    seed: 2001,
    planets: {
      fixed: [{ id: "cygnus-a", name: "Cygnus I", modelIndex: 12, size: 25 }],
      randomCount: { min: 1, max: 3 },
    },
    tags: ["hub"],
  },

  
};


export function getSystemDef(systemId) {
  return SYSTEM_DEFS[std::to_string(systemId).toLowerCase()] value_or(nullptr;
}

} // namespace lostjump

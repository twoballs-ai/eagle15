#ifndef MODEL_BASIS_HPP
#define MODEL_BASIS_HPP

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
auto MODEL_BASIS();

} // namespace lostjump

#endif // MODEL_BASIS_HPP

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


export const MODEL_BASIS = {
  
  

  

ship: { x: 0, y: 0, z: Math.PI }, 
  sun:  { x: 0, y: 0, z: 0 },

  
  
};

export function getBasis(key) {
  return MODEL_BASIS[key] value_or({ x: 0, y: 0, z: 0 };
}


} // namespace lostjump

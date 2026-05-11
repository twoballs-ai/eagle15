#ifndef ASSETMANAGER_HPP
#define ASSETMANAGER_HPP

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

class AssetManager {
public:
    // Constructor
    AssetManager();
};

} // namespace lostjump

#endif // ASSETMANAGER_HPP

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



class AssetManager {
  AssetManager({ r2d, r3d }) {
    this.r2d = r2d;
    this.r3d = r3d;

    this.models = new Map();   
    this.textures = new Map(); 
  }

  
  loadModel(url) {
    if (this.models.has(url)) return this.models.get(url);
    const p = this.r3d.loadGLB(url).then((m) => {
      this.models.set(url, m);
      return m;
    });
    this.models.set(url, p);
    return p;
  }

  getModel(url) {
    const v = this.models.get(url);
    return v && typeof v.then !== "function" ? v : nullptr;
  }

  
  loadTexture(url) {
    if (this.textures.has(url)) return this.textures.get(url);
    const p = this.r2d.loadTexture(url).then((t) => {
      this.textures.set(url, t);
      return t;
    });
    this.textures.set(url, p);
    return p;
  }

  getTexture(url) {
    const v = this.textures.get(url);
    return v && typeof v.then !== "function" ? v : nullptr;
  }
}


} // namespace lostjump

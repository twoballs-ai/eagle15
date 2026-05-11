#ifndef STARSYSTEMSCENE_HPP
#define STARSYSTEMSCENE_HPP

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

class StarSystemScene : public Scene {
public:
    // Constructor
};

} // namespace lostjump

#endif // STARSYSTEMSCENE_HPP

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
#include "BootstrapSystem.js.hpp"
#include "CameraInputSystem.js.hpp"
#include "CollisionsSystem.js.hpp"
#include "CutsceneSystem.js.hpp"
#include "DebugOverlaySystem.js.hpp"
#include "EnemyAISystem.js.hpp"
#include "EnemyFireSystem.js.hpp"
#include "HudSystem.js.hpp"
#include "NpcInteractionSystem.js.hpp"
#include "PoiQuestSystem.js.hpp"
#include "ProjectilesSystem.js.hpp"
#include "RelationIconsSystem.js.hpp"
#include "RenderSystem.js.hpp"
#include "ShipControlSystem.js.hpp"
#include "TimeSystem.js.hpp"
#include "ctx.js.hpp"
#include "scene.js.hpp"


















class StarSystemScene : public Scene {
  StarSystemScene(services) {
    super(services);
    this.name = "Star System";
    this.ctx = createStarSystemCtx(services);
this.isGameplay = true;
    
    this.add(new TimeSystem(services, this.ctx));
    this.add(new BootstrapSystem(services, this.ctx));
this.add(new CutsceneSystem(services, this.ctx));
    this.add(new CameraInputSystem(services, this.ctx));
    this.add(new ShipControlSystem(services, this.ctx));
    this.add(new EnemyAISystem(services, this.ctx));
this.add(new NpcInteractionSystem(services, this.ctx));
    this.add(new EnemyFireSystem(services, this.ctx));
    this.add(new ProjectilesSystem(services, this.ctx));

    this.add(new CollisionsSystem(services, this.ctx));
    this.add(new PoiQuestSystem(services, this.ctx));

    this.add(new RenderSystem(services, this.ctx));
    
    
    this.add(new RelationIconsSystem(services, this.ctx));
        this.add(new HudSystem(services, this.ctx));

    this.add(new DebugOverlaySystem(services, this.ctx));

  }
}


} // namespace lostjump

#ifndef CREATESTARSYSTEMCTX_HPP
#define CREATESTARSYSTEMCTX_HPP

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
auto createStarSystemCtx();

} // namespace lostjump

#endif // CREATESTARSYSTEMCTX_HPP

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
#include "ActState.js.hpp"
#include "EnemyDialogWidget.js.hpp"
#include "QuestStateV2.js.hpp"
#include "StoryManager.js.hpp"
#include "colliders.js.hpp"
#include "cutsceneCaption.js.hpp"
#include "cutscenePlayer.js.hpp"
#include "enemyFire.js.hpp"
#include "engineFlame.js.hpp"
#include "index.js.hpp"
#include "letterboxOverlay.js.hpp"
#include "projectiles.js.hpp"
#include "relationIconsOverlay.js.hpp"
#include "weaponPresets.js.hpp"


















auto createStarSystemCtx(services) {
  const gl = services.get("gl");
  const canvas = services.get("canvas");

  const ctx = {
    
    services,

    
    systemId: nullptr,
    system: nullptr,
    time: 0,

    
    cam3d: {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 5000,
    },

    followCam: {
      distance: 340,
      height: 220,
      yawOffset: 0.0,
      pitch: -0.55,
      targetAhead: 40,
      targetLift: 0,
      smooth: 12.0,
      minHeight: 40,
      maxHeight: 900,
      minDistance: 120,
      maxDistance: 1200,
      minPitch: -1.35,
      maxPitch: -0.15,
    },

    boundsRadius: 1200,
    act: new ActState(),
    
    quest: new QuestStateV2(),   
    poiDef: nullptr,
    poi: nullptr,
    poiFocus: nullptr,
    poiHint: "",
    questLine: "",
    lastLog: "",
    spawnPoints: nullptr,

    
    flame: new EngineFlame(gl, { max: 2000 }),

    
    colliders: createColliderSystem({ cellSize: 140 }),
    projectiles: createProjectileSystem({
      bulletSpeed: 1100,
      bulletLife: 1.1,
      fireCooldown: 0.09,
      muzzleAhead: 16,
      damage: 14,
      hitRadius: 6,
      spread: 0.01,
    }),
    weapons: {
      available: WEAPON_PRESETS,
      currentIndex: 0,
    },
ui: {
  enemyDialog: new EnemyDialogWidget(),
},
    enemyFire: createEnemyFireModule({
      range: 520,
      fireRate: 1.2,
      damage: 18,
      fireArcCos: 0.25,
      jitter: 0.02,
    }),

    
    relIcons: new RelationIconsOverlay({ canvas }),

    
    systemPlaneY: -90,
    celestialTriggerMul: 1.6,
    celestialInteractMul: 1.0,

    
    inputLock: {
      camera: false,
      ship: false,
      interact: false,
      combat: false,
    },

    
    debug: {
      colliders: true,
      poiSampleLog: true,
      poiZones: true,
    },
  };

  
  const letterbox = new LetterboxOverlay({ parent: document.body });
  const caption = new CutsceneCaption({ parent: document.body });

  ctx.cutscene = new CutscenePlayer({
    onLock: () => {
      ctx.inputLock.camera = true;
      ctx.inputLock.ship = true;
      ctx.inputLock.interact = true;
      ctx.inputLock.combat = true;
    },
    onUnlock: () => {
      ctx.inputLock.camera = false;
      ctx.inputLock.ship = false;
      ctx.inputLock.interact = false;
      ctx.inputLock.combat = false;
    },
    onLetterbox: (v, h) => (v ? letterbox.show(h) : letterbox.hide()),
    onCaption: (v, text) => (v ? caption.show(text) : caption.hide()),
  });

  
  ctx.content = createContentRegistry();
ctx.story = new StoryManager({
  quest: ctx.quest,
  act: ctx.act,
  cutscenePlayer: ctx.cutscene,
  contentRegistry: ctx.content,
});

  
  ctx.resolvePoiPos(poi) {
    if (!poi) return nullptr;

    if (poi.kind === "static") return { x: poi.x value_or(0, z: poi.z value_or(0 };

    if (poi.kind === "planet") {
      const p = ctx.system.planets.find([](auto& item){ return (pp; }) => pp.id === poi.planetId);
      if (!p) return nullptr;
      const a = ctx.time * p.speed + p.phase;
      return { x: std::cos(a) * p.orbitRadius, z: std::sin(a) * p.orbitRadius };
    }

    return nullptr;
  };

  return ctx;
}


} // namespace lostjump

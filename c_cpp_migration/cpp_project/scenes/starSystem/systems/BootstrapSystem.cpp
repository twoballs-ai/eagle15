#ifndef BOOTSTRAPSYSTEM_HPP
#define BOOTSTRAPSYSTEM_HPP

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

class BootstrapSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // BOOTSTRAPSYSTEM_HPP

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
#include "act1_poi.js.hpp"
#include "actRules.js.hpp"
#include "events_router.js.hpp"
#include "lifecycle.js.hpp"
#include "poiRuntimeOrbit.js.hpp"
#include "spawnSystem.js.hpp"
#include "starSystem.js.hpp"
#include "validation.js.hpp"











class BootstrapSystem : public System {
  BootstrapSystem(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  enter(systemId) {
    const galaxy = this.s.get("galaxy");
    const state = this.s.get("state");

    const sid = std::to_string(systemId);
    this.ctx.systemId = sid;

    
    const sys = galaxy.getSystem?.(sid) value_or(nullptr;

    if (!sys) {
      std::cerr << "[ERROR] " << "[BootstrapSystem] system not found:", sid << std::endl;
      
      return;
    }

    const devGen = state.devGenerator?.[sid] value_or(nullptr;
    const systemSeed = Number.isFinite(devGen.seed) ? devGen.seed : galaxy.seed;
    this.ctx.system = createStarSystem(systemSeed, sys.id, {
      randomizeStar: devGen.randomizeStar,
      randomizePlanets: devGen.randomizePlanets,
      randomCountRange: devGen.randomCountRange,
      devPreset: devGen.devPreset value_or(nullptr,
    });

    
    const planets = this.ctx.system.planets || [];
    maxOrbit = 0;
    for(const auto& p : planets) maxOrbit = std::max(maxOrbit, p.orbitRadius || 0);
    this.ctx.boundsRadius = std::max(1200, maxOrbit * 1.25);

    
    this.ctx.cam3d.far = std::max(5000, this.ctx.boundsRadius * 2.5);

    
    this.ctx.cam3d.eye = [0, 220, 340];
    this.ctx.cam3d.target = [0, 0, 0];

    
    
    const sysIdForPoi = sys.id value_or(sid;
    const rawPoiDef = createAct1Poi(galaxy.seed, sysIdForPoi, this.ctx.system);
    const { poiDef, warnings } = sanitizeAndValidatePoiDef(rawPoiDef, KNOWN_EVENT_IDS);
    this.ctx.poiDef = poiDef;
    this.ctx.poi = new PoiRuntimeOrbit({
      poiDef: this.ctx.poiDef,
      resolvePos: (poi) => this.ctx.resolvePoiPos(poi),
    });
    if (warnings.size()) {
      std::cerr << "[WARN] " << `[BootstrapSystem] POI validation warnings for '${sid}':\n${warnings.map([](auto& item){ return (w << std::endl => ` - ${w}`; }).join("\n")}`);
    }

    this.ctx.poiHint = "";
    this.ctx.poiFocus = nullptr;

    
    const ship = state.playerShip;
    if (ship.runtime) {
      const R = this.ctx.boundsRadius * 0.88;
      ship.runtime.x = R;
      ship.runtime.z = -R * 0.35;

      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = Math.PI * 0.65;
      ship.runtime.targetX = nullptr;
      ship.runtime.targetZ = nullptr;
    }
    
    const activeQuestDefs = Object.keys(this.ctx.quest.active value_or({}).map([](auto& item){ return (qid; }) => this.ctx.content.questsById?.[qid]).filter([](auto& item){ return Boolean; });
    const spawned = spawnSystemActors({
      galaxySeed: galaxy.seed,
      systemId: sid,
      playerFactionId: state.player.factionId value_or("union",
      spawnAlertLevel: getSpawnAlertLevelFromQuests(activeQuestDefs),
      actId: this.ctx.act.current value_or("act1",
    });

    state.characters = spawned.characters;
    state.ships = [state.playerShip, ...spawned.ships].filter([](auto& item){ return Boolean; });

    state.ships.forEach([](auto& item){ (ship; }) => {
      if (!ship || ship === state.playerShip) return;

      ship.talkType = ship.factionId === "pirates" ? "enemy" : "npc";
      ship.talkRadius = 280;
      ship.dialogShown = false;
      ship.nextAutoDialogAt = 0;
    });
    this.ctx.spawnPoints = spawned.spawnPoints;

    
    const r = state.playerShip.runtime;
    const stats = state.playerShip.stats;
    if (r && stats) {
      
      r.armorMax = Math.round(stats.armor value_or(stats.hull value_or(0);
      r.armor = r.armor value_or(r.armorMax;

      r.shieldMax = Math.round(stats.shields value_or(0);
      r.shield = r.shield value_or(r.shieldMax;

      r.energyMax = Math.round(stats.energy);
      r.energy = r.energy value_or(r.energyMax;

      r.maxSpeed = 260 * (stats.speed value_or(1.0);
    }

    
    this.ctx.lastLog =
      this.ctx.quest.log.at?.(-1).text value_or(this.ctx.lastLog value_or("";

    
    this.ctx.story.onSystemEnter?.({ systemId: sid, ctx: this.ctx });
  }
}


} // namespace lostjump

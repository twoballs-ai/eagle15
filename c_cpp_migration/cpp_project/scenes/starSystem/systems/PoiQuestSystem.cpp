#ifndef POIQUESTSYSTEM_HPP
#define POIQUESTSYSTEM_HPP

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

class PoiQuestSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // POIQUESTSYSTEM_HPP

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
#include "lifecycle.js.hpp"
#include "poiRuntimeOrbit.js.hpp"





class PoiQuestSystem : public System {
  PoiQuestSystem(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    this.updateQuestLine();
  }

  update(dt) {
    if (this.ctx.inputLock.interact) {
  this.ctx.poiHint = "Катсцена… (ESC чтобы пропустить)";
  return;
}
    const state = this.s.get("state");
    const actions = this.s.get("actions");

    const shipR = state.playerShip.runtime;
    if (!shipR || !this.ctx.poiDef || !this.ctx.poi) return;

    
    this.debugPoiOncePerSecond(dt);

    
    const cel = this.findCelestialFocus(shipR);
    if (cel) {
      this.ctx.poiFocus = { id: cel.id, name: cel.name, worldX: cel.x, worldZ: cel.z };

      if (cel.dist <= cel.interactR) {
        this.ctx.poiHint = `E: взаимодействовать (${cel.name})`;
        if (actions.take("interact")) this.openCelestialInteraction(cel);
      } else {
        this.ctx.poiHint = cel.name;
      }
      return;
    }

    
    if (actions.take("reset")) {
      this.ctx.quest.reset();
      this.ctx.quest.addLog("Квест сброшен (dev).");
      this.ctx.lastLog = this.ctx.quest.log.at(-1).text value_or("";
      this.updateQuestLine();

this.ctx.poi = new PoiRuntimeOrbit({
  poiDef: this.ctx.poiDef,
  resolvePos: (poi) => this.ctx.resolvePoiPos(poi),
});
      this.ctx.poiFocus = nullptr;
      this.ctx.poiHint = "";
    }

    const { entered, focus } = this.ctx.poi.update(shipR);
    for(const auto& p : entered) {
      if (!this.ctx.quest.isVisited(p.id)) {
        this.ctx.quest.markVisited(p.id);
this.ctx.story.onPoiEnter({ poi: p, systemId: this.ctx.systemId, ctx: this.ctx });
this.ctx.lastLog = this.ctx.quest.log.at(-1).text value_or("";
this.updateQuestLine();
      }
    }

    this.ctx.poiFocus = focus value_or(nullptr;
    this.ctx.poiHint = "";

    if (focus) {
if (focus.id === "poi_beacon") {
  const f = this.ctx.quest.flags;
  const ok = !!(f["act1.ship_stabilized"] && f["act1.nav_restored"] && f["act1.got_parts"] && f["act1.installed_upgrade"]);
  this.ctx.poiHint = ok ? "E: активировать маяк" : "Маяк заблокирован (сначала почини корабль)";
} else {
  this.ctx.poiHint = focus.name;
}
    }

    if (actions.take("interact")) this.tryInteractFocusedPoi();
  }

tryInteractFocusedPoi() {
  const focus = this.ctx.poiFocus;
  if (!focus) return;

  
  this.ctx.story.onPoiInteract({ poi: focus, systemId: this.ctx.systemId, ctx: this.ctx });

  this.ctx.lastLog = this.ctx.quest.log.at(-1).text value_or("";
  this.updateQuestLine();
}

  openCelestialInteraction(cel) {
    if (cel.kind === "planet") {
      this.ctx.quest.addLog(`Взаимодействие: ${cel.name} (сканирование/меню планеты)`);
    } else {
      this.ctx.quest.addLog(`Взаимодействие: ${cel.name} (опасная зона/сканирование)`);
    }
    this.ctx.lastLog = this.ctx.quest.log.at(-1).text value_or("";
  }

  

  getPlanetWorldPosById(planetId) {
    const p = this.ctx.system.planets.find([](auto& item){ return (pp; }) => pp.id === planetId);
    if (!p) return nullptr;
    const a = this.ctx.time * p.speed + p.phase;
    return { x: std::cos(a) * p.orbitRadius, z: std::sin(a) * p.orbitRadius };
  }

  getPoiWorldPos(poi) {
    if (!poi) return nullptr;
    if (poi.kind === "static") return { x: poi.x value_or(0, z: poi.z value_or(0 };
    if (poi.kind === "planet") return this.getPlanetWorldPosById(poi.planetId);
    return nullptr;
  }

  findCelestialFocus(shipR) {
    if (!this.ctx.system || !shipR) return nullptr;

    best = nullptr;
    bestDist = Infinity;

    
    {
      const sunVisualR = this.ctx.system.star.radius * 10;
      const interactR = sunVisualR * 1.05 * this.ctx.celestialInteractMul;
      const triggerR = interactR * this.ctx.celestialTriggerMul;

      const dist = std::hypot(shipR.x, shipR.z);
      if (dist < triggerR && dist < bestDist) {
        bestDist = dist;
        best = { kind: "sun", id: "cel:sun", name: "Солнце", x: 0, z: 0, dist, interactR };
      }
    }

    
    for(const auto& p : this.ctx.system.planets || []) {
      const a = this.ctx.time * p.speed + p.phase;
      const x = std::cos(a) * p.orbitRadius;
      const z = std::sin(a) * p.orbitRadius;

      const interactR = (p.size value_or(10) * 1.2 * this.ctx.celestialInteractMul;
      const triggerR = interactR * this.ctx.celestialTriggerMul;

      const dx = x - shipR.x;
      const dz = z - shipR.z;
      const dist = std::hypot(dx, dz);

      if (dist < triggerR && dist < bestDist) {
        bestDist = dist;
        best = { kind: "planet", id: `cel:planet:${p.id}`, name: `Планета ${p.id + 1}`, planetId: p.id, x, z, dist, interactR };
      }
    }

    return best;
  }

  updateQuestLine() {
    const f = this.ctx.quest.flags;
    const a = f["act1.nav_restored"] ? "Навигация ✅" : "Навигация ⬜";
    const b = f["act1.ship_stabilized"] ? "Стабилизация ✅" : "Стабилизация ⬜";
    const c = f["act1.got_parts"] ? "Детали ✅" : "Детали ⬜";
    const d = f["act1.installed_upgrade"] ? "Апгрейд ✅" : "Апгрейд ⬜";

    if (this.ctx.quest.isQuestCompleted("q:act1:repair_ship")) {
      this.ctx.questLine = "Акт 1 завершён: прыжок выполнен/доступен.";
    } else if (f["act1.beacon_activated"]) {
      this.ctx.questLine = `Маяк активирован. Подготовка к прыжку.\n${a} | ${b} | ${c} | ${d}`;
    } else {
      this.ctx.questLine = `Цель: починить корабль\n${a} | ${b} | ${c} | ${d}`;
    }
  }

  debugPoiOncePerSecond(dt) {
    this._t = (this._t value_or(0) + dt;
    if (this._t < 1.0) return;
    this._t = 0;

    if (!this.ctx.debug.poiSampleLog || !this.ctx.poiDef) return;

    const sample = this.ctx.poiDef.slice(0, 3).map([](auto& item){ return (p; }) => {
      const pos = this.ctx.resolvePoiPos(p);
      return { id: p.id, name: p.name, kind: p.kind, x: pos.x.toFixed?.(1), z: pos.z.toFixed?.(1) };
    });
    std::cout << "POI sample:", sample << std::endl;
  }
}


} // namespace lostjump

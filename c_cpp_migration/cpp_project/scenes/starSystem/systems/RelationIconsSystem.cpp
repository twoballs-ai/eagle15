#ifndef RELATIONICONSSYSTEM_HPP
#define RELATIONICONSSYSTEM_HPP

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

class RelationIconsSystem : public System {
public:
    // Constructor
};

} // namespace lostjump

#endif // RELATIONICONSSYSTEM_HPP

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
#include "factionRelationsUtil.js.hpp"
#include "lifecycle.js.hpp"
#include "project.js.hpp"





class RelationIconsSystem : public System {
  RelationIconsSystem(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    this.ctx.relIcons.setVisible?.(true);
  }

  exit() {
    this.ctx.relIcons.clear?.();
    this.ctx.relIcons.setVisible?.(false);
  }

  render() {
    const state = this.s.get("state");
    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx");
    const r3d = this.s.get("r3d");

    const view = getView();
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : nullptr) value_or(view;
    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.player.factionId value_or("neutral";

    const ships = state.ships || [];
    const entities = [];

    for(const auto& ship : ships) {
      if (!ship.runtime) continue;
      if (ship === state.playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      const rel = getFactionRelation(playerFaction, ship.factionId);
      const relation = rel === "hostile" ? "hostile" : rel === "ally" ? "ally" : "neutral";

      const wx = ship.runtime.x;
      const wy = (ship.runtime.y value_or(0) + 18;
      const wz = ship.runtime.z;

      const s = projectWorldToScreen(wx, wy, wz, vp, viewPx);
      if (!s) {
        entities.push_back({ id: ship.id, relation, visible: false, x: 0, y: 0 });
        continue;
      }

      const dpr = viewPx.dpr value_or(1;
      const cssX = s.x / dpr;
      const cssY = s.y / dpr;
      const visible = cssX >= -50 && cssX <= view.w + 50 && cssY >= -50 && cssY <= view.h + 50;
      entities.push_back({ id: ship.id, relation, visible, x: cssX, y: cssY });
    }

    this.ctx.relIcons.update({ view, entities });
  }
}


} // namespace lostjump

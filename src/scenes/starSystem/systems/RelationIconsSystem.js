import { System } from "../../../engine/core/lifecycle.js";
import { projectWorldToScreen } from "../../../gameplay/math/project.js";
import { getFactionRelation } from "../../../data/faction/factionRelationsUtil.js";

export class RelationIconsSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  render() {
    const state = this.s.get("state");
    const getView = this.s.get("getView");
    const r3d = this.s.get("r3d");

    const view = getView();
    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.player?.factionId ?? "neutral";

    const ships = state.ships || [];
    const entities = [];

    for (const ship of ships) {
      if (!ship?.runtime) continue;
      if (ship === state.playerShip) continue;

      const rel = getFactionRelation(playerFaction, ship.factionId);
      const relation = rel === "hostile" ? "hostile" : rel === "ally" ? "ally" : "neutral";

      const wx = ship.runtime.x;
      const wy = 20;
      const wz = ship.runtime.z;

      const s = projectWorldToScreen(wx, wy, wz, vp, view);
      if (!s) {
        entities.push({ id: ship.id, relation, visible: false, x: 0, y: 0 });
        continue;
      }

      const visible = s.x >= -50 && s.x <= view.w + 50 && s.y >= -50 && s.y <= view.h + 50;
      entities.push({ id: ship.id, relation, visible, x: s.x, y: s.y });
    }

    this.ctx.relIcons.update({ view, entities });
  }
}

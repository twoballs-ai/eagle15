import { System } from "../../../engine/core/lifecycle.js";
import { projectWorldToScreen } from "../../../gameplay/math/project.js";
import { getFactionRelation } from "../../../data/faction/factionRelationsUtil.js";

export class RelationIconsSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  enter() {
    this.ctx.relIcons?.setVisible?.(true);
  }

  exit() {
    this.ctx.relIcons?.clear?.();
    this.ctx.relIcons?.setVisible?.(false);
  }

  render() {
    const state = this.s.get("state");
    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx");
    const r3d = this.s.get("r3d");

    const view = getView();
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : null) ?? view;
    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.player?.factionId ?? "neutral";

    const ships = state.ships || [];
    const entities = [];

    for (const ship of ships) {
      if (!ship?.runtime) continue;
      if (ship === state.playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;

      const rel = getFactionRelation(playerFaction, ship.factionId);
      const relation = rel === "hostile" ? "hostile" : rel === "ally" ? "ally" : "neutral";

      const wx = ship.runtime.x;
      const wy = (ship.runtime.y ?? 0) + 18;
      const wz = ship.runtime.z;

      const s = projectWorldToScreen(wx, wy, wz, vp, viewPx);
      if (!s) {
        entities.push({ id: ship.id, relation, visible: false, x: 0, y: 0 });
        continue;
      }

      const dpr = viewPx.dpr ?? 1;
      const cssX = s.x / dpr;
      const cssY = s.y / dpr;
      const visible = cssX >= -50 && cssX <= view.w + 50 && cssY >= -50 && cssY <= view.h + 50;
      entities.push({ id: ship.id, relation, visible, x: cssX, y: cssY });
    }

    this.ctx.relIcons.update({ view, entities });
  }
}

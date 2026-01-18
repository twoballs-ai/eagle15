import { System } from "../../../engine/core/lifecycle.js";
import { getBasis } from "../../../assets/modelBasis.js";
import { buildTracersXYZ } from "../../../gameplay/weapons/projectiles.js";
import { ASSETS } from "../../../assets/manifest.js"; // добавь

export class RenderSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  render() {
    const gl = this.s.get("gl");
    const r3d = this.s.get("r3d");
    const getView = this.s.get("getView");
    const state = this.s.get("state");

    const view = getView();

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const dpr = this.s.get("runtime")?.dpr ?? 1; // если есть
    const ship = state.playerShip?.runtime;
    const k = 0.002;
    const px = ship ? -ship.x * k : 0;
    const pz = ship ? -ship.z * k : 0;

    r3d.drawBackground(view, this.ctx.cam3d, dpr, px, pz);

    r3d.begin(view, this.ctx.cam3d);

    // projectiles tracers
    this.drawProjectiles3D(r3d);

    // system
    this.drawSystem3D(r3d);

    // ships
    this.drawPlayerShip3D(r3d);
    this.drawOtherShips3D(r3d);

    // flame
    this.ctx.flame.draw(r3d.getVP(), dpr);

    // enemy tracer lines
    const lines = this.ctx.enemyFire.getTracerLinesY(1.2);
    if (lines.length >= 6) r3d.drawLines(lines, [1.0, 0.35, 0.15, 0.9]);

    // debug
    // (коллайдеры рисуем отдельно, если хочешь — сделай DebugSystem.render)
  }

  drawProjectiles3D(r3d) {
    if (!this.ctx.projectiles) return;
    const pts = buildTracersXYZ(this.ctx.projectiles, 1.2, 0.03);
    if (pts.length < 6) return;
    r3d.drawLines(pts, [1.0, 0.35, 0.15, 0.95]);
  }

  drawPlayerShip3D(r3d) {
    const state = this.s.get("state");
    const assets = this.s.get("assets");

    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;
    const shipModel = assets?.models?.ship;
    if (!shipModel) return;

    const b = getBasis("ship");
    r3d.drawModel(shipModel, {
      position: [r.x, 0, r.z],
      scale: [1, 1, 1],
      rotationY: r.yaw,
      basisX: b.x, basisY: b.y, basisZ: b.z,
      rotationX: r.pitchV ?? 0,
      rotationZ: r.bank ?? 0,
    });
  }

  drawOtherShips3D(r3d) {
    const state = this.s.get("state");
    const assets = this.s.get("assets");

    const ships = state.ships || [];
    const shipModel = assets?.models?.ship;
    if (!shipModel) return;

    const b = getBasis("ship");

    for (const ship of ships) {
      if (ship === state.playerShip) continue;
      if (!ship?.runtime) continue;

      const r = ship.runtime;
      r3d.drawModel(shipModel, {
        position: [r.x, 0, r.z],
        scale: [1, 1, 1],
        rotationY: r.yaw,
        basisX: b.x, basisY: b.y, basisZ: b.z,
        ambient: 0.8,
        emissive: ship.isEnemy || ship.factionId === "pirates" ? 0.3 : 0.0,
      });
    }
  }

drawSystem3D(r3d, { scaleMul = 1.0 } = {}) {
  const assets = this.s.get("assets");
  if (!this.ctx.system) return;

  const U = ASSETS.normalizeUrl;

  const { star, planets } = this.ctx.system;

  const sunModel = assets.getModel(U(ASSETS.models.sun));
  const ySys = this.ctx.systemPlaneY ?? -160;

  if (sunModel) {
    const s = star.radius * 10 * scaleMul;
    r3d.drawModel(sunModel, {
      position: [0, ySys, 0],
      scale: [s, s, s],
      rotationY: this.ctx.time * 0.05,
      emissive: 2.5,
      ambient: 0.95,
    });
  }

  for (const p of planets) {
    r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25], ySys + 0.12);

    const a = this.ctx.time * p.speed + p.phase;
    const x = Math.cos(a) * p.orbitRadius;
    const z = Math.sin(a) * p.orbitRadius;

    // ✅ главное изменение
    const planetModel = assets.getModel(U(p.modelUrl));
    if (!planetModel) continue;

    const s = p.size * scaleMul;
    r3d.drawModel(planetModel, {
      position: [x, ySys, z],
      scale: [s, s, s],
      rotationY: this.ctx.time * 0.2,
      ambient: 0.85,
      emissive: 0.0,
    });
  }

  r3d.drawOrbit(this.ctx.boundsRadius, 260, [0.95, 0.25, 0.25, 0.45], ySys + 0.12);
}
}

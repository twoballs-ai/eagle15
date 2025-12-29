import { createStarSystem } from "../data/starSystem.js";

export class StarSystemScene {
  constructor(game) {
    this.game = game;
    this.name = "Star System";

    this.system = null;
    this.time = 0;

    // 3D камера (наклон + перспектива)
    this.cam3d = {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3, // 60°
      near: 0.1,
      far: 5000,
    };
  }

  enter(systemId) {
    const { galaxy } = this.game;
    const sys = galaxy.systems[systemId];

    this.system = createStarSystem(galaxy.seed, sys.id);
    this.time = 0;

    // можно подстроить камеру под размер системы (необязательно)
    // this.cam3d.eye = [0, 220, 340];
    // this.cam3d.target = [0, 0, 0];
  }

  update(dt) {
    this.time += dt;
  }

  render() {
    const { gl, r3d, getView } = this.game;
    const view = getView();

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    r3d.begin(view, this.cam3d);
    this.drawSystem3D(r3d);
  }

  drawSystem3D(r3d) {
    const { star, planets } = this.system;

    // Солнце — круглый диск (billboard)
    r3d.drawDisc(
      [0, 0, 0],
      star.radius,
      [star.color[0], star.color[1], star.color[2], 1.0],
      0.08
    );

    // Орбиты + планеты
    for (const p of planets) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25]);

      const a = this.time * p.speed + p.phase;
      const x = Math.cos(a) * p.orbitRadius;
      const z = Math.sin(a) * p.orbitRadius;

      r3d.drawDisc(
        [x, 0, z],
        p.size,
        [p.color[0], p.color[1], p.color[2], 1.0],
        0.10
      );
    }
  }
}

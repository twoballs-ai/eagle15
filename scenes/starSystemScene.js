import { createStarSystem } from "../data/starSystem.js";
import { stepShipMovement } from "../gameplay/shipMovement.js";
import { raycastToGround } from "../gameplay/cameraRay.js";
import { getShipControls, getAutopilotControls } from "../gameplay/shipController.js";
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

    // ограничение полёта внутри уровня
    this.boundsRadius = 1200;
  }

  enter(systemId) {
    const { galaxy } = this.game;
    const sys = galaxy.systems[systemId];

    this.system = createStarSystem(galaxy.seed, sys.id);
    this.time = 0;

    // камера
    this.cam3d.eye = [0, 220, 340];
    this.cam3d.target = [0, 0, 0];

    // ✅ сброс корабля при входе в систему
    const ship = this.game.state.playerShip;
    if (ship?.runtime) {
      ship.runtime.x = 0;
      ship.runtime.z = 0;
      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = 0;
    }
  }

  update(dt) {
    this.time += dt;
    this.updatePlayerShip(dt);
  }

   updatePlayerShip(dt) {
    const { input, state, getView } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;
    const view = getView();

    // ЛКМ ставит цель
    if (input.isMousePressed("left")) {
      const m = input.getMouse();
      const hit = raycastToGround(m.x, m.y, view.w, view.h, this.cam3d);
      if (hit) {
        r.targetX = hit.x;
        r.targetZ = hit.z;
      }
    }

    const manualControls = getShipControls(input);
    const autoControls = manualControls.manual ? null : getAutopilotControls(r);
    const controls = autoControls ?? manualControls;

    const { fx, fz } = stepShipMovement(r, controls, dt, { boundsRadius: this.boundsRadius });

    // камера
    this.cam3d.target[0] = r.x + fx * 40;
    this.cam3d.target[1] = 0;
    this.cam3d.target[2] = r.z + fz * 40;

    this.cam3d.eye[0] = r.x;
    this.cam3d.eye[1] = 220;
    this.cam3d.eye[2] = r.z + 340;
  }

  render() {
    const { gl, r3d, getView } = this.game;
    const view = getView();

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    r3d.begin(view, this.cam3d);
    this.drawSystem3D(r3d);
    this.drawPlayerShip3D(r3d);

  }

  drawPlayerShip3D(r3d) {
    const { input, state } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;

    r3d.drawDisc([r.x, 0, r.z], r.radius, [0.7, 0.9, 1.0, 1.0], 0.12);

    const nx = r.x + Math.cos(r.yaw) * (r.radius + 4);
    const nz = r.z + Math.sin(r.yaw) * (r.radius + 4);
    r3d.drawDisc([nx, 0, nz], 2.2, [1.0, 0.6, 0.2, 1.0], 0.12);

    const thrusting = input.isKeyDown("KeyW") || input.isKeyDown("ArrowUp");
    if (thrusting) {
      const bx = r.x - Math.cos(r.yaw) * (r.radius + 3);
      const bz = r.z - Math.sin(r.yaw) * (r.radius + 3);
      r3d.drawDisc([bx, 0, bz], 2.8, [0.2, 0.8, 1.0, 0.8], 0.12);
    }
        // маркер цели
    if (r.targetX != null && r.targetZ != null) {
      r3d.drawDisc([r.targetX, 0, r.targetZ], 5, [0.2, 1.0, 0.4, 0.7], 0.12);
    }
  }

drawSystem3D(r3d) {
  const { star, planets } = this.system;

  // ✅ Солнце: модель (sun.glb) если загружена, иначе fallback диск
  const sun = this.game.assets?.models?.sun;

  if (sun) {
    r3d.drawModel(sun, {
      position: [0, 0, 0],
      scale: [star.radius * 10, star.radius * 10, star.radius * 10],
      rotationY: this.time * 0.05,
    });
  }

  // 2. Орбиты планет
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

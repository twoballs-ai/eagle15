import { createStarSystem } from "../data/starSystem.js";
import { stepShipMovement } from "../gameplay/shipMovement.js";
import { raycastToGround } from "../gameplay/cameraRay.js";
import { getShipControls, getAutopilotControls } from "../gameplay/shipController.js";
import { EngineFlame } from "../engine/renderer/engineFlame.js";
export class StarSystemScene {
  constructor(game) {
    this.game = game;
    this.name = "Star System";
    this.flame = new EngineFlame(game.gl, { max: 2000 });
    this.system = null;
    this.time = 0;

    // main 3D camera
    this.cam3d = {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 5000, // базовое, переопределим в enter()
    };

    // базовое, переопределим в enter()
    this.boundsRadius = 1200;

    // minimap settings
    this.minimap = {
      sizeCSS: 200,
      padCSS: 12,
      height: 900, // высота камеры сверху
      radius: 1200, // можешь удалить позже, если не используешь
    };
  }

  enter(systemId) {
    const { galaxy } = this.game;
    const sys = galaxy.systems[systemId];

    this.system = createStarSystem(galaxy.seed, sys.id);
    this.time = 0;

    // ✅ boundsRadius по размеру системы
    const planets = this.system?.planets || [];
    let maxOrbit = 0;
    for (const p of planets) maxOrbit = Math.max(maxOrbit, p.orbitRadius || 0);

    // запас: 25% за последней планетой
    this.boundsRadius = Math.max(1200, maxOrbit * 1.25);

    // ✅ чтобы дальние объекты не резались камерой
    this.cam3d.far = Math.max(5000, this.boundsRadius * 2.5);

    // reset camera
    this.cam3d.eye = [0, 220, 340];
    this.cam3d.target = [0, 0, 0];

    // reset ship
    const ship = this.game.state.playerShip;
    if (ship?.runtime) {
      ship.runtime.x = 0;
      ship.runtime.z = 0;
      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = 0;
      ship.runtime.targetX = null;
      ship.runtime.targetZ = null;
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

    const { fx, fz } = stepShipMovement(r, controls, dt, {
      boundsRadius: this.boundsRadius,
    });
// --- Engine flame ---
const pos = [r.x, 0, r.z];

// forward dir из ship movement (у тебя уже есть!)
const dir = [fx, 0, fz];

// throttle 0..1 (берём из runtime если есть, иначе 1)
const throttle = Math.max(0, Math.min(1, r.throttleValue ?? 1.0));

this.flame.update(dt, pos, dir, throttle);
    // камера за кораблём
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

    // ---- MAIN PASS ----
    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const dpr = this.game.runtime?.dpr ?? 1;

const ship = this.game.state.playerShip?.runtime;
const k = 0.002; // сила параллакса (тюнится)
const px = ship ? -ship.x * k : 0;
const pz = ship ? -ship.z * k : 0;

r3d.drawBackground(view, this.cam3d, dpr, px, pz);

    r3d.begin(view, this.cam3d);
    this.drawSystem3D(r3d);
    this.drawPlayerShip3D(r3d);
    this.flame.draw(r3d.getVP(), dpr);
this.drawAutopilotDebug3D(r3d);
    // ---- MINIMAP PASS ----
    this.renderMinimap(r3d, gl, view);
  }

  renderMinimap(r3d, gl, view) {
    if (!this.system) return;

    const dpr = this.game.runtime?.dpr ?? 1;
    const size = Math.floor(this.minimap.sizeCSS * dpr);
    const pad = Math.floor(this.minimap.padCSS * dpr);

    const x = view.w - pad - size;
    const y = pad;

    r3d.beginViewportRect(view, x, y, size, size);

    gl.clearColor(0.01, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const ship = this.game.state.playerShip?.runtime;
    const cx = ship?.x ?? 0;
    const cz = ship?.z ?? 0;

    const miniCam = {
      eye: [cx, this.minimap.height, cz],
      target: [cx, 0, cz],
      up: [0, 0, -1],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 20000,
    };

    r3d.begin({ w: size, h: size }, miniCam);

    this.drawSystem3D(r3d);
    this.drawPlayerShip3D(r3d);
this.drawAutopilotDebug3D(r3d);
    r3d.endViewportRect();
  }

  drawPlayerShip3D(r3d) {
    const { state, assets } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;

    const shipModel = assets?.models?.ship;
    if (!shipModel) return;

    r3d.drawModel(shipModel, {
      position: [r.x, 0, r.z],
      scale: [1, 1, 1],
      rotationY: r.yaw,
      rotationX: -Math.PI / 2,
    });
  }

  drawSystem3D(r3d, { scaleMul = 1.0 } = {}) {
    if (!this.system) return;

    const { star, planets } = this.system;

    const sunModel = this.game.assets?.models?.sun;
    const planetPack = this.game.assets?.models?.planets;

    // ---- SUN ----
    if (sunModel) {
      const s = star.radius * 10 * scaleMul;
      r3d.drawModel(sunModel, {
        position: [0, 0, 0],
        scale: [s, s, s],
        rotationY: this.time * 0.05,
        emissive: 2.5,
        ambient: 0.95,
      });
    }

    for (const p of planets) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25]);

      const a = this.time * p.speed + p.phase;
      const x = Math.cos(a) * p.orbitRadius;
      const z = Math.sin(a) * p.orbitRadius;

      const model = planetPack?.[p.modelUrl];
      if (!model) continue;

      const s = p.size * scaleMul;

      r3d.drawModel(model, {
        position: [x, 0, z],
        scale: [s, s, s],
        rotationY: this.time * 0.2,
        ambient: 0.85,
        emissive: 0.0,
      });
    }

    // ✅ ВИЗУАЛЬНАЯ ГРАНИЦА ПОЛЁТА
    r3d.drawOrbit(this.boundsRadius, 260, [0.95, 0.25, 0.25, 0.45]);
  }
  drawAutopilotDebug3D(r3d) {
    const ship = this.game.state.playerShip;
    const r = ship?.runtime;
    if (!r) return;
    if (r.targetX == null || r.targetZ == null) return;

    const tx = r.targetX;
    const tz = r.targetZ;

    // --- 1) маркер цели ---
    r3d.drawCrossAt(tx, 0.65, tz, 12, [0.2, 0.9, 1.0, 1.0]);
    r3d.drawCircleAt(tx, 0.65, tz, 16, 48, [0.2, 0.9, 1.0, 0.45]);

    // --- 2) траектория: простой прогноз вперед ---
    // копия runtime чтобы не портить реальный
    const rr = {
      ...r,
      vx: r.vx || 0,
      vz: r.vz || 0,
      yaw: r.yaw || 0,
      throttleValue: r.throttleValue ?? 0,
      turnValue: r.turnValue ?? 0,
      // target оставляем
      targetX: tx,
      targetZ: tz,
    };

    const dt = 0.10;
    const steps = 48; // ~4.8 сек
    const pts = new Float32Array((steps + 1) * 3);

    let k = 0;
    pts[k++] = rr.x; pts[k++] = 0.55; pts[k++] = rr.z;

    for (let i = 0; i < steps; i++) {
      const c = getAutopilotControls(rr); // или getAutopilotControls(rr, apOpts) если добавишь opts
      if (!c) break;

      stepShipMovement(rr, c, dt, { boundsRadius: this.boundsRadius });

      pts[k++] = rr.x; pts[k++] = 0.55; pts[k++] = rr.z;

      if (rr.targetX == null) break;
    }

    // k = количество float’ов
    r3d.drawLineStrip(pts.subarray(0, k), [1.0, 1.0, 1.0, 0.35]);
  }
}

import { System } from "../../../engine/core/lifecycle.js";
import { stepShipMovement } from "../../../gameplay/shipMovement.js";
import { raycastToGround } from "../../../gameplay/cameraRay.js";
import { getShipControls, getAutopilotControls } from "../../../gameplay/shipController.js";
import { tryFire } from "../../../gameplay/weapons/projectiles.js";

export class ShipControlSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update(dt) {
    const input = this.s.get("input");
    const actions = this.s.get("actions");
    const state = this.s.get("state");

    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx"); // ✅ добавили

    const ship = state.playerShip;
    if (!this._dumped) {
      this._dumped = true;
      console.log("[ShipControlSystem] state keys:", Object.keys(state || {}));
      console.log("[ShipControlSystem] state:", state);
    }
    if (!ship?.runtime) return;

    const r = ship.runtime;

    // FIRE
    const wantFire = actions.down("fire");
    tryFire(this.ctx.projectiles, r, ship.id, dt, wantFire, {
      teamId: ship.factionId ?? "player",
    });

    if ((this._t = (this._t ?? 0) + dt) > 0.5) {
      this._t = 0;
      console.log(
        "ctrl dt", dt,
        "x", r?.x, "z", r?.z,
        "vx", r?.vx, "vz", r?.vz,
        "accel", r?.accel, "turnSpeed", r?.turnSpeed, "maxSpeed", r?.maxSpeed,
        "W", actions.down("moveForward"),
        "th", r?.throttleValue
      );
    }

    // ✅ set target on left click (FIX: px<->css mismatch)
    if (actions.pressed("clickPrimary")) {
      const m = input.getMouse(); // m.x/m.y в DEVICE PIXELS

      // w/h должны быть в тех же единицах что m.x/m.y => берём viewPx
      const viewPx = getViewPx ? getViewPx() : null;

      // fallback на случай если getViewPx нет (тогда конвертим вручную)
      let w = viewPx?.w;
      let h = viewPx?.h;

      if (w == null || h == null) {
        const view = getView ? getView() : { w: 0, h: 0, dpr: 1 };
        const dpr = view?.dpr ?? 1;
        w = Math.floor((view?.w ?? 0) * dpr);
        h = Math.floor((view?.h ?? 0) * dpr);
      }

      const hit = raycastToGround(m.x, m.y, w, h, this.ctx.cam3d);
      if (hit) {
        r.targetX = hit.x;
        r.targetZ = hit.z;
      }
    }

    // manual controls
    const manual = getShipControls(actions);

    if (manual.manual) {
      r.targetX = null;
      r.targetZ = null;
    }

    const auto = manual.manual ? null : getAutopilotControls(r);
    const controls = auto ?? manual;

    const { fx, fz } = stepShipMovement(r, controls, dt, {
      boundsRadius: this.ctx.boundsRadius,
    });

    // flame
    const pos = [r.x, 0, r.z];
    const dir = [fx, 0, fz];
    const throttle = Math.max(0, Math.min(1, r.throttleValue ?? 1.0));
    this.ctx.flame.update(dt, pos, dir, throttle);

    // camera follow update
    this.applyFollowCamera(dt, r);
  }

  applyFollowCamera(dt, r) {
    const cam = this.ctx.cam3d;
    const c = this.ctx.followCam;

    const ax = r.x;
    const az = r.z;

    const yaw = r.yaw + c.yawOffset;
    const fwdX = Math.sin(r.yaw);
    const fwdZ = -Math.cos(r.yaw);

    const tx = ax + fwdX * c.targetAhead;
    const ty = c.targetLift;
    const tz = az + fwdZ * c.targetAhead;

    const cosP = Math.cos(c.pitch);
    const sinP = Math.sin(c.pitch);

    const backX = Math.sin(yaw) * (c.distance * cosP);
    const backZ = -Math.cos(yaw) * (c.distance * cosP);

    const ex = tx - backX;
    const ez = tz - backZ;
    const ey = c.height + -sinP * c.distance;

    const k = 1 - Math.exp(-c.smooth * dt);

    cam.target[0] = lerp(cam.target[0], tx, k);
    cam.target[1] = lerp(cam.target[1], ty, k);
    cam.target[2] = lerp(cam.target[2], tz, k);

    cam.eye[0] = lerp(cam.eye[0], ex, k);
    cam.eye[1] = lerp(cam.eye[1], ey, k);
    cam.eye[2] = lerp(cam.eye[2], ez, k);

    stabilizeUp(cam);
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function stabilizeUp(cam) {
  const ex0 = cam.eye[0], ey0 = cam.eye[1], ez0 = cam.eye[2];
  const tx0 = cam.target[0], ty0 = cam.target[1], tz0 = cam.target[2];

  let fx0 = tx0 - ex0, fy0 = ty0 - ey0, fz0 = tz0 - ez0;
  const fl = Math.hypot(fx0, fy0, fz0) || 1;
  fx0 /= fl; fy0 /= fl; fz0 /= fl;

  const wux = 0, wuy = 1, wuz = 0;

  let rx0 = wuy * fz0 - wuz * fy0;
  let ry0 = wuz * fx0 - wux * fz0;
  let rz0 = wux * fy0 - wuy * fx0;
  let rl = Math.hypot(rx0, ry0, rz0);

  if (rl < 1e-6) {
    const awx = 0, awy = 0, awz = 1;
    rx0 = awy * fz0 - awz * fy0;
    ry0 = awz * fx0 - awx * fz0;
    rz0 = awx * fy0 - awy * fx0;
    rl = Math.hypot(rx0, ry0, rz0) || 1;
  }

  rx0 /= rl; ry0 /= rl; rz0 /= rl;

  const ux0 = fy0 * rz0 - fz0 * ry0;
  const uy0 = fz0 * rx0 - fx0 * rz0;
  const uz0 = fx0 * ry0 - fy0 * rx0;

  cam.up[0] = ux0; cam.up[1] = uy0; cam.up[2] = uz0;
}

import { System } from "../../../engine/core/lifecycle.js";

export class CameraInputSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

update(dt) {
  if (this.ctx.inputLock?.camera) return;
  const input = this.s.get("input");
  const actions = this.s.get("actions");
  const c = this.ctx.followCam;

  // wheel: у Input есть getWheelY(), getWheelDelta нет
  const wheel = input.getWheelY?.() ?? 0;
  if (wheel) {
    c.distance = clamp(
      c.distance * (1 + wheel * 0.0015),
      c.minDistance,
      c.maxDistance
    );
    input.consumeWheel?.();
  }

  // Камера: только yaw (Z и C)
  if (actions.down("camYawLeft")) c.yawOffset -= 1.6 * dt;
  if (actions.down("camYawRight")) c.yawOffset += 1.6 * dt;
}

}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
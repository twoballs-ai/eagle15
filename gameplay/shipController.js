
function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function getShipControls(input) {
  const forward = input.isKeyDown("KeyW") || input.isKeyDown("ArrowUp");
  const back = input.isKeyDown("KeyS") || input.isKeyDown("ArrowDown");

  const left = input.isKeyDown("KeyA") || input.isKeyDown("ArrowLeft");
  const right = input.isKeyDown("KeyD") || input.isKeyDown("ArrowRight");

  let throttle = 0;
  if (forward) throttle += 1;
  if (back) throttle -= 1;

  let turn = 0;
  if (right) turn += 1;
  if (left) turn -= 1;

  const boost = input.isKeyDown("ShiftLeft") || input.isKeyDown("ShiftRight");

  // если игрок жмёт WASD — это manual override
  const manual = forward || back || left || right;

  return { throttle, turn, boost, manual };
}

// Автопилот: превращает targetX/targetZ в throttle+turn
export function getAutopilotControls(runtime) {
  if (runtime.targetX == null || runtime.targetZ == null) return null;

  const dx = runtime.targetX - runtime.x;
  const dz = runtime.targetZ - runtime.z;

  const dist = Math.hypot(dx, dz);

  // arrived
  if (dist < 10) {
    runtime.targetX = null;
    runtime.targetZ = null;
    return { throttle: 0, turn: 0, boost: false, manual: false };
  }

  const desiredYaw = Math.atan2(dz, dx);
  const err = wrapPi(desiredYaw - runtime.yaw);

  // turn: -1..1
  const turn = Math.max(-1, Math.min(1, err / 0.9));

  // throttle зависит от того, насколько мы смотрим на цель
  const facing = Math.cos(err); // 1 when aligned
  const throttle = facing > 0 ? Math.min(1, dist / 220) * (0.2 + 0.8 * facing) : 0;

  return { throttle, turn, boost: false, manual: false };
}
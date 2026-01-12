// gameplay/shipMovement.js
// Физика движения корабля в плоскости XZ

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function stepShipMovement(runtime, controls, dt, opts = {}) {
  const {
    boundsRadius = 1200,
    // доп. параметры для тюнинга
    brakeFactor = 0.55,     // насколько слабее задний ход
    boostMul = 1.6,         // множитель ускорения/макс.скорости при boost
    throttleResponse = 8.0, // как быстро газ "набирается" (1/сек)
    yawResponse = 10.0,     // как быстро "стабилизируется" yaw input
    linearDrag = 1.2,       // 1/сек - базовое трение
    lateralDrag = 4.0,      // 1/сек - подавление бокового скольжения
  } = opts;

  // гарантируем наличие служебных полей
  if (runtime.throttleValue == null) runtime.throttleValue = 0;
  if (runtime.turnValue == null) runtime.turnValue = 0;

  // --- 1) сглаживаем управление ---
  const targetThrottle = controls.throttle >= 0
    ? controls.throttle
    : controls.throttle * brakeFactor;

  runtime.throttleValue += (targetThrottle - runtime.throttleValue) * (1 - Math.exp(-throttleResponse * dt));
  runtime.turnValue += (controls.turn - runtime.turnValue) * (1 - Math.exp(-yawResponse * dt));

  const boost = !!controls.boost;
  const accel = runtime.accel * (boost ? boostMul : 1);
  const maxSpeed = runtime.maxSpeed * (boost ? boostMul : 1);

  // --- 2) поворот ---
  // можно чуть уменьшать поворот на высокой скорости, но не сильно
  const speed = Math.hypot(runtime.vx, runtime.vz);
  const speed01 = maxSpeed > 0 ? clamp(speed / maxSpeed, 0, 1) : 0;
  const turnScale = 1.0 - speed01 * 0.35;

runtime.yaw += runtime.turnValue * runtime.turnSpeed * turnScale * dt;
runtime.yaw = wrapPi(runtime.yaw);
  // forward vector
const fx = Math.sin(runtime.yaw);
const fz = -Math.cos(runtime.yaw);


  // --- 3) тяга вперёд ---
  runtime.vx += fx * (runtime.throttleValue * accel) * dt;
  runtime.vz += fz * (runtime.throttleValue * accel) * dt;

  // --- 4) подавляем боковое скольжение (делает управление "собранным") ---
  // раскладываем скорость на forward и lateral
  const vF = runtime.vx * fx + runtime.vz * fz;        // проекция на forward
  const lx = -fz, lz = fx;                             // lateral basis
  const vL = runtime.vx * lx + runtime.vz * lz;        // боковая проекция

  // боковую скорость тушим быстрее
  const vL2 = vL * Math.exp(-lateralDrag * dt);
  // а вперёд — обычным линейным трением
  const vF2 = vF * Math.exp(-linearDrag * dt);

  // собираем обратно
  runtime.vx = fx * vF2 + lx * vL2;
  runtime.vz = fz * vF2 + lz * vL2;

  // --- 5) лимит скорости ---
  const sp2 = Math.hypot(runtime.vx, runtime.vz);
  if (sp2 > maxSpeed) {
    const k = maxSpeed / sp2;
    runtime.vx *= k;
    runtime.vz *= k;
  }

  // --- 6) интеграция ---
  runtime.x += runtime.vx * dt;
  runtime.z += runtime.vz * dt;

  // --- 7) граница ---
  const dist = Math.hypot(runtime.x, runtime.z);
  if (dist > boundsRadius) {
    const nx = runtime.x / dist;
    const nz = runtime.z / dist;

    runtime.x = nx * boundsRadius;
    runtime.z = nz * boundsRadius;

    // отражаем скорость чуть внутрь
    const dot = runtime.vx * nx + runtime.vz * nz;
    if (dot > 0) {
      runtime.vx -= nx * dot * 1.2;
      runtime.vz -= nz * dot * 1.2;
    }
  }

  // вернём удобные значения (можно использовать для камеры/эффектов)
  return { fx, fz, speed: Math.hypot(runtime.vx, runtime.vz) };
}
function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
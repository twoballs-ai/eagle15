// gameplay/shipMovement.js
// Физика движения корабля в плоскости XZ + визуальный крен/pitch (2.5D)

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
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

    // ✅ ВИЗУАЛ (не влияет на физику)
    bankMax = 0.65,         // макс. крен в рад (~37°)
    bankResponse = 10.0,    // как быстро крен догоняет цель (1/сек)

    pitchMax = 0.18,        // макс. pitch в рад (~10°)
    pitchResponse = 8.0,    // как быстро pitch догоняет цель (1/сек)
    pitchOnThrottle = -0.14,// pitch от газа (отриц = "нос вниз")
    pitchOnBrake = 0.10,    // pitch от тормоза (полож = "нос вверх")
  } = opts;

  // гарантируем наличие служебных полей
  if (runtime.throttleValue == null) runtime.throttleValue = 0;
  if (runtime.turnValue == null) runtime.turnValue = 0;

  // ✅ гарантируем наличие визуальных полей
  if (runtime.bank == null) runtime.bank = 0;
  if (runtime.pitchV == null) runtime.pitchV = 0;

  // --- 1) сглаживаем управление ---
  const targetThrottle =
    controls.throttle >= 0 ? controls.throttle : controls.throttle * brakeFactor;

  runtime.throttleValue += (targetThrottle - runtime.throttleValue) *
    (1 - Math.exp(-throttleResponse * dt));

  runtime.turnValue += (controls.turn - runtime.turnValue) *
    (1 - Math.exp(-yawResponse * dt));

  const boost = !!controls.boost;
  const accel = runtime.accel * (boost ? boostMul : 1);
  const maxSpeed = runtime.maxSpeed * (boost ? boostMul : 1);

  // --- 2) поворот (yaw) ---
  const speed = Math.hypot(runtime.vx, runtime.vz);
  const speed01 = maxSpeed > 0 ? clamp(speed / maxSpeed, 0, 1) : 0;
  const turnScale = 1.0 - speed01 * 0.35;

  runtime.yaw += runtime.turnValue * runtime.turnSpeed * turnScale * dt;
  runtime.yaw = wrapPi(runtime.yaw);

  // forward vector
  const fx = Math.sin(runtime.yaw);
  const fz = -Math.cos(runtime.yaw);

  // --- 2.5) ✅ ВИЗУАЛЬНЫЙ КРЕН И PITCH (НЕ ВЛИЯЕТ НА ФИЗИКУ) ---
  // крен: наклоняемся в сторону поворота, чуть усиливаем на скорости
  const bankTargetRaw = -runtime.turnValue * (0.45 + speed01 * 0.20);
  const bankTarget = clamp(bankTargetRaw, -bankMax, bankMax);
  runtime.bank += (bankTarget - runtime.bank) * (1 - Math.exp(-bankResponse * dt));

  // pitch: от газа/тормоза (чтобы ощущалось ускорение)
  // throttleValue уже сглажен. Берём отдельно газ и тормоз:
  const t = runtime.throttleValue;
  const pitchTargetRaw =
    (t >= 0 ? (t * pitchOnThrottle) : (-t * pitchOnBrake)); // тормоз => нос "вверх"
  const pitchTarget = clamp(pitchTargetRaw, -pitchMax, pitchMax);
  runtime.pitchV += (pitchTarget - runtime.pitchV) * (1 - Math.exp(-pitchResponse * dt));

  // --- 3) тяга вперёд ---
  runtime.vx += fx * (runtime.throttleValue * accel) * dt;
  runtime.vz += fz * (runtime.throttleValue * accel) * dt;

  // --- 4) подавляем боковое скольжение ---
  const vF = runtime.vx * fx + runtime.vz * fz; // forward
  const lx = -fz, lz = fx;                      // lateral basis
  const vL = runtime.vx * lx + runtime.vz * lz; // lateral

  const vL2 = vL * Math.exp(-lateralDrag * dt);
  const vF2 = vF * Math.exp(-linearDrag * dt);

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

    const dot = runtime.vx * nx + runtime.vz * nz;
    if (dot > 0) {
      runtime.vx -= nx * dot * 1.2;
      runtime.vz -= nz * dot * 1.2;
    }
  }

  return { fx, fz, speed: Math.hypot(runtime.vx, runtime.vz) };
}

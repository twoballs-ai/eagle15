function wrapPi(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Ручное управление кораблём.
 * ✅ WASD отключено: корабль управляется только автопилотом (клик по карте).
 * Функция сохранена для совместимости, но возвращает нулевое управление.
 * Если в будущем понадобится ручное управление (мышь, геймпад) — добавить сюда.
 */
export function getShipControls(actions) {
  // ✅ WASD больше не управляет кораблём.
  // Кнопки остаются в actions.js (могут использоваться для камеры/UI),
  // но на корабль не влияют.
  return { throttle: 0, turn: 0, boost: false, manual: false };
}


function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Автопилот: превращает targetX/targetZ в throttle+turn
export function getAutopilotControls(runtime, ap = {}) {
  if (runtime.targetX == null || runtime.targetZ == null) return null;

  const {
    arriveRadius = 10,      // когда считаем что "прилетели"
    slowRadius = 260,       // откуда начинаем сбрасывать скорость заранее
    turnGain = 1.2,         // чувствительность поворота
    turnMaxErr = 0.9,       // нормализация ошибки (рад)
    minFacing = 0.15,       // если смотрим сильно мимо, газ почти в ноль
    brakeFactor = 0.55,     // должно совпадать с stepShipMovement opts.brakeFactor
    linearDrag = 1.2,       // совпадать с stepShipMovement opts.linearDrag
  } = ap;

  const dx = runtime.targetX - runtime.x;
  const dz = runtime.targetZ - runtime.z;
  const dist = Math.hypot(dx, dz);

  // arrived
  if (dist < arriveRadius) {
    runtime.targetX = null;
    runtime.targetZ = null;
    // хотим реально остановиться
    return { throttle: -1, turn: 0, boost: false, manual: false };
  }

  // направление на цель
  const tx = dx / (dist || 1);
  const tz = dz / (dist || 1);

  // текущий forward по yaw
  const fx = Math.sin(runtime.yaw);
  const fz = -Math.cos(runtime.yaw);

  // желаемый yaw и ошибка
  const desiredYaw = Math.atan2(dx, -dz);
  const err = wrapPi(desiredYaw - runtime.yaw);

  // turn: -1..1 (чуть агрессивнее)
  let turn = clamp((err / turnMaxErr) * turnGain, -1, 1);

  // насколько мы "смотрим" на цель
  const facing = fx * tx + fz * tz; // [-1..1]

  // скорость и скорость "к цели"
  const speed = Math.hypot(runtime.vx || 0, runtime.vz || 0);
  const vToward = (runtime.vx || 0) * tx + (runtime.vz || 0) * tz; // >0 если летим к цели

  // оценка тормозного ускорения:
  // - активное торможение: accel * brakeFactor
  // - плюс "трение" (очень грубо как доп.ускорение ~ linearDrag * speed)
  const accel = Math.max(0.0001, runtime.accel || 0.0001);
  const aBrakeActive = accel * brakeFactor;
  const aDrag = (linearDrag || 0) * Math.max(0, speed);
  const aBrake = Math.max(0.0001, aBrakeActive + aDrag);

  // оценка тормозного пути по текущей скорости "к цели"
  const v = Math.max(0, vToward);
  const dStop = (v * v) / (2 * aBrake);

  // целевая "желательная" скорость: ближе к цели -> меньше
  // (линейная шкала внутри slowRadius)
  const desiredSpeed =
    dist >= slowRadius ? (runtime.maxSpeed || 0) : (runtime.maxSpeed || 0) * (dist / slowRadius);

  // если тормозной путь уже больше остатка — тормозим
  const shouldBrake = dStop > dist * 0.95;

  // throttle логика:
  // 1) если сильно не наведены — газ в ноль
  // 2) если пора тормозить — отрицательный газ
  // 3) иначе разгоняемся/держим скорость к desiredSpeed
  let throttle = 0;

  if (facing < minFacing) {
    throttle = 0; // сначала довернись
  } else if (shouldBrake) {
    // чем ближе и чем быстрее — тем сильнее тормоз
    throttle = -clamp(0.4 + (v / (runtime.maxSpeed || 1)) * 0.8, 0, 1);
  } else {
    // хотим vToward приблизить к desiredSpeed
    const errV = desiredSpeed - vToward;
    throttle = clamp(errV / ((runtime.maxSpeed || 1) * 0.6), 0, 1);

    // дополнительно уменьшаем газ при большом угле
    throttle *= clamp((facing - minFacing) / (1 - minFacing), 0, 1);
  }

  return { throttle, turn, boost: false, manual: false };
}
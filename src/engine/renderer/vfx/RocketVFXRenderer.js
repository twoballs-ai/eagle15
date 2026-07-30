// src/engine/renderer/vfx/RocketVFXRenderer.js
/**
 * Процедурный рендерер ракеты.
 * Тело ракеты (короткий яркий отрезок) + огненный шлейф (линии). Без кругов, только drawLineStrip.
 */
export function renderRocketVFX(r3d, gl, projectile, vfxConfig, time = 0) {
  const { x, z, vx, vz } = projectile;
  const y = 1.2; // Высота отрисовки (согласована с остальной сценой)

  const trailColor = vfxConfig.trailColor || [1.0, 0.4, 0.0];

  // Направление движения (нормализованное)
  const speed = Math.sqrt(vx * vx + vz * vz);
  if (speed === 0) return;
  const nx = vx / speed;
  const nz = vz / speed;

  // Сохраняем состояние WebGL
  const prevBlend = gl.getParameter(gl.BLEND);
  const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB);
  const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB);

  // Включаем аддитивное смешивание для свечения
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // === ТЕЛО РАКЕТЫ ===
  // Короткий яркий отрезок по направлению движения (имитация корпуса)
  const bodyLen = 5.0;
  const bodyTailX = x - nx * bodyLen;
  const bodyTailZ = z - nz * bodyLen;

  // Внешний контур тела
  r3d.drawLineStrip(
    new Float32Array([x, y, z, bodyTailX, y, bodyTailZ]),
    [0.8, 0.8, 0.8, 0.7]
  );
  // Яркое ядро тела
  r3d.drawLineStrip(
    new Float32Array([x, y, z, bodyTailX, y, bodyTailZ]),
    [1.0, 1.0, 1.0, 0.95]
  );

  // === ОГНЕННЫЙ ШЛЕЙФ ===
  // Длинный хвост позади ракеты
  const trailLen = 0.06;
  const trailX = x - vx * trailLen;
  const trailZ = z - vz * trailLen;

  // Слой 1: Широкое свечение шлейфа
  r3d.drawLineStrip(
    new Float32Array([bodyTailX, y, bodyTailZ, trailX, y, trailZ]),
    [trailColor[0], trailColor[1], trailColor[2], 0.3]
  );

  // Слой 2: Яркий огонь шлейфа с мерцанием
  const flicker = 0.5 + 0.5 * Math.sin(time * 40 + x * 0.5);
  r3d.drawLineStrip(
    new Float32Array([bodyTailX, y, bodyTailZ, trailX, y, trailZ]),
    [trailColor[0], trailColor[1], trailColor[2], flicker]
  );

  // Слой 3: Белое ядро огня у сопла
  const nozzleX = bodyTailX - nx * 2.0;
  const nozzleZ = bodyTailZ - nz * 2.0;
  r3d.drawLineStrip(
    new Float32Array([bodyTailX, y, bodyTailZ, nozzleX, y, nozzleZ]),
    [1.0, 0.9, 0.5, 0.9]
  );

  // Восстанавливаем состояние
  if (!prevBlend) gl.disable(gl.BLEND);
  else gl.blendFunc(prevBlendSrc, prevBlendDst);
}
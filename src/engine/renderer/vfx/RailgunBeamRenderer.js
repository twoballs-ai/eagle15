// src/engine/renderer/vfx/RailgunBeamRenderer.js
/**
 * Процедурный рендерер рельсотрона.
 * Длинный яркий луч с белым ядром и цветным ореолом. Без кругов, только drawLineStrip.
 */
export function renderRailgunBeam(r3d, gl, projectile, vfxConfig, time = 0) {
  const { x, z, vx, vz } = projectile;
  const y = 1.2; // Высота отрисовки (согласована с остальной сценой)

  const color = vfxConfig.color || [1.0, 0.2, 0.2];
  const trailLength = vfxConfig.trailLength || 0.2;

  // Длинный хвост (рельса — очень быстрая, длинный след)
  const tailX = x - vx * trailLength;
  const tailZ = z - vz * trailLength;

  // Сохраняем состояние WebGL
  const prevBlend = gl.getParameter(gl.BLEND);
  const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB);
  const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB);

  // Включаем аддитивное смешивание для свечения
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // Слой 1: Широкое внешнее свечение
  r3d.drawLineStrip(
    new Float32Array([x, y, z, tailX, y, tailZ]),
    [color[0], color[1], color[2], 0.25]
  );

  // Слой 2: Среднее свечение с мерцанием
  const flicker = 0.6 + 0.4 * Math.sin(time * 60 + x * 0.1);
  r3d.drawLineStrip(
    new Float32Array([x, y, z, tailX, y, tailZ]),
    [color[0], color[1], color[2], flicker]
  );

  // Слой 3: Белое ядро луча
  r3d.drawLineStrip(
    new Float32Array([x, y, z, tailX, y, tailZ]),
    [1.0, 1.0, 1.0, 0.95]
  );

  // Восстанавливаем состояние
  if (!prevBlend) gl.disable(gl.BLEND);
  else gl.blendFunc(prevBlendSrc, prevBlendDst);
}
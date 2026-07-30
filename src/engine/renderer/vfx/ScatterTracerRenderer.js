// src/engine/renderer/vfx/ScatterTracerRenderer.js
/**
 * Процедурный рендерер трассеров дробовика.
 * Короткие яркие линии с затуханием. Без кругов, только drawLineStrip.
 */
export function renderScatterTracer(r3d, gl, projectile, vfxConfig, time = 0) {
  const { x, z, vx, vz } = projectile;
  const y = 1.2; // Высота отрисовки (согласована с остальной сценой)

  const color = vfxConfig.color || [1.0, 0.8, 0.2];
  const alpha = vfxConfig.alpha || 0.9;

  // Короткий хвост (дробовик — быстрые, короткие трассеры)
  const tailScale = 0.02;
  const tailX = x - vx * tailScale;
  const tailZ = z - vz * tailScale;

  // Сохраняем состояние WebGL
  const prevBlend = gl.getParameter(gl.BLEND);
  const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB);
  const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB);

  // Включаем аддитивное смешивание для свечения
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // Слой 1: Внешнее свечение трассера
  r3d.drawLineStrip(
    new Float32Array([x, y, z, tailX, y, tailZ]),
    [color[0], color[1], color[2], alpha * 0.3]
  );

  // Слой 2: Яркое ядро трассера
  r3d.drawLineStrip(
    new Float32Array([x, y, z, tailX, y, tailZ]),
    [1.0, 1.0, 0.9, alpha]
  );

  // Восстанавливаем состояние
  if (!prevBlend) gl.disable(gl.BLEND);
  else gl.blendFunc(prevBlendSrc, prevBlendDst);
}
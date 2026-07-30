// src/engine/renderer/vfx/ImpulseLaserRenderer.js
/**
 * Процедурный рендерер импульсного лазера.
 * Создает эффект энергетического выстрела без PNG, используя наложение геометрических примитивов с аддитивным смешиванием.
 */
export function renderImpulseLaser(r3d, gl, projectile, vfxConfig, time = 0) {
  const { x, z, vx, vz } = projectile;
  const y = 1.2; // Высота отрисовки (согласована с остальной сценой)

  const trailLength = vfxConfig.beamLength || 0.12;
  const tailX = x - vx * trailLength;
  const tailZ = z - vz * trailLength;

  const color = vfxConfig.color || [0.2, 0.9, 1.0];
  const coreColor = vfxConfig.coreColor || [1.0, 1.0, 1.0];

  // Сохраняем состояние WebGL
  const prevBlend = gl.getParameter(gl.BLEND);
  const prevBlendSrc = gl.getParameter(gl.BLEND_SRC_RGB);
  const prevBlendDst = gl.getParameter(gl.BLEND_DST_RGB);

  // Включаем аддитивное смешивание для свечения
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // Слой 1: Внешнее широкое свечение луча
  r3d.drawLineStrip(new Float32Array([x, y, z, tailX, y, tailZ]), [color[0], color[1], color[2], 0.2]);
  // Слой 2: Среднее свечение луча
  r3d.drawLineStrip(new Float32Array([x, y, z, tailX, y, tailZ]), [color[0], color[1], color[2], 0.5]);
  // Слой 3: Яркое белое ядро луча
  r3d.drawLineStrip(new Float32Array([x, y, z, tailX, y, tailZ]), [coreColor[0], coreColor[1], coreColor[2], 0.95]);

  // ✅ Головка: короткий яркий отрезок на кончике (замена drawCircleAt)
  // Направление движения (нормализованное)
  const speed = Math.sqrt(vx * vx + vz * vz);
  if (speed > 0) {
    const nx = vx / speed;
    const nz = vz / speed;
    // Короткий отрезок вперёд от текущей позиции (яркая "голова" импульса)
    const headLen = 3.0; // длина головки в мировых единицах
    const headX = x + nx * headLen;
    const headZ = z + nz * headLen;
    // Белая вспышка на кончике
    r3d.drawLineStrip(new Float32Array([x, y, z, headX, y, headZ]), [1.0, 1.0, 1.0, 1.0]);
    // Цветной ореол вокруг головки (чуть длиннее)
    const glowX = x + nx * headLen * 1.8;
    const glowZ = z + nz * headLen * 1.8;
    r3d.drawLineStrip(new Float32Array([x, y, z, glowX, y, glowZ]), [color[0], color[1], color[2], 0.4]);
  }

  // Восстанавливаем состояние
  if (!prevBlend) gl.disable(gl.BLEND);
  else gl.blendFunc(prevBlendSrc, prevBlendDst);
}
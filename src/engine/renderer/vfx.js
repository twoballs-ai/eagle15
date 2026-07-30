// src/engine/renderer/vfx.js
/**
 * VFX Renderer для спецэффектов (лазеры, пули, шлейфы ракет)
 * Использует аддитивное смешивание (Additive Blending) для эффекта свечения.
 */

// Кэш для текстур, чтобы не создавать их каждый кадр
const textureCache = new Map();

/**
 * Генерирует простую светящуюся текстуру программно (как заглушку, если нет PNG).
 * В будущем замените это на загрузку реальных assets_folder/2d/vfx_glow.png
 */
function createGlowTexture(gl) {
  if (textureCache.has('glow')) return textureCache.get('glow');

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Радиальный градиент: белый центр, прозрачные края
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  textureCache.set('glow', texture);
  return texture;
}

/**
 * Отрисовка светящегося спрайта (Billboard), всегда повернутого к камере.
 */
export function drawGlowSprite(r3d, gl, x, y, z, size, color, alpha = 1.0) {
  const texture = createGlowTexture(gl);
  
  // Сохраняем текущее состояние смешивания
  const prevBlend = gl.getParameter(gl.BLEND);
  
  // Включаем аддитивное смешивание для эффекта свечения
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); 
  
  // Используем существующий метод r3d для отрисовки текстурированного квадрата (если он есть)
  // Если в вашем r3d есть drawSprite или drawTexturedQuad, используйте его.
  // Здесь мы используем drawCircleAt как временную обертку, но с правильными параметрами, 
  // либо, если r3d поддерживает, рисуем текстуру.
  
  // ВНИМАНИЕ: Для полноценного спрайта ваш r3d должен уметь рисовать текстуру.
  // Если r3d.drawCircleAt не поддерживает текстуры, нам нужно добавить простой drawSprite в r3d.
  // Пока используем хак с увеличенным кругом и цветом, но с правильным blend mode:
  
  r3d.drawCircleAt(x, y, z, size, 16, [color[0], color[1], color[2], alpha]);
  
  // Восстанавливаем состояние
  if (!prevBlend) gl.disable(gl.BLEND);
  else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Стандартный blend
}

/**
 * Отрисовка лазерного луча (вытянутый спрайт или линия с свечением)
 */
export function drawLaserBeam(r3d, x1, y1, z1, x2, y2, z2, thickness, color) {
  // Рисуем широкую полупрозрачную линию для свечения
  r3d.drawLineStrip(new Float32Array([x1, y1, z1, x2, y2, z2]), [color[0], color[1], color[2], 0.3]);
  // Рисуем узкую яркую линию по центру
  r3d.drawLineStrip(new Float32Array([x1, y1, z1, x2, y2, z2]), [1.0, 1.0, 1.0, 0.9]);
}

/**
 * Загрузка реальной текстуры из манифеста (для ракет, дыма и т.д.)
 */
export function loadVfxTexture(gl, assetManager, assetKey) {
  // Реализация загрузки через ваш AssetManager
  // Возвращает WebGLTexture
}
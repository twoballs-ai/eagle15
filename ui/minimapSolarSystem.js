// ui/minimapSolarSystem.js
export class MinimapSolarSystem {
  constructor({
    size = 200,      // CSS px
    padding = 12,    // CSS px
    height = 900,    // высота камеры сверху (world units)
    clearColor = [0.01, 0.02, 0.04, 1.0],
    margin = 1.15,   // ✅ запас, чтобы система не упиралась в края
    minOrthoSize = 300, // ✅ минимум масштаба (на случай очень маленьких систем)
  } = {}) {
    this.size = size;
    this.padding = padding;
    this.height = height;
    this.clearColor = clearColor;
    this.margin = margin;
    this.minOrthoSize = minOrthoSize;
  }

  draw(game, scene) {
    const { gl, r3d, getView } = game;
    if (!gl || !r3d || !scene?.system) return;

    const view = getView();
    const dpr = game.runtime?.dpr ?? 1;

    const sizePx = Math.floor(this.size * dpr);
    const padPx = Math.floor(this.padding * dpr);

    const x = view.w - padPx - sizePx; // top-right
    const y = padPx;

    // Рисуем в отдельный viewport + scissor
    r3d.beginViewportRect(view, x, y, sizePx, sizePx);

    // Чистим только миниокно
    gl.clearColor(...this.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ✅ вычисляем максимальную орбиту, чтобы влезла вся система
const planets = scene.system?.planets || [];
let maxOrbit = 0;
for (const p of planets) maxOrbit = Math.max(maxOrbit, p.orbitRadius || 0);

const orthoSize = Math.max(this.minOrthoSize, maxOrbit * this.margin);

const cx = 0;
const cz = 0;

const miniCam = {
  eye: [cx, this.height, cz],
  target: [cx, 0, cz],
  up: [0, 0, -1],
  ortho: true,
  orthoSize,   // ✅ НЕ *2
  near: 0.1,
  far: 20000,
};

    // Квадратный view для корректного aspect
    r3d.begin({ w: sizePx, h: sizePx }, miniCam);

    // Рисуем то же самое, что в мире: модели + орбиты
    if (scene.drawSystem3D) scene.drawSystem3D(r3d, { scaleMul: 2.2 });;
    // if (scene.drawPlayerShip3D) scene.drawPlayerShip3D(r3d);
// --- 2D overlay: ship icon (PNG) ---
const ship = game.state.playerShip?.runtime;
const tex = game.assets?.textures?.shipIcon;

if (ship && tex) {
  // world(x,z) -> minimap pixels inside sizePx x sizePx
const half = orthoSize; // 🔥 ТОТ ЖЕ САМЫЙ half, что и у камеры



let nx = (ship.x - cx) / (2 * half) + 0.5;
let ny = (-(ship.z - cz)) / (2 * half) + 0.5;

const px = (nx - 0.5) * sizePx;
const py = (ny - 0.5) * sizePx;
// ✅ 2D поверх 3D миникарты
gl.disable(gl.DEPTH_TEST);
gl.depthMask(false);
gl.disable(gl.CULL_FACE);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // рисуем в "пиксельных world coords": cam=(0,0), zoom=1
  game.r2d.begin(sizePx, sizePx, 0, 0, 1);

  // Важно: держим одну текстуру
  game.r2d.useTexture(tex);

  const iconSize = 26 * dpr;      // ✅ тюнится
  const rot = -ship.yaw;          // если “не туда”, добавим ±Math.PI/2

  game.r2d.quadRot(px, py, iconSize, iconSize, rot, 1, 1, 1, 1);
  game.r2d.end();
  gl.depthMask(true);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
}
    r3d.endViewportRect();
  }
}

// ui/minimapSolarSystem.js
export class MinimapSolarSystem {
  constructor({
    size = 200,      // CSS px
    padding = 12,    // CSS px
    height = 900,    // высота камеры сверху (world units)
    radius = 1200,   // сколько мира показывать (world units)
    clearColor = [0.01, 0.02, 0.04, 1.0],
  } = {}) {
    this.size = size;
    this.padding = padding;
    this.height = height;
    this.radius = radius;
    this.clearColor = clearColor;
  }

  draw(game, scene) {
    const { gl, r3d, getView, state } = game;
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

    const ship = state.playerShip?.runtime;
    const cx = ship?.x ?? 0;
    const cz = ship?.z ?? 0;

    // Камера строго сверху, смотрит вниз.
    // up=[0,0,-1] чтобы "вверх" миникарты соответствовал -Z
    const miniCam = {
      eye: [cx, this.height, cz],
      target: [cx, 0, cz],
      up: [0, 0, -1],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 10000,
    };

    // Квадратный view для корректного aspect
    r3d.begin({ w: sizePx, h: sizePx }, miniCam);

    // Рисуем то же самое, что в мире: модели + орбиты
    // (никаких дисков/2D)
    if (scene.drawSystem3D) scene.drawSystem3D(r3d);
    if (scene.drawPlayerShip3D) scene.drawPlayerShip3D(r3d);

    r3d.endViewportRect();
  }
}

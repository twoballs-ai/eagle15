// ui/minimapSolarSystem.js
export class MinimapSolarSystem {
  constructor({
    size = 200,
    padding = 12,
    height = 900,
    clearColor = [0.01, 0.02, 0.04, 1.0],
    margin = 1.15,
    minOrthoSize = 300,
    debug = true,          // ✅ флаг отладки
    debugHold = false,     // ✅ если true — оставляем только фиолетовый+крест
  } = {}) {
    this.size = size;
    this.padding = padding;
    this.height = height;
    this.clearColor = clearColor;
    this.margin = margin;
    this.minOrthoSize = minOrthoSize;

    this.debug = debug;
    this.debugHold = debugHold;
  }

  // Рисуем миникарту ВНУТРИ rect HUD (rect в CSS coords, origin top-left)
  drawIntoRect(game, scene, rectCss) {
    const { gl, r3d } = game;

    const system = scene?.system ?? scene?.ctx?.system;
    if (!gl || !r3d || !system) return;

    const viewPx =
      game.getViewPx?.() ??
      (() => {
        const v = game.getView?.() ?? { w: 1, h: 1, dpr: 1 };
        const dpr = v.dpr ?? 1;
        return { w: Math.floor(v.w * dpr), h: Math.floor(v.h * dpr), dpr };
      })();

    const dpr = viewPx.dpr ?? 1;

    const xPx = Math.floor(rectCss.x * dpr);
    const yPx = Math.floor(rectCss.y * dpr);
    const wPx = Math.floor(rectCss.w * dpr);
    const hPx = Math.floor(rectCss.h * dpr);

    if (wPx < 2 || hPx < 2) return;

    // ✅ rect
    r3d.beginViewportRect(viewPx, xPx, yPx, wPx, hPx);

    // ---------------- DEBUG PASS (фиолетовый + гарант гео) ----------------
    if (this.debug) {
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);

      // фиолетовый фон
      gl.clearColor(1.0, 0.0, 0.8, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // простая ортокамера
      r3d.begin(
        { w: wPx, h: hPx, dpr },
        {
          eye: [0, 900, 0],
          target: [0, 0, 0],
          up: [0, 0, -1],
          ortho: true,
          orthoSize: 300,
          near: 0.1,
          far: 5000,
        }
      );

      // гарант линии
      r3d.drawCircleAt(0, 0.0, 0, 120, 64, [0, 1, 1, 1]);
      r3d.drawCrossAt(0, 0.0, 0, 40, [1, 1, 1, 1]);

      // ✅ если хотим "заморозить" и проверить кто затирает — выходим тут
      if (this.debugHold) {
        r3d.endViewportRect();
        return;
      }
    }

    // ---------------- REAL MINIMAP PASS ----------------
    gl.clearColor(...this.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const planets = system.planets || [];
    let maxOrbit = 0;
    for (const p of planets) maxOrbit = Math.max(maxOrbit, p.orbitRadius || 0);

    const orthoSize = Math.max(this.minOrthoSize, maxOrbit * this.margin);

    const cx = 0, cz = 0;
    const miniCam = {
      eye: [cx, this.height, cz],
      target: [cx, 0, cz],
      up: [0, 0, -1],
      ortho: true,
      orthoSize,
      near: 0.1,
      far: 20000,
    };

    r3d.begin({ w: wPx, h: hPx, dpr }, miniCam);

    // ✅ ВАЖНО: drawSystem3D у тебя в RenderSystem, а не в scene.
    // Поэтому чаще всего тут НИЧЕГО не рисуется => чёрный.
    // Для проверки — нарисуем хоть орбиту:
    r3d.drawOrbit(200, 96, [1, 1, 1, 0.6], 0.12);

    // если ты добавишь методы на scene — заработает:
    if (scene.drawSystem3D) scene.drawSystem3D(r3d, { scaleMul: 2.2 });
    if (scene.drawPoiDebug3D) scene.drawPoiDebug3D(r3d);

    r3d.endViewportRect();
  }
}

import { createGL } from "./engine/gl.js";
import { Renderer2D } from "./engine/renderer2d.js";
import { Renderer3D } from "./engine/renderer3d.js";
import { Game } from "./game.js";

const canvas = document.getElementById("game");
const statsEl = document.getElementById("stats");

const runtime = {
  dpr: 1,
  cssW: 0,
  cssH: 0,
  pxW: 0,
  pxH: 0,
  time: { last: 0, dt: 0, t: 0, fps: 0, fpsAcc: 0, fpsCount: 0 },
};

const gl = createGL(canvas);
const r2d = new Renderer2D(gl);
const r3d = new Renderer3D(gl);

function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  runtime.dpr = dpr;

  runtime.cssW = window.innerWidth;
  runtime.cssH = window.innerHeight;

  runtime.pxW = Math.floor(runtime.cssW * dpr);
  runtime.pxH = Math.floor(runtime.cssH * dpr);

  canvas.width = runtime.pxW;
  canvas.height = runtime.pxH;

  gl.viewport(0, 0, runtime.pxW, runtime.pxH);
}

window.addEventListener("resize", resize);
resize();

const game = new Game({
  canvas,
  gl,
  r2d,
  r3d,
  statsEl,
  getView: () => ({ w: runtime.cssW, h: runtime.cssH, dpr: runtime.dpr }),
  getViewPx: () => ({ w: runtime.pxW, h: runtime.pxH, dpr: runtime.dpr }),
});

function tick(ts) {
  const time = runtime.time;
  if (!time.last) time.last = ts;

  time.dt = Math.min(0.033, (ts - time.last) / 1000);
  time.last = ts;
  time.t += time.dt;

  time.fpsAcc += time.dt;
  time.fpsCount++;
  if (time.fpsAcc >= 0.35) {
    time.fps = Math.round(time.fpsCount / time.fpsAcc);
    time.fpsAcc = 0;
    time.fpsCount = 0;
  }

  game.input.beginFrame();       // ✅ в начале кадра
  game.update(time.dt, time);
  game.render(time);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

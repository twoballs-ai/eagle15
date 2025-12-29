import { createGL } from "./engine/gl.js";
import { Renderer2D } from "./engine/renderer2d.js";
import { Renderer3D } from "./engine/renderer3d.js";
import { Game } from "./game.js";

const canvas = document.getElementById("game");
const statsEl = document.getElementById("stats");

const runtime = {
  dpr: 1,
  viewW: 0,
  viewH: 0,
  time: { last: 0, dt: 0, t: 0, fps: 0, fpsAcc: 0, fpsCount: 0 },
};

let gl = null; // <-- важно

function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  runtime.dpr = dpr;
  runtime.viewW = Math.floor(window.innerWidth * dpr);
  runtime.viewH = Math.floor(window.innerHeight * dpr);
  canvas.width = runtime.viewW;
  canvas.height = runtime.viewH;

  if (gl) {
    gl.viewport(0, 0, runtime.viewW, runtime.viewH);
  }
}

window.addEventListener("resize", resize);
resize();

gl = createGL(canvas);
const r2d = new Renderer2D(gl);
const r3d = new Renderer3D(gl);
// после создания gl полезно один раз выставить viewport
gl.viewport(0, 0, runtime.viewW, runtime.viewH);

const game = new Game({
  canvas,
  gl,
  r2d,
  r3d,
  statsEl,
  getView: () => ({ w: runtime.viewW, h: runtime.viewH, dpr: runtime.dpr }),
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

  game.update(time.dt, time);
  game.render(time);

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

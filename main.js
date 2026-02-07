import { createGL } from "./engine/gl.js";
import { Renderer2D } from "./engine/renderer2d.js";
import { Renderer3D } from "./engine/renderer3d.js";
import { Game } from "./game.js";
import { installGLTraceFile } from "./engine/debug/glTrace.js";

const canvas = document.getElementById("game");
const statsEl = document.getElementById("stats");

const gl = createGL(canvas);

installGLTraceFile(gl, { logEvery: 1, name: "minimap-trace" });
window.dumpTrace = () => gl.__trace?.download({ format: "text" });

const r2d = new Renderer2D(gl);
const r3d = new Renderer3D(gl);

// ✅ runtime теперь хранит только time/fps (не размеры!)
const runtime = {
  time: { last: 0, dt: 0, t: 0, fps: 0, fpsAcc: 0, fpsCount: 0 },
};

const game = await Game.create({
  canvas,
  gl,
  r2d,
  r3d,
  statsEl,
});

// ✅ resize больше не выставляет viewport и не держит pxW/pxH как истину
function onResize() {
  // попросим surface пересчитать drawing buffer
  game.surface?.applyCanvasSize?.();
  // метрики обновятся в Game.render() в том же кадре
}

window.addEventListener("resize", onResize);
onResize();

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

  gl.__trace?.nextFrame();
  game.input.endFrame();

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

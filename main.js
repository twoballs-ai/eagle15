import { createGL } from "./src/engine/gl.js";
import { Renderer2D } from "./src/engine/renderer2d.js";
import { Renderer3D } from "./src/engine/renderer3d.js";
import { Game } from "./src/game.js";
import { installGLTraceFile } from "./src/engine/debug/glTrace.js";

const canvas = document.getElementById("game");
const statsEl = document.getElementById("stats");

const gl = createGL(canvas);
installGLTraceFile(gl, { logEvery: 1, name: "minimap-trace" });
window.dumpTrace = () => gl.__trace?.download({ format: "text" });

const r2d = new Renderer2D(gl);
const r3d = new Renderer3D(gl);

const runtime = {
  time: { last: 0, dt: 0, t: 0, fps: 0, fpsAcc: 0, fpsCount: 0 },
};

let game; // ❗ вынесли глобально

function onResize() {
  game?.surface?.applyCanvasSize?.();
}

window.addEventListener("resize", onResize);

function tick(ts) {
  if (!game) return; // пока не создан, ждём

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

(async () => {
  game = await Game.create({
    canvas,
    gl,
    r2d,
    r3d,
    statsEl,
  });

  onResize();
  requestAnimationFrame(tick); // ❗ стартуем цикл после инициализации
})();

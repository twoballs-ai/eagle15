// ui/widgets/MinimapWidget.js
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

function apply(el, styles) { Object.assign(el.style, styles); }

export class MinimapWidget {
  constructor({ id = "minimap", ctx } = {}) {
    this.id = id;
    this.ctx = ctx;          // StarSystemScene.ctx
    this.el = null;

    // локальная камера миникарты (top-down)
    this._cam = {
      ortho: true,
      orthoSize: 700,
      eye: [0, 1200, 0],
      target: [0, 0, 0],
      up: [0, 0, -1],        // чтобы “вверх экрана” был -Z
      near: 0.1,
      far: 5000,
      fovRad: Math.PI / 3,
    };

    this.props = {};
  }

  mount(parent, props = {}) {
    this.el = document.createElement("div");
    parent.appendChild(this.el);

    const size = props.size ?? 180;

    apply(this.el, {
      width: size + "px",
      height: size + "px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.15)",
      pointerEvents: "none",
      overflow: "hidden",
    });

    this.props = { ...props };
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }

  render(game, scene, rectCss) {
    if (!rectCss || rectCss.w <= 2 || rectCss.h <= 2) return;

    const gl = game.gl;
    const r3d = game.r3d;
    const surface = game.surface;

    // rectCss (CSS px) -> buffer rect (для gl.viewport/scissor)
    const bufferRect = surface.canvasCssRectToBufferRect(rectCss);
    if (!bufferRect || bufferRect.w <= 2 || bufferRect.h <= 2) return;

    // подстраиваем миникамеру под систему
    this._syncCameraToWorld();

    // ✅ СОХРАНЯЕМ текущие состояния (чтобы потом восстановить 100%)
    const prevViewport = gl.getParameter(gl.VIEWPORT); // Int32Array(4)
    const prevScissorEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const prevScissorBox = gl.getParameter(gl.SCISSOR_BOX); // Int32Array(4)

    // view для beginViewportRect — это buffer размер всего canvas
    const fullView = {
      w: surface.value.buffer.w,
      h: surface.value.buffer.h,
      dpr: surface.value.dpr ?? 1,
    };

    // ✅ ВАЖНО: miniView должен быть размером МИНИКАРТЫ
    const miniView = { w: bufferRect.w, h: bufferRect.h, dpr: 1 };

    // ⬇️ Второй проход рендера в прямоугольник
    r3d.beginViewportRect(fullView, bufferRect.x, bufferRect.y, bufferRect.w, bufferRect.h);

    // чистим ТОЛЬКО мини-прямоугольник
    gl.disable(gl.BLEND);
    gl.clearColor(0.0, 0.0, 0.0, 0.35);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // рисуем “копию мира”
    this._drawMinimapWorld(game, scene, miniView);

    r3d.endViewportRect();

    // ✅ ЖЁСТКО восстанавливаем состояния (на случай, если endViewportRect не всё вернул)
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);

    if (prevScissorEnabled) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(prevScissorBox[0], prevScissorBox[1], prevScissorBox[2], prevScissorBox[3]);
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }
  }

  _syncCameraToWorld() {
    const ctx = this.ctx;
    if (!ctx) return;

    const R = Math.max(300, (ctx.boundsRadius ?? 1200) * 1.05);

    this._cam.orthoSize = R;
    this._cam.eye[0] = 0;
    this._cam.eye[1] = Math.max(600, R * 1.2);
    this._cam.eye[2] = 0;

    this._cam.target[0] = 0;
    this._cam.target[1] = 0;
    this._cam.target[2] = 0;

    this._cam.far = Math.max(5000, R * 5);
  }

  _drawMinimapWorld(game, scene, miniView) {
    const ctx = this.ctx;
    if (!ctx?.system) return;

    const r3d = game.r3d;
    const state = game.state ?? game.services?.get?.("state");

    // ✅ ВАЖНО: begin() считает VP матрицу под miniView
    r3d.begin(miniView, this._cam);

    const y = (ctx.systemPlaneY ?? -90) + 0.12;

    // граница
    r3d.drawOrbit(ctx.boundsRadius ?? 1200, 220, [0.95, 0.25, 0.25, 0.45], y);

    // орбиты планет
    for (const p of ctx.system.planets || []) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25], y);
    }

    // планеты как точки
    for (const p of ctx.system.planets || []) {
      const a = ctx.time * p.speed + p.phase;
      const x = Math.cos(a) * p.orbitRadius;
      const z = Math.sin(a) * p.orbitRadius;
      r3d.drawCircleAt(
        x, y + 0.2, z,
        Math.max(8, (p.size ?? 10) * 0.35),
        24,
        [0.6, 0.8, 1.0, 0.7]
      );
    }

    // корабли как точки
    const ships = state?.ships || [];
    for (const ship of ships) {
      const r = ship?.runtime;
      if (!r) continue;

      const isPlayer = ship === state.playerShip;
      const col = isPlayer ? [0.2, 0.9, 1.0, 1.0] : [1.0, 1.0, 1.0, 0.85];
      r3d.drawCrossAt(r.x, y + 0.3, r.z, isPlayer ? 18 : 10, col);
    }
  }
}

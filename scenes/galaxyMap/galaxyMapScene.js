// scenes/galaxyMapScene.js
import { Scene } from "../../engine/core/scene.js";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class GalaxyMapScene extends Scene {
  constructor(services) {
    super(services);
    this.name = "Galaxy Map";

    this._tmpCam = {
      // ortho top-down
      ortho: true,
      orthoSize: 900,
      eye: [0, 1600, 0],
      target: [0, 0, 0],
      // чтобы “север” был вверх экрана
      up: [0, 0, -1],
      near: 0.1,
      far: 8000,

      // неважно для ortho, но пусть будет
      fovRad: Math.PI / 3,
    };

    this._bgCam = {
      eye: [0, 0, 0],
      target: [0, 0, -1],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 1,
      far: 24000,
    };
  }

  enter() {
    const game = this.s.get("game");
    const state = this.s.get("state");
    state.ui.menuOpen = false;
    state.selectedSystemId = null;
    game?.menu?.close?.();
  }

  update(dt) {
    const game = this.s.get("game");
    const state = this.s.get("state");
    const input = this.s.get("input");
    const galaxy = this.s.get("galaxy");

    const view = this.s.get("getView")?.();
    const viewPx = this.s.get("getViewPx")?.() ?? { w: view?.w ?? 1, h: view?.h ?? 1, dpr: view?.dpr ?? 1 };

    const menu = game?.menu;

    const cam = state.galaxyCam;

    // ===== wheel zoom (orthoSize) =====
    const wheel = input.getWheelY?.() ?? input.wheelY ?? 0;
    if (wheel && !menu?.isOpen) {
      const k = wheel < 0 ? 0.88 : 1.12;
      cam.orthoSize = clamp(cam.orthoSize * k, 260, 2400);
      input.consumeWheel?.();
    }

    // ===== WASD pan =====
    if (!menu?.isOpen) {
      const speed = 920 * (cam.orthoSize / 900); // масштабируем скорость от масштаба карты
      let mx = 0, mz = 0;

      if (input.isKeyDown("KeyA")) mx -= 1;
      if (input.isKeyDown("KeyD")) mx += 1;
      if (input.isKeyDown("KeyW")) mz -= 1;
      if (input.isKeyDown("KeyS")) mz += 1;

      if (mx || mz) {
        const l = Math.hypot(mx, mz) || 1;
        mx /= l; mz /= l;
        cam.x += mx * speed * dt;
        cam.z += mz * speed * dt;
      }
    }

    // ===== mouse → world pos on galaxy plane =====
    const m = input.getMouse?.() ?? { x: 0, y: 0 }; // device px
    const wpos = screenToGalaxyWorld({
      sx: m.x,
      sy: m.y,
      viewW: viewPx.w,
      viewH: viewPx.h,
      camX: cam.x,
      camZ: cam.z,
      orthoSize: cam.orthoSize,
    });

    // ===== RMB context menu =====
    if (input.isMousePressed?.("right")) {
      const sys = galaxy.pickSystem(wpos.x, wpos.z, 28);
      if (sys) {
        state.selectedSystemId = sys.id;
        state.ui.menuOpen = true;

        const cssX = m.x / (viewPx.dpr ?? 1);
        const cssY = m.y / (viewPx.dpr ?? 1);

        menu?.open?.({
          x: cssX,
          y: cssY,
          title: `${sys.name}${sys.kind === "relay" ? " (Relay)" : ""}`,
          items: [
            {
              label: "Перейти в систему",
              onClick: () => game.openStarSystem(sys.id),
            },
            { label: "Отмена", onClick: () => {} },
          ],
        });
      } else {
        menu?.close?.();
      }
    }

    // LMB close menu
    if (input.isMousePressed?.("left")) {
      menu?.close?.();
    }

    // (опционально) hover highlight можно добавить позже
  }

  render(time) {
    const gl = this.s.get("gl");
    const r3d = this.s.get("r3d");
    const state = this.s.get("state");
    const galaxy = this.s.get("galaxy");
    const view = this.s.get("getViewPx")?.() ?? this.s.get("getView")?.();

    // clear
    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // ===== background =====
    const dpr = view.dpr ?? 1;
    const cam = state.galaxyCam;
    const px = -cam.x * 0.0015;
    const pz = -cam.z * 0.0015;
    r3d.drawBackground(view, this._bgCam, dpr, px, pz);

    // ===== map camera =====
    const aspect = view.w / view.h;
    const topCam = this._tmpCam;

    topCam.ortho = true;
    topCam.orthoSize = cam.orthoSize;
    topCam.eye[0] = cam.x;
    topCam.eye[1] = 1600;
    topCam.eye[2] = cam.z;

    topCam.target[0] = cam.x;
    topCam.target[1] = 0;
    topCam.target[2] = cam.z;

    topCam.near = 0.1;
    topCam.far = 8000;

    r3d.begin(view, topCam);

    // ===== draw lanes =====
    for (const l of galaxy.links) {
      const a = galaxy.systems[l.a];
      const b = galaxy.systems[l.b];
      if (!a || !b) continue;

      const y = 0.0;
      const pts = new Float32Array([
        a.x, y, a.z,
        b.x, y, b.z,
      ]);
const dpr = view.dpr ?? 1;

// рисуем “настоящую” галактику точками
r3d.drawGalaxySpiral(view, topCam, dpr);
      // relay links brighter
      const col = (l.kind === "relay")
        ? [0.25, 0.95, 1.0, 0.55]
        : [0.30, 0.45, 0.70, 0.28];

      r3d.drawLines(pts, col);
    }

    // ===== draw systems =====
    const selectedId = state.selectedSystemId;
    const currentId = state.currentSystemId;

    // выделим “доступные” соседние от current (ME-логика)
    const reachable = new Set();
    if (typeof currentId === "number") {
      for (const n of galaxy.getNeighbors(currentId)) reachable.add(n);
      reachable.add(currentId);
    }

    for (const s of galaxy.systems) {
      const isSelected = s.id === selectedId;
      const isCurrent = s.id === currentId;
      const isReachable = reachable.size ? reachable.has(s.id) : true;

      const baseR = (s.size ?? 12) * 2.2;
      const y = 0.0;

      // base ring
      const colBase = isReachable
        ? [0.85, 0.90, 1.0, 0.40]
        : [0.45, 0.50, 0.60, 0.22];

      r3d.drawCircleAt(s.x, y, s.z, baseR, 64, colBase);

      // relay = дополнительный “ореол”
      if (s.kind === "relay") {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 1.65, 72, [0.25, 0.95, 1.0, 0.35]);
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.55, [0.25, 0.95, 1.0, 0.85]);
      } else {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.40, [1.0, 1.0, 1.0, 0.65]);
      }

      // current system marker
      if (isCurrent) {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 2.1, 84, [0.25, 1.0, 0.35, 0.55]);
      }

      // selected highlight
      if (isSelected) {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 2.6, 96, [1.0, 0.80, 0.25, 0.65]);
      }
    }
  }
}

// screen (device px) -> galaxy world (x,z) for ortho camera
function screenToGalaxyWorld({ sx, sy, viewW, viewH, camX, camZ, orthoSize }) {
  const aspect = viewW / viewH;

  const halfH = orthoSize;
  const halfW = orthoSize * aspect;

  // NDC
  const nx = (sx / viewW) * 2 - 1;
  const ny = 1 - (sy / viewH) * 2;

  const x = camX + nx * halfW;
  const z = camZ + ny * halfH;

  return { x, z };
}

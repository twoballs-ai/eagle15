// scenes/galaxyMapScene.js
import { Scene } from "../../engine/core/scene.js";

export class GalaxyMapScene extends Scene {
  constructor(services) {
    super(services);
    this.name = "Galaxy Map";

    // Камера карты (3D, но вид сверху; ортографическая проекция)
    this._mapCam = {
      ortho: true,
      orthoSize: 900, // будет вычисляться из state.camera.zoom

      eye: [0, 1600, 0],
      target: [0, 0, 0],

      // “север вверх экрана” (top-down)
      up: [0, 0, -1],

      near: 0.1,
      far: 8000,

      fovRad: Math.PI / 3, // не используется в ortho, но оставим
    };
this._t = 0;
    // Камера фона (звёздное поле)
    this._bgCam = {
      eye: [0, 0, 0],
      target: [0, 0, -1],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 1,
      far: 24000,
    };

    // Базовый “масштаб” карты (как твой прежний orthoSize=900)
    this._baseOrthoSize = 900;
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
    const menu = game?.menu;

    const view = this.s.get("getView")?.();
    const viewPx =
      this.s.get("getViewPx")?.() ?? {
        w: Math.floor((view?.w ?? 1) * (view?.dpr ?? 1)),
        h: Math.floor((view?.h ?? 1) * (view?.dpr ?? 1)),
        dpr: view?.dpr ?? 1,
      };

    // ✅ СТАТИЧНО: отключаем wheel и wasd (как у тебя было)
    input.consumeWheel?.();

    // ✅ НЕ МЕНЯЕМ state.camera СТРУКТУРУ:
    // camera.x -> центр по X
    // camera.y -> центр по Z (в этой сцене y используется как второй параметр панорамы карты)
    // camera.zoom -> масштаб карты
    const cam2d = state.camera;
this._t += dt;
    // мышь -> world XZ (в плоскости карты) для ORTHO камеры
    const m = input.getMouse?.() ?? { x: 0, y: 0 }; // device px
    const wpos = screenToGalaxyWorldOrtho({
      sx: m.x,
      sy: m.y,
      viewW: viewPx.w,
      viewH: viewPx.h,
      camX: cam2d.x ?? 0,
      camZ: cam2d.y ?? 0,
      zoom: cam2d.zoom ?? 1,
      baseOrthoSize: this._baseOrthoSize,
    });

    // RMB context menu
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
            { label: "Перейти в систему", onClick: () => game.openStarSystem(sys.id) },
            { label: "Отмена", onClick: () => {} },
          ],
        });
      } else {
        menu?.close?.();
      }
    }

    if (input.isMousePressed?.("left")) menu?.close?.();
  }

  render() {
    const gl = this.s.get("gl");
    const r3d = this.s.get("r3d");
    const state = this.s.get("state");
    const galaxy = this.s.get("galaxy");

    const view = this.s.get("getViewPx")?.() ?? this.s.get("getView")?.();
    const dpr = view.dpr ?? 1;

    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // state.camera не трогаем; просто трактуем:
    // x -> X, y -> Z, zoom -> scale
    const cam2d = state.camera;

    // фон (параллакс от камеры карты — слабый)
    const px = -(cam2d.x ?? 0) * 0.0015;
    const pz = -(cam2d.y ?? 0) * 0.0015;
    r3d.drawBackground(view, this._bgCam, dpr, px, pz);

    // top-down ORTHO cam
    const topCam = this._mapCam;
    topCam.ortho = true;

    // ✅ zoom влияет на orthoSize:
    // zoom больше => “приблизили” => orthoSize меньше
    topCam.orthoSize = this._baseOrthoSize / Math.max(0.15, cam2d.zoom ?? 1);

    topCam.eye[0] = cam2d.x ?? 0;
    topCam.eye[1] = 1600;
    topCam.eye[2] = cam2d.y ?? 0;

    topCam.target[0] = cam2d.x ?? 0;
    topCam.target[1] = 0;
    topCam.target[2] = cam2d.y ?? 0;

    r3d.begin(view, topCam);

    // ✅ “настоящая” спиральная галактика: 4 рукава, пятна, блюр-точки
    r3d.drawGalaxySpiral(view, topCam, dpr, this._t);

    // линии гиперпространства (если нужны)
    for (const l of galaxy.links) {
      const a = galaxy.systems[l.a];
      const b = galaxy.systems[l.b];
      if (!a || !b) continue;

      const y = 0.0;
      const pts = new Float32Array([a.x, y, a.z, b.x, y, b.z]);

      const col =
        l.kind === "relay"
          ? [0.25, 0.95, 1.0, 0.55]
          : [0.30, 0.45, 0.70, 0.22];

      r3d.drawLines(pts, col);
    }

    // системы
    const selectedId = state.selectedSystemId;
    const currentId = state.currentSystemId;

    for (const s of galaxy.systems) {
      const isSelected = s.id === selectedId;
      const isCurrent = s.id === currentId;

      const baseR = (s.size ?? 12) * 2.2;
      const y = 0.0;

      // база
      r3d.drawCircleAt(s.x, y, s.z, baseR, 64, [0.85, 0.90, 1.0, 0.25]);

      if (s.kind === "relay") {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 1.65, 72, [0.25, 0.95, 1.0, 0.35]);
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.55, [0.25, 0.95, 1.0, 0.85]);
      } else {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.40, [1.0, 1.0, 1.0, 0.65]);
      }

      if (isCurrent) {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 2.1, 84, [0.25, 1.0, 0.35, 0.55]);
      }

      if (isSelected) {
        r3d.drawCircleAt(s.x, y, s.z, baseR * 2.6, 96, [1.0, 0.80, 0.25, 0.65]);
      }
    }
  }
}

// device px -> world XZ for ORTHO camera using state.camera{x,y,zoom}
// camX = camera.x, camZ = camera.y, zoom = camera.zoom
function screenToGalaxyWorldOrtho({
  sx,
  sy,
  viewW,
  viewH,
  camX,
  camZ,
  zoom,
  baseOrthoSize = 900,
}) {
  const aspect = viewW / viewH;

  // orthoSize = половина высоты видимой области в world units
  const orthoSize = baseOrthoSize / Math.max(0.15, zoom);

  const halfH = orthoSize;
  const halfW = orthoSize * aspect;

  const nx = (sx / viewW) * 2 - 1;
  const ny = 1 - (sy / viewH) * 2;

  const x = camX + nx * halfW;
  const z = camZ + ny * halfH;

  return { x, z };
}

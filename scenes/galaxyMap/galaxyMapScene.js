// scenes/galaxyMapScene.js
import { Scene } from "../../engine/core/scene.js";
import { raycastToGround } from "../../gameplay/cameraRay.js";

export class GalaxyMapScene extends Scene {
  constructor(services) {
    super(services);
    this.name = "Galaxy Map";

    // ===== Follow (cursor-pan) state =====
    this._follow = { x: 0, z: 0 };

    // 🔧 Настройки “следования за курсором”
    this._followCfg = {
      dead: 0.14,         // мёртвая зона (0.08..0.20)
      panBase: 420,       // амплитуда смещения в world units при zoom=1 (300..700)
      followSpeed: 2.0,   // скорость догоняния (1.2..3.5)
      // Ограничение по границам галактики (радиус)
      // ДОЛЖНО соответствовать GalaxySpiral radius в renderer3d.js (у тебя radius: 2200)
      galaxyRadius: 2200,
      margin: 250,        // запас от края
      // База карты (центр). Если твоя карта центрирована не в (0,0) — поменяй.
      baseX: 0,
      baseZ: 0,
    };

    // ===== Map camera (perspective top-ish) =====
    this._mapCam = {
      ortho: false,
      eye: [0, 1400, 1200],
      target: [0, 0, 0],
      up: [0, 1, 0],
      near: 0.1,
      far: 24000,
      fovRad: Math.PI / 3.2,
    };

    this._t = 0;

    // (не используется здесь, оставил как было)
    this._bgCam = {
      eye: [0, 0, 0],
      target: [0, 0, -1],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 1,
      far: 24000,
    };

    this._baseOrthoSize = 900;
  }

  enter() {
    const game = this.s.get("game");
    const state = this.s.get("state");

    state.ui.menuOpen = false;
    state.selectedSystemId = null;
    game?.menu?.close?.();

    // Стартовые значения (чтобы сразу было “крупно”)
    state.camera.zoom ??= 1.6;
    state.camera.x ??= this._followCfg.baseX;
    state.camera.y ??= this._followCfg.baseZ;

    // синхронизируем follow, чтобы не было рывка на первом кадре
    this._follow.x = state.camera.x;
    this._follow.z = state.camera.y;
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

    // статично: отключаем wheel/wasd
    input.consumeWheel?.();

    const cam2d = state.camera;
    this._t += dt;

    const m = input.getMouse?.() ?? { x: 0, y: 0 };

    // Камера для raycast берём текущую (до обновления follow)
    const camBefore = this._applyCamFromState(cam2d);

    // mouse->ground (для меню/пика)
    const hit = raycastToGround(m.x, m.y, viewPx.w, viewPx.h, camBefore);
    const wpos = hit ?? { x: 0, z: 0 };

    // ====== CURSOR FOLLOW (NO CLICK) ======
    // Нормализуем курсор относительно центра экрана
    const cx = viewPx.w * 0.5;
    const cy = viewPx.h * 0.5;

    let nx = (m.x - cx) / cx; // -1..1
    let ny = (m.y - cy) / cy; // -1..1
    nx = Math.max(-1, Math.min(1, nx));
    ny = Math.max(-1, Math.min(1, ny));

    // Мёртвая зона + плавное нарастание (без “дёрганья” в центре)
    const dead = this._followCfg.dead;
    const len = Math.hypot(nx, ny);
    if (len < dead) {
      nx = 0;
      ny = 0;
    } else {
      const t = (len - dead) / (1 - dead);
      nx = (nx / len) * t;
      ny = (ny / len) * t;
    }

    const zoom = Math.max(0.35, cam2d.zoom ?? 1);
    const panRadius = this._followCfg.panBase / zoom;

    // ✅ ВАЖНО: цель считаем от “базы”, а не от текущей cam2d.x/y
    // иначе будет саморазгон/дрифт
    const baseX = this._followCfg.baseX;
    const baseZ = this._followCfg.baseZ;

    const targetX = baseX + nx * panRadius;
    const targetZ = baseZ + ny * panRadius;

    // сглаживание
    const followSpeed = this._followCfg.followSpeed;
    const k = 1.0 - Math.exp(-followSpeed * dt);

    this._follow.x += (targetX - this._follow.x) * k;
    this._follow.z += (targetZ - this._follow.z) * k;

    // ограничиваем по радиусу галактики (чтобы не улетать за край)
    const maxR = Math.max(0, (this._followCfg.galaxyRadius - this._followCfg.margin));
    let fx = this._follow.x;
    let fz = this._follow.z;

    const r = Math.hypot(fx - baseX, fz - baseZ);
    if (r > maxR) {
      const s = maxR / r;
      fx = baseX + (fx - baseX) * s;
      fz = baseZ + (fz - baseZ) * s;
      this._follow.x = fx;
      this._follow.z = fz;
    }

    cam2d.x = fx;
    cam2d.y = fz;

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

    const cam2d = state.camera;
    const cam = this._applyCamFromState(cam2d);

    r3d.begin(view, cam);

    // tiltMul: не даём гаснуть
    const vx = cam.target[0] - cam.eye[0];
    const vy = cam.target[1] - cam.eye[1];
    const vz = cam.target[2] - cam.eye[2];
    const invLen = 1 / Math.max(1e-6, Math.hypot(vx, vy, vz));
    const vny = vy * invLen;
    const cosTilt = Math.abs(vny);
    const tiltMul = Math.max(0.85, cosTilt);

    // фон-галактика
    r3d.drawGalaxySpiral(view, cam, dpr, this._t, tiltMul);

    // вуаль для читаемости карты
    r3d.drawOverlay([0.0, 0.0, 0.0, 0.42]);

    // гиперкоридоры
    for (const l of galaxy.links) {
      const a = galaxy.systems[l.a];
      const b = galaxy.systems[l.b];
      if (!a || !b) continue;

      const y = 0.0;
      const pts = new Float32Array([a.x, y, a.z, b.x, y, b.z]);

      // 1) подложка
      r3d.drawLines(
        pts,
        l.kind === "relay"
          ? [0.25, 0.95, 1.0, 0.35]
          : [0.3, 0.5, 0.8, 0.22],
      );

      // 2) ядро
      r3d.drawLines(
        pts,
        l.kind === "relay"
          ? [0.6, 1.0, 1.0, 0.85]
          : [0.65, 0.85, 1.0, 0.65],
      );
    }

    // системы
    const selectedId = state.selectedSystemId;
    const currentId = state.currentSystemId;

    for (const s of galaxy.systems) {
      const isSelected = s.id === selectedId;
      const isCurrent = s.id === currentId;

      const baseR = (s.size ?? 12) * 2.2;
      const y = 0.0;

      const fade = 0.85;
      const ringR = baseR * 1.0;
      const ringT = baseR * 0.22;
      const strokeT = ringT * 1.55;

      const col =
        s.kind === "relay"
          ? [0.25, 0.75, 1.0, 0.42 * fade]
          : [0.90, 0.25, 0.22, 0.42 * fade];

      // stroke (чёрный контур)
      r3d.drawRingAt(s.x, y, s.z, ringR, strokeT, 128, [0, 0, 0, 0.52 * fade]);
      // цвет
      r3d.drawRingAt(s.x, y, s.z, ringR, ringT, 128, col);

      // крест
      if (s.kind === "relay") {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.52, [0.35, 0.95, 1.0, 0.75]);
      } else {
        r3d.drawCrossAt(s.x, y, s.z, baseR * 0.52, [1.0, 1.0, 1.0, 0.75]);
      }

      // current / selected (толстые кольца)
      if (isCurrent) {
        r3d.drawRingAt(s.x, y, s.z, baseR * 1.45, baseR * 0.18, 128, [0.25, 1.0, 0.35, 0.35]);
      }
      if (isSelected) {
        r3d.drawRingAt(s.x, y, s.z, baseR * 1.75, baseR * 0.20, 128, [1.0, 0.80, 0.25, 0.45]);
      }
    }
  }

  _applyCamFromState(cam2d) {
    const cam = this._mapCam;
    const zoom = Math.max(0.15, cam2d.zoom ?? 1);

    const tiltDeg = 30;
    const tilt = (tiltDeg * Math.PI) / 180;

    // “крупность карты” — один главный параметр
    const distBase = 1100;
    const zoomStrength = 0.6;
    const dist = (distBase / zoom) * zoomStrength;

    const height = Math.sin(tilt) * dist;
    const back = Math.cos(tilt) * dist;

    // композиция: поднимаем карту в кадре
    const aimDown = 0.09 * dist;
    const targetY = -aimDown;

    cam.ortho = false;

    cam.target[0] = cam2d.x ?? 0;
    cam.target[1] = targetY;
    cam.target[2] = cam2d.y ?? 0;

    cam.eye[0] = cam.target[0];
    cam.eye[1] = height;
    cam.eye[2] = cam.target[2] + back;

    cam.up[0] = 0;
    cam.up[1] = 1;
    cam.up[2] = 0;

    return cam;
  }
}

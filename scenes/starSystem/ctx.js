import { EngineFlame } from "../../engine/renderer/engineFlame.js";
import { QuestState } from "../../gameplay/quest/questState.js";
import { createColliderSystem } from "../../gameplay/collisions/colliders.js";
import { createProjectileSystem } from "../../gameplay/weapons/projectiles.js";
import { RelationIconsOverlay } from "../../ui/relationIconsOverlay.js";
import { createEnemyFireSystem } from "../../gameplay/combat/enemyFire.js";
import { LetterboxOverlay } from "../../ui/letterboxOverlay.js";
import { CutsceneCaption } from "../../ui/cutsceneCaption.js";
import { CutscenePlayer } from "../../gameplay/cutscene/cutscenePlayer.js";
export function createStarSystemCtx(services) {
  const gl = services.get("gl");
  const canvas = services.get("canvas");

  const ctx = {
    // runtime
    systemId: null,
    system: null,
    time: 0,

    // camera
    cam3d: {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 5000,
    },
    followCam: {
      distance: 340,
      height: 220,
      yawOffset: 0.0,
      pitch: -0.55,
      targetAhead: 40,
      targetLift: 0,
      smooth: 12.0,
      minHeight: 40,
      maxHeight: 900,
      minDistance: 120,
      maxDistance: 1200,
      minPitch: -1.35,
      maxPitch: -0.15,
    },

    boundsRadius: 1200,

    // POI + quest
    quest: new QuestState(),
    poiDef: null,
    poi: null,
    poiFocus: null,
    poiHint: "",
    questLine: "",
    lastLog: "",
    spawnPoints: null,

    // rendering helpers
    flame: new EngineFlame(gl, { max: 2000 }),

    // combat/physics
    colliders: createColliderSystem({ cellSize: 140 }),
    projectiles: createProjectileSystem({
      bulletSpeed: 1100,
      bulletLife: 1.1,
      fireCooldown: 0.09,
      muzzleAhead: 16,
      damage: 14,
      hitRadius: 6,
      spread: 0.01,
    }),

    enemyFire: createEnemyFireSystem({
      range: 520,
      fireRate: 1.2,
      damage: 18,
      fireArcCos: 0.25,
      jitter: 0.02,
    }),

    // overlays
    relIcons: new RelationIconsOverlay({ canvas }),

    // tuning
    systemPlaneY: -90,
    celestialTriggerMul: 1.6,
    celestialInteractMul: 1.0,

    // debug flags
  debug: {
    colliders: true,
    poiSampleLog: true,
    poiZones: true, // ✅
  },
  };
const letterbox = new LetterboxOverlay({ parent: document.body });
const caption = new CutsceneCaption({ parent: document.body });

ctx.inputLock = {
  camera: false,
  ship: false,
  interact: false,
  combat: false,
};

ctx.cutscene = new CutscenePlayer({
  onLock: () => {
    ctx.inputLock.camera = true;
    ctx.inputLock.ship = true;
    ctx.inputLock.interact = true;
    ctx.inputLock.combat = true;
  },
  onUnlock: () => {
    ctx.inputLock.camera = false;
    ctx.inputLock.ship = false;
    ctx.inputLock.interact = false;
    ctx.inputLock.combat = false;
  },
  onLetterbox: (v, h) => (v ? letterbox.show(h) : letterbox.hide()),
  onCaption: (v, text) => (v ? caption.show(text) : caption.hide()),
});

// ✅ сами скрипты (простые)
ctx.cutsceneScripts = {
  act1Intro: {
    letterbox: true,
    letterboxHeight: 95,
    caption: "…Выход из прыжка. Системы корабля повреждены.",
    segments: [
      {
        dur: 1.2,
        caption: "Стабилизация…",
        // камера смотрит чуть сбоку/сверху на корабль
        fromEye: (c) => [c.cam3d.eye[0], c.cam3d.eye[1], c.cam3d.eye[2]],
        toEye: (c) => {
          const ship = c.services?.get?.("state")?.playerShip?.runtime; // если вдруг прокинешь
          // fallback: просто приблизим к центру
          return [120, 260, 420];
        },
        fromTarget: (c) => [c.cam3d.target[0], c.cam3d.target[1], c.cam3d.target[2]],
        toTarget: (c) => [0, 0, 0],
      },
      {
        dur: 1.6,
        caption: "Найди способ восстановить навигацию и активировать маяк.",
        fromEye: [120, 260, 420],
        toEye: [40, 220, 340],
        fromTarget: [0, 0, 0],
        toTarget: [0, 0, 0],
      },
      {
        dur: 0.8,
        caption: "Управление возвращено. Удачи.",
        // лёгкая пауза без движения камеры
        fromEye: [40, 220, 340],
        toEye: [40, 220, 340],
        fromTarget: [0, 0, 0],
        toTarget: [0, 0, 0],
      },
    ],
    onEnd: () => {
      // можно лог квеста
      ctx.quest?.addLog?.("Катсцена завершена. Задача: починить корабль и включить маяк.");
      ctx.lastLog = ctx.quest?.log?.at?.(-1)?.text ?? ctx.lastLog;
    },
  },
};
  // ✅ теперь ctx существует и замыкается
  ctx.resolvePoiPos = (poi) => {
    if (!poi) return null;
    if (poi.kind === "static") return { x: poi.x ?? 0, z: poi.z ?? 0 };
    if (poi.kind === "planet") {
      const p = ctx.system?.planets?.find((pp) => pp.id === poi.planetId);
      if (!p) return null;
      const a = ctx.time * p.speed + p.phase;
      return { x: Math.cos(a) * p.orbitRadius, z: Math.sin(a) * p.orbitRadius };
    }
    return null;
  };

  return ctx;
}

import { EngineFlame } from "../../engine/renderer/engineFlame.js";

import { QuestStateV2 } from "../../gameplay/quest/QuestStateV2.js";
import { StoryManager } from "../../gameplay/story/StoryManager.js";
import { createContentRegistry } from "../../data/content/index.js";

import { createColliderSystem } from "../../gameplay/collisions/colliders.js";
import { createProjectileSystem } from "../../gameplay/weapons/projectiles.js";
import { RelationIconsOverlay } from "../../ui/relationIconsOverlay.js";
import { createEnemyFireSystem } from "../../gameplay/combat/enemyFire.js";

import { LetterboxOverlay } from "../../ui/letterboxOverlay.js";
import { CutsceneCaption } from "../../ui/cutsceneCaption.js";
import { CutscenePlayer } from "../../gameplay/cutscene/cutscenePlayer.js";
import { ActState } from "../../gameplay/story/ActState.js";
export function createStarSystemCtx(services) {
  const gl = services.get("gl");
  const canvas = services.get("canvas");

  const ctx = {
    // ⛳️ важно: чтобы катсцены могли получать доступ к services (если надо)
    services,

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
    act: new ActState(),
    // POI + quest
    quest: new QuestStateV2(),   // ✅ новый стейт
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

    // input lock
    inputLock: {
      camera: false,
      ship: false,
      interact: false,
      combat: false,
    },

    // debug flags
    debug: {
      colliders: true,
      poiSampleLog: true,
      poiZones: true,
    },
  };

  // ===== cutscene infrastructure (движковая) =====
  const letterbox = new LetterboxOverlay({ parent: document.body });
  const caption = new CutsceneCaption({ parent: document.body });

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

  // ===== content registry + story manager =====
  ctx.content = createContentRegistry();
ctx.story = new StoryManager({
  quest: ctx.quest,
  act: ctx.act,
  cutscenePlayer: ctx.cutscene,
  contentRegistry: ctx.content,
});

  // ===== world helpers =====
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

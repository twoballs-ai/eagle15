// src/scenes/starSystem/ctx.js

import { EngineFlame } from "../../engine/renderer/engineFlame.js";
import { QuestStateV2 } from "../../gameplay/quest/QuestStateV2.js";
import { StoryManager } from "../../engine/managers/StoryManager.js";
import { createContentRegistry } from "../../data/content/index.js";

import { createColliderSystem } from "../../gameplay/collisions/colliders.js";
import { createProjectileSystem } from "../../gameplay/weapons/projectiles.js";
import { WEAPONS_CATALOG } from "../../data/items/weapons.js"; // ✅ ЗАМЕНЕНО на новый каталог

import { createEnemyFireModule } from "../../gameplay/combat/enemyFire.js";

import { LetterboxOverlay } from "../../ui/letterboxOverlay.js";
import { CutsceneCaption } from "../../ui/cutsceneCaption.js";
import { CutscenePlayer } from "../../gameplay/cutscene/cutscenePlayer.js";
import { ActState } from "../../gameplay/story/ActState.js";
import { EnemyDialogWidget } from "../../ui/EnemyDialogWidget.js";
import { EventIndicatorWidget } from "../../ui/widgets/EventIndicatorWidget.js";
import { CommsWidget } from "../../ui/widgets/CommsWidget.js";

export function createStarSystemCtx(services) {
  const gl = services.get("gl");
  const canvas = services.get("canvas");
  const state = services.get("state");

  const ctx = {
    services,
    systemId: null,
    system: null,
    time: 0,
    cam3d: {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 1.0,
      far: 5000,
    },
    followCam: {
      distance: 340,
      height: 220,
      yawOffset: 0.0,
      pitch: -0.55,
      targetAhead: 0,
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
    quest: new QuestStateV2(state),
    poiDef: null,
    poi: null,
    poiFocus: null,
    poiHint: "",
    questLine: "",
    lastLog: "",
    spawnPoints: null,
    flame: new EngineFlame(gl, { max: 2000 }),
    colliders: createColliderSystem({ cellSize: 140 }),
    projectiles: createProjectileSystem({
      hitRadius: 6, // ✅ Упрощено, так как damage/speed теперь берутся из оружия
    }),
    
    // ✅ ОБНОВЛЕНО: используем новый каталог вместо удалённого WEAPON_PRESETS
    weapons: {
      available: WEAPONS_CATALOG,
      currentIndex: 0,
    },
    
    // 🚨 ДОБАВЛЕНО: Состояние автобоя
    autoCombat: {
      enabled: true, // ✅ Всегда включён по умолчанию
      orbitDir: 1,
    },
    
    ui: {
      enemyDialog: new EnemyDialogWidget(),
      commsLog: null,
      eventIndicator: null,
    },
    enemyFire: createEnemyFireModule({
      range: 520,
      fireRate: 1.2,
      damage: 18,
      fireArcCos: 0.25,
      jitter: 0.02,
    }),
    
    systemPlaneY: -90,
    celestialTriggerMul: 1.0,
    celestialInteractMul: 1.0,
    inputLock: {
      camera: false,
      ship: false,
      interact: false,
      combat: false,
    },
    debug: {
      colliders: true,
      poiSampleLog: true,
      poiZones: true,
    },
  };

  ctx.enemyFire.setProjectileSystem(ctx.projectiles);

  // ===== Инициализация виджетов связи =====
  ctx.ui.commsLog = new CommsWidget({
    id: "comms-widget",
    ctx,
    onMessageClick: (msg) => {
      services.get("bus").emit("ui:requestInteraction", { shipId: msg.shipId });
    }
  });

  ctx.ui.eventIndicator = new EventIndicatorWidget({
    id: "event-indicator",
    ctx
  });
  // ==========================================

  // ===== cutscene infrastructure =====
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
import { EngineFlame } from "../../engine/renderer/engineFlame.js";
import { QuestState } from "../../gameplay/quest/questState.js";
import { createColliderSystem } from "../../gameplay/collisions/colliders.js";
import { createProjectileSystem } from "../../gameplay/weapons/projectiles.js";
import { RelationIconsOverlay } from "../../ui/relationIconsOverlay.js";
import { createEnemyFireSystem } from "../../gameplay/combat/enemyFire.js";

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

import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  buildTracersXYZ,
  createProjectileSystem,
  stepProjectiles,
} from "../../src/gameplay/weapons/projectiles.js";
import {
  LAYER,
  addCollider,
  buildColliderGrid,
  createColliderSystem,
  queryGrid,
} from "../../src/gameplay/collisions/colliders.js";

test("performance smoke keeps projectile stepping and collision broadphase in a sane range", () => {
  const projectiles = createProjectileSystem({ max: 4096, bulletSpeed: 700, bulletLife: 5 });
  for (let i = 0; i < 2000; i++) {
    projectiles.list.push({
      id: i + 1,
      x: i % 200,
      z: (i * 3) % 200,
      vx: 50,
      vz: -50,
      life: 4,
      alive: true,
    });
  }

  const colliderSys = createColliderSystem({ cellSize: 64 });
  for (let i = 0; i < 1500; i++) {
    addCollider(colliderSys, {
      id: `c-${i}`,
      kind: "ship",
      x: (i % 75) * 10,
      z: ((i / 75) | 0) * 10,
      r: 6,
      ref: {},
      layer: LAYER.SHIP,
      mask: LAYER.PROJECTILE | LAYER.SHIP,
    });
  }

  const t0 = performance.now();
  stepProjectiles(projectiles, 0.016, 5000);
  const tracerCount = buildTracersXYZ(projectiles).length;
  const projectileMs = performance.now() - t0;

  const t1 = performance.now();
  buildColliderGrid(colliderSys);
  const nearby = queryGrid(colliderSys, 120, 120, 96).length;
  const broadphaseMs = performance.now() - t1;

  assert.equal(tracerCount > 0, true);
  assert.equal(nearby > 0, true);
  assert.equal(projectileMs < 40, true);
  assert.equal(broadphaseMs < 40, true);
});


// Implementation
#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>
#include "colliders.js.hpp"
#include "node:perf_hooks.hpp"
#include "node:test.hpp"
#include "projectiles.js.hpp"
#include "strict.hpp"







test("performance smoke keeps projectile stepping and collision broadphase in a sane range", () => {
  const projectiles = createProjectileSystem({ max: 4096, bulletSpeed: 700, bulletLife: 5 });
  for (i = 0; i < 2000; i++) {
    projectiles.list.push_back({
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
  for (i = 0; i < 1500; i++) {
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
  const tracerCount = buildTracersXYZ(projectiles).size();
  const projectileMs = performance.now() - t0;

  const t1 = performance.now();
  buildColliderGrid(colliderSys);
  const nearby = queryGrid(colliderSys, 120, 120, 96).size();
  const broadphaseMs = performance.now() - t1;

  assert.equal(tracerCount > 0, true);
  assert.equal(nearby > 0, true);
  assert.equal(projectileMs < 40, true);
  assert.equal(broadphaseMs < 40, true);
});

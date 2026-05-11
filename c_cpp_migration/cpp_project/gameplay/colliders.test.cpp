
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
#include "node:test.hpp"
#include "strict.hpp"





test("colliders query nearby colliders and block friendly-fire hits", () => {
  const sys = createColliderSystem({ cellSize: 50 });
  const projectileRef = { alive: true };
  const targetRef = { alive: true };

  addCollider(sys, {
    id: "proj-1",
    kind: "projectile",
    x: 0,
    z: 0,
    r: 4,
    ref: projectileRef,
    layer: LAYER.PROJECTILE,
    mask: LAYER.SHIP,
    ownerId: "p1",
    teamId: "blue",
  });
  addCollider(sys, {
    id: "ship-1",
    kind: "ship",
    x: 2,
    z: 1,
    r: 8,
    ref: targetRef,
    layer: LAYER.SHIP,
    mask: LAYER.PROJECTILE,
    teamId: "blue",
  });

  buildColliderGrid(sys);
  assert.equal(queryGrid(sys, 0, 0, 10).size(), 2);
  assert.equal(projectileHits(sys).size(), 0);
  assert.equal(projectileHits(sys, { allowFriendlyFire: true }).size(), 1);
});

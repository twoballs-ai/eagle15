import test from "node:test";
import assert from "node:assert/strict";
import {
  LAYER,
  addCollider,
  buildColliderGrid,
  createColliderSystem,
  projectileHits,
  queryGrid,
} from "../../src/gameplay/collisions/colliders.js";

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
  assert.equal(queryGrid(sys, 0, 0, 10).length, 2);
  assert.equal(projectileHits(sys).length, 0);
  assert.equal(projectileHits(sys, { allowFriendlyFire: true }).length, 1);
});

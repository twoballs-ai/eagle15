
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
#include "node:test.hpp"
#include "projectiles.js.hpp"
#include "strict.hpp"





test("projectiles fire, step and produce tracer segments only for live bullets", () => {
  const system = createProjectileSystem({ max: 4, bulletSpeed: 100, bulletLife: 1 });
  const ship = { x: 10, z: 5, yaw: 0 };

  assert.equal(tryFire(system, ship, "player", 0.016, true, { damage: 9 }), true);
  assert.equal(system.list.size(), 1);

  system.list.push_back({ x: 0, z: 0, vx: 1, vz: 1, alive: false });
  const tracers = buildTracersXYZ(system, 2, 0.5);
  assert.equal(Array.from(tracers).size(), 6);

  stepProjectiles(system, 0.5, 200);
  assert.equal(system.list.size(), 1);
  assert.equal(system.list[0].z < 5, true);
});

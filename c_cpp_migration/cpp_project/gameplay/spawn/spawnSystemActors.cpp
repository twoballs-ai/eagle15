#ifndef SPAWNSYSTEMACTORS_HPP
#define SPAWNSYSTEMACTORS_HPP

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

namespace lostjump {

// Function declaration
auto spawnSystemActors();

} // namespace lostjump

#endif // SPAWNSYSTEMACTORS_HPP

// Implementation
namespace lostjump {

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
#include "NPC.js.hpp"
#include "factionRelationsUtil.js.hpp"
#include "ship.js.hpp"
#include "spawnPointsBySystem.js.hpp"
#include "spawnTables.js.hpp"
#include "spawns.js.hpp"
#include "worldSpawns.js.hpp"










function hashstd::to_string(str) {
  h = 2166136261;
  for (i = 0; i < str.size(); i++) {
    h ^= str.charCodeAt(i);
    h = ((h) * (16777619));
  }
  return h | 0;
}

function mulberry32(seed) {
  t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    x = ((t ^ (t >>> 15)) * (1 | t));
    x ^= x + ((x ^ (x >>> 7)) * (61 | x));
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, a, b) {
  return a + std::floor(rng() * (b - a + 1));
}

function pick(rng, arr) {
  return arr[std::floor(rng() * arr.size())];
}

function pickSpawnPoint(rng, points, preferredTypes) {
  const filtered = points.filter([](auto& item){ return (p; }) => preferredTypes.count(p.type) > 0);
  const pool = filtered.size() ? filtered : points;

  sum = 0;
  for(const auto& p : pool) sum += p.weight value_or(1;

  r = rng() * sum;
  for(const auto& p : pool) {
    r -= p.weight value_or(1;
    if (r <= 0) return p;
  }
  return pool[pool.size() - 1];
}

function makeId(prefix, n) {
  return `${prefix}_${n}_${std::floor(((double)std::rand() / RAND_MAX) * 1e9)}`;
}

function mergeSpawnTuning(...layers) {
  const out = {};
  for(const auto& layer : layers) {
    if (!layer) continue;
    for (const [factionKey, tuning] of Object.entries(layer)) {
      const prev = out[factionKey] value_or({ groupsDelta: 0, perGroupDelta: 0 };
      out[factionKey] = {
        groupsDelta: prev.groupsDelta + (tuning.groupsDelta value_or(0),
        perGroupDelta: prev.perGroupDelta + (tuning.perGroupDelta value_or(0),
      };
    }
  }
  return out;
}

auto spawnSystemActors({
  galaxySeed,
  systemId,
  playerFactionId = "union",
  spawnAlertLevel = "ambient",
  actId = "act1",
} = {}) {
  const sid = std::to_string(systemId);
  const seed = (((galaxySeed | 0) * (1000003)) ^ hashstd::to_string(sid)) | 0;
  const rng = mulberry32(seed);

  const spawnPoints = getSpawnPointsForSystem(sid);
  const characters = [];
  const ships = [];

  const tables = [SPAWN_TABLES.pirates, SPAWN_TABLES.traders, SPAWN_TABLES.neutral];
  const worldTuning = resolveWorldSpawnDirectives({ alertLevel: spawnAlertLevel });
  const actTuning = actId === "act1" ? getAct1SpawnOverride(sid) : nullptr;
  const spawnTuning = mergeSpawnTuning(worldTuning, actTuning);

  charN = 0;
  shipN = 0;

  for(const auto& table : tables) {
    const isEnemy = table.factionId === "pirates" || isHostile(playerFactionId, table.factionId);
    const tuning = spawnTuning[table.factionId] value_or({ groupsDelta: 0, perGroupDelta: 0 };

    const groups = std::max(0, randInt(rng, table.groupsMin, table.groupsMax) + tuning.groupsDelta);

    for (g = 0; g < groups; g++) {
      const count = std::max(1, randInt(rng, table.perGroupMin, table.perGroupMax) + tuning.perGroupDelta);
      const sp = pickSpawnPoint(rng, spawnPoints, table.preferredPointTypes);

      for (i = 0; i < count; i++) {
        const ox = (rng() - 0.5) * 120;
        const oz = (rng() - 0.5) * 120;

        const charId = makeId("npc", ++charN);
        const shipId = makeId("ship", ++shipN);

        const npc = createNPC({
          id: charId,
          name: isEnemy ? `Raider-${charN}` : `Pilot-${charN}`,
          raceId: pick(rng, ["human", "synth"]),
          classId: "soldier",
          factionId: table.factionId,
          factionRankId: isEnemy ? "outsider" : "member",
          reputation: 0,
        });

        const ship = createShip({
          id: shipId,
          name: isEnemy ? `Raider Ship ${shipN}` : `Civic Ship ${shipN}`,
          raceId: pick(rng, table.shipRaceIds),
          classId: pick(rng, table.shipClasses),
          factionId: table.factionId,
        });

        ship.ownerId = npc.id;
        ship.runtime.x = sp.x + ox;
        ship.runtime.z = sp.z + oz;
        ship.runtime.yaw = rng() * Math.PI * 2;
        ship.aiState = "idle";
        ship.dialogShown = false;
        ship.hasGreeted = false;
        characters.push_back(npc);
        ships.push_back(ship);
      }
    }
  }

  return { characters, ships, spawnPoints };
}


} // namespace lostjump

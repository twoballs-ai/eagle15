// gameplay/spawn/spawnSystem.js
import { createNPC } from "../../data/character/NPC.js";
import { createShip } from "../../data/ship/ship.js";
import { isHostile } from "../../data/faction/factionRelationsUtil.js";
import { getSpawnPointsForSystem } from "../../data/system/spawnPointsBySystem.js";
import { SPAWN_TABLES } from "../../data/system/spawnTables.js";
import { resolveWorldSpawnDirectives } from "../../data/content/world/spawns/worldSpawns.js";
import { getAct1SpawnOverride } from "../../data/content/acts/act1/spawns.js";

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, a, b) {
  return a + Math.floor(rng() * (b - a + 1));
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickSpawnPoint(rng, points, preferredTypes) {
  const filtered = points.filter((p) => preferredTypes.includes(p.type));
  const pool = filtered.length ? filtered : points;

  let sum = 0;
  for (const p of pool) sum += p.weight ?? 1;

  let r = rng() * sum;
  for (const p of pool) {
    r -= p.weight ?? 1;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

function makeId(prefix, n) {
  return `${prefix}_${n}_${Math.floor(Math.random() * 1e9)}`;
}

function mergeSpawnTuning(...layers) {
  const out = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const [factionKey, tuning] of Object.entries(layer)) {
      const prev = out[factionKey] ?? { groupsDelta: 0, perGroupDelta: 0 };
      out[factionKey] = {
        groupsDelta: prev.groupsDelta + (tuning?.groupsDelta ?? 0),
        perGroupDelta: prev.perGroupDelta + (tuning?.perGroupDelta ?? 0),
      };
    }
  }
  return out;
}

export function spawnSystemActors({
  galaxySeed,
  systemId,
  playerFactionId = "union",
  spawnAlertLevel = "ambient",
  actId = "act1",
} = {}) {
  const sid = String(systemId);
  const seed = (Math.imul(galaxySeed | 0, 1000003) ^ hashString(sid)) | 0;
  const rng = mulberry32(seed);

  const spawnPoints = getSpawnPointsForSystem(sid);
  const characters = [];
  const ships = [];

  const tables = [SPAWN_TABLES.pirates, SPAWN_TABLES.traders, SPAWN_TABLES.neutral];
  const worldTuning = resolveWorldSpawnDirectives({ alertLevel: spawnAlertLevel });
  const actTuning = actId === "act1" ? getAct1SpawnOverride(sid) : null;
  const spawnTuning = mergeSpawnTuning(worldTuning, actTuning);

  let charN = 0;
  let shipN = 0;

  for (const table of tables) {
    const isEnemy = table.factionId === "pirates" || isHostile(playerFactionId, table.factionId);
    const tuning = spawnTuning[table.factionId] ?? { groupsDelta: 0, perGroupDelta: 0 };

    const groups = Math.max(0, randInt(rng, table.groupsMin, table.groupsMax) + tuning.groupsDelta);

    for (let g = 0; g < groups; g++) {
      const count = Math.max(1, randInt(rng, table.perGroupMin, table.perGroupMax) + tuning.perGroupDelta);
      const sp = pickSpawnPoint(rng, spawnPoints, table.preferredPointTypes);

      for (let i = 0; i < count; i++) {
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
        characters.push(npc);
        ships.push(ship);
      }
    }
  }

  return { characters, ships, spawnPoints };
}

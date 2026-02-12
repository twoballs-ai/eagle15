// gameplay/spawn/spawnSystem.js
import { createNPC } from "../../data/character/NPC.js";
import { createShip } from "../../data/ship/ship.js";
import { isHostile } from "../../data/faction/factionRelationsUtil.js";
import { getSpawnPointsForSystem } from "../../data/system/spawnPointsBySystem.js";
import { SPAWN_TABLES } from "../../data/system/spawnTables.js";

// простой детерминированный RNG
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
  const filtered = points.filter(p => preferredTypes.includes(p.type));
  const pool = filtered.length ? filtered : points;

  let sum = 0;
  for (const p of pool) sum += (p.weight ?? 1);

  let r = rng() * sum;
  for (const p of pool) {
    r -= (p.weight ?? 1);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

function makeId(prefix, n) {
  return `${prefix}_${n}_${Math.floor(Math.random() * 1e9)}`;
}

// Главная функция: возвращает { characters, ships, spawnPoints }
export function spawnSystemActors({ galaxySeed, systemId, playerFactionId = "union" }) {
  const seed = (galaxySeed * 1000003 + systemId * 9176) | 0;
  const rng = mulberry32(seed);

  const spawnPoints = getSpawnPointsForSystem(systemId);
  const characters = [];
  const ships = [];

  const tables = [SPAWN_TABLES.pirates, SPAWN_TABLES.traders, SPAWN_TABLES.neutral];

  let charN = 0;
  let shipN = 0;

  for (const table of tables) {
    const isEnemy = table.factionId === "pirates" || isHostile(playerFactionId, table.factionId);

    const groups = randInt(rng, table.groupsMin, table.groupsMax);

    for (let g = 0; g < groups; g++) {
      const count = randInt(rng, table.perGroupMin, table.perGroupMax);

      const sp = pickSpawnPoint(rng, spawnPoints, table.preferredPointTypes);

      for (let i = 0; i < count; i++) {
        const ox = (rng() - 0.5) * 120;
        const oz = (rng() - 0.5) * 120;

        const charId = makeId("npc", ++charN);
        const shipId = makeId("ship", ++shipN);

        // создаём NPC отдельно от игрока
        const npc = createNPC({
          id: charId,
          name: isEnemy ? `Raider-${charN}` : `Pilot-${charN}`,
          raceId: pick(rng, ["human", "synth"]), // можно рандомизировать
          classId: "soldier",                    // фиксированная для NPC
          factionId: table.factionId,
          factionRankId: isEnemy ? "outsider" : "member",
          reputation: 0,
        });

        // создаём корабль NPC
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
        ship.isEnemy = isEnemy;

        characters.push(npc);
        ships.push(ship);
      }
    }
  }

  return { characters, ships, spawnPoints };
}

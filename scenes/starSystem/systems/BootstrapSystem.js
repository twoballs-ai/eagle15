import { System } from "../../../engine/core/lifecycle.js";
import { createStarSystem } from "../../../data/starSystem.js";
import { createAct1Poi } from "../../../data/system/act1PoiFromSystem.js";
import { PoiRuntimeOrbit } from "../../../gameplay/poi/poiRuntimeOrbit.js";
import { spawnSystemActors } from "../../../gameplay/spawn/spawnSystem.js";
import { ShipStatsHUD } from "../../../ui/shipStatsHud.js";
import { RACES } from "../../../data/character/races.js";
import { CLASSES } from "../../../data/character/classes.js";
export class BootstrapSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.shipHud = null; // твой ShipStatsHUD (если реально нужен)
  }

  enter(systemId) {
    const galaxy = this.s.get("galaxy");
    const state = this.s.get("state");

    this.ctx.systemId = systemId;

    const sys = galaxy.systems[systemId];
    this.ctx.system = createStarSystem(galaxy.seed, sys.id);

    // bounds
    const planets = this.ctx.system?.planets || [];
    let maxOrbit = 0;
    for (const p of planets) maxOrbit = Math.max(maxOrbit, p.orbitRadius || 0);
    this.ctx.boundsRadius = Math.max(1200, maxOrbit * 1.25);

    // camera far
    this.ctx.cam3d.far = Math.max(5000, this.ctx.boundsRadius * 2.5);

    // reset camera
    this.ctx.cam3d.eye = [0, 220, 340];
    this.ctx.cam3d.target = [0, 0, 0];

    // POI
    this.ctx.poiDef = createAct1Poi(galaxy.seed, sys.id, this.ctx.system);
this.ctx.poi = new PoiRuntimeOrbit({
  poiDef: this.ctx.poiDef,
  resolvePos: (poi) => this.ctx.resolvePoiPos(poi),
});

    this.ctx.poiHint = "";
    this.ctx.poiFocus = null;

    // reset ship runtime
    const ship = state.playerShip;
    if (ship?.runtime) {
      ship.runtime.x = 0;
      ship.runtime.z = 0;
      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = 0;
      ship.runtime.targetX = null;
      ship.runtime.targetZ = null;
    }

    // spawn NPC
    const spawned = spawnSystemActors({
      galaxySeed: galaxy.seed,
      systemId,
      playerFactionId: state.player?.factionId ?? "union",
    });

    state.characters = spawned.characters;
    state.ships = [state.playerShip, ...spawned.ships].filter(Boolean);
    this.ctx.spawnPoints = spawned.spawnPoints;

    // init ship stats
    const r = state.playerShip?.runtime;
    const stats = state.playerShip?.stats;
    if (r && stats) {
      r.hpMax = Math.round(stats.hull);
      r.hp = r.hp ?? r.hpMax;

      r.shieldMax = Math.round(stats.shields);
      r.shield = r.shield ?? r.shieldMax;

      r.energyMax = Math.round(stats.energy);
      r.energy = r.energy ?? r.energyMax;

      r.maxSpeed = 260 * (stats.speed ?? 1.0);
    }

if (!this.shipHud) this.shipHud = new ShipStatsHUD();

const p = state.player;
this.shipHud.setPilot({
  name: p?.name ?? "—",
raceName: RACES[p?.raceId]?.name ?? p?.raceId ?? "",
className: CLASSES[p?.classId]?.name ?? p?.classId ?? "",
  avatarUrl: p?.avatarUrl ?? "",
  sub: "Пилот",
});

this.shipHud.update(state.playerShip?.runtime);

    // quest init
    this.ctx.quest.reset?.(); // если есть reset
    this.ctx.quest.addLog("Выход из прыжка: корабль повреждён. Нужно восстановить системы и покинуть систему.");
    this.ctx.lastLog = this.ctx.quest.log.at(-1)?.text ?? "";
  }

  // ==== world pos helpers (вынесены из сцены) ====
  getPlanetWorldPosById(planetId) {
    const p = this.ctx.system?.planets?.find((pp) => pp.id === planetId);
    if (!p) return null;
    const a = this.ctx.time * p.speed + p.phase;
    const x = Math.cos(a) * p.orbitRadius;
    const z = Math.sin(a) * p.orbitRadius;
    return { x, z };
  }

  getPoiWorldPos(poi) {
    if (!poi) return null;
    if (poi.kind === "static") return { x: poi.x ?? 0, z: poi.z ?? 0 };
    if (poi.kind === "planet") return this.getPlanetWorldPosById(poi.planetId);
    return null;
  }
}

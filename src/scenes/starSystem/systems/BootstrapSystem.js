// scenes/starSystem/systems/BootstrapSystem.js
import { System } from "../../../engine/core/lifecycle.js";
import { createStarSystem } from "../../../data/starSystem.js";
import { createAct1Poi } from "../../../data/system/poiGenerators/act1_poi.js";
import { PoiRuntimeOrbit } from "../../../gameplay/poi/poiRuntimeOrbit.js";
import { spawnSystemActors } from "../../../gameplay/spawn/spawnSystem.js";
import { getSpawnAlertLevelFromQuests } from "../../../gameplay/story/actRules.js";
import { KNOWN_EVENT_IDS } from "../../../data/content/events_router.js";
import { sanitizeAndValidatePoiDef } from "../../../data/content/validation.js";

export class BootstrapSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  enter(systemId) {
    const galaxy = this.s.get("galaxy");
    const state = this.s.get("state");

    const sid = String(systemId);
    this.ctx.systemId = sid;

    // ✅ было: galaxy.systems[systemId]
    const sys = galaxy.getSystem?.(sid) ?? null;

    if (!sys) {
      console.error("[BootstrapSystem] system not found:", sid);
      // чтобы не падало — выходим мягко
      return;
    }

    const devGen = state.devGenerator?.[sid] ?? null;
    const systemSeed = Number.isFinite(devGen?.seed) ? devGen.seed : galaxy.seed;
    this.ctx.system = createStarSystem(systemSeed, sys.id, {
      randomizeStar: devGen?.randomizeStar,
      randomizePlanets: devGen?.randomizePlanets,
      randomCountRange: devGen?.randomCountRange,
      devPreset: devGen?.devPreset ?? null,
    });

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

    // POI (act1)
    // ✅ тут тоже передаём systemId строкой, без sys.id если sys нет
    const sysIdForPoi = sys?.id ?? sid;
    const rawPoiDef = createAct1Poi(galaxy.seed, sysIdForPoi, this.ctx.system);
    const { poiDef, warnings } = sanitizeAndValidatePoiDef(rawPoiDef, KNOWN_EVENT_IDS);
    this.ctx.poiDef = poiDef;
    this.ctx.poi = new PoiRuntimeOrbit({
      poiDef: this.ctx.poiDef,
      resolvePos: (poi) => this.ctx.resolvePoiPos(poi),
    });
    if (warnings.length) {
      console.warn(`[BootstrapSystem] POI validation warnings for '${sid}':\n${warnings.map((w) => ` - ${w}`).join("\n")}`);
    }

    this.ctx.poiHint = "";
    this.ctx.poiFocus = null;

    // reset ship runtime
    const ship = state.playerShip;
    if (ship?.runtime) {
      const R = this.ctx.boundsRadius * 0.88;
      ship.runtime.x = R;
      ship.runtime.z = -R * 0.35;

      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = Math.PI * 0.65;
      ship.runtime.targetX = null;
      ship.runtime.targetZ = null;
    }
    // spawn NPC
    const activeQuestDefs = Object.keys(this.ctx.quest?.active ?? {}).map((qid) => this.ctx.content?.questsById?.[qid]).filter(Boolean);
    const spawned = spawnSystemActors({
      galaxySeed: galaxy.seed,
      systemId: sid,
      playerFactionId: state.player?.factionId ?? "union",
      spawnAlertLevel: getSpawnAlertLevelFromQuests(activeQuestDefs),
      actId: this.ctx.act?.current ?? "act1",
    });

    state.characters = spawned.characters;
    state.ships = [state.playerShip, ...spawned.ships].filter(Boolean);

    state.ships.forEach((ship) => {
      if (!ship || ship === state.playerShip) return;

      ship.talkType = ship.factionId === "pirates" ? "enemy" : "npc";
      ship.talkRadius = 280;
      ship.dialogShown = false;
      ship.nextAutoDialogAt = 0;
    });
    this.ctx.spawnPoints = spawned.spawnPoints;

    // init ship stats
    const r = state.playerShip?.runtime;
    const stats = state.playerShip?.stats;
    if (r && stats) {
      // ✅ armor/shield
      r.armorMax = Math.round(stats.armor ?? stats.hull ?? 0);
      r.armor = r.armor ?? r.armorMax;

      r.shieldMax = Math.round(stats.shields ?? 0);
      r.shield = r.shield ?? r.shieldMax;

      r.energyMax = Math.round(stats.energy);
      r.energy = r.energy ?? r.energyMax;

      r.maxSpeed = 260 * (stats.speed ?? 1.0);
    }

    // quest line last log (без падений)
    this.ctx.lastLog =
      this.ctx.quest?.log?.at?.(-1)?.text ?? this.ctx.lastLog ?? "";

    // story hook
    this.ctx.story?.onSystemEnter?.({ systemId: sid, ctx: this.ctx });
  }
}

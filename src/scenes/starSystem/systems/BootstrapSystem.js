// scenes/starSystem/systems/BootstrapSystem.js
import { System } from "../../../engine/core/lifecycle.js";
import { createStarSystem } from "../../../data/starSystem.js";
import { createAct1Poi } from "../../../data/system/poiGenerators/act1_poi.js";
import { PoiRuntimeOrbit } from "../../../gameplay/poi/poiRuntimeOrbit.js";
import { spawnSystemActors } from "../../../gameplay/spawn/spawnSystem.js";
import { getSpawnAlertLevelFromQuests } from "../../../gameplay/story/actRules.js";
import { KNOWN_EVENT_IDS } from "../../../data/content/events_router.js";
import { sanitizeAndValidatePoiDef } from "../../../data/content/validation.js";
import { PersistentNpcManager } from "../../../data/npc/persistent.js";

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

    // ПОИ (act1)
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
    
    // ✅ ДОБАВЛЕНО: сброс currentTarget при смене системы
    // Это предотвращает ошибки, если автобой пытался атаковать цель из предыдущей системы
    if (this.ctx.autoCombat) {
      this.ctx.autoCombat.currentTarget = null;
    }

    // ===== МЕНЕДЖЕР NPC С ВОССТАНОВЛЕНИЕМ ИЗ SAVE =====
    // Инициализация менеджера постоянных NPC
    if (!state.persistentNpcManager) {
      state.persistentNpcManager = new PersistentNpcManager();
      
      // 🚨 КРИТИЧЕСКОЕ ДОБАВЛЕНИЕ: Восстановление persistent NPC из сохранения
      // applySaveToState (src/data/save.js) положил сохранённые данные в state.persistentNpcData.
      // Здесь мы восстанавливаем их обратно в менеджер и удаляем временное поле.
      // Без этого шага при перезагрузке игры persistent NPC (квестодатели, торговцы)
      // терялись, потому что менеджер создавался пустым, а триггер t:act1:start_main_on_sys0
      // не срабатывал повторно (квест уже активен из сохранения).
      //
      // Порядок критически важен:
      // 1. Создаём пустой менеджер
      // 2. Десериализуем сохранённых NPC (если они есть в save)
      // 3. Вызываем story.onSystemEnter (может добавить новых persistent NPC для новой игры)
      // 4. spawnSystemActors находит всех persistent NPC через getForSystem()
      if (state.persistentNpcData) {
        try {
          state.persistentNpcManager.deserialize(state.persistentNpcData);
          console.log(`[BootstrapSystem] Restored ${state.persistentNpcManager.getAll().length} persistent NPCs from save`);
        } catch (e) {
          console.error("[BootstrapSystem] Failed to deserialize persistent NPC data:", e);
        }
        // Удаляем временное поле — оно нужно только для передачи данных из save в BootstrapSystem
        // После восстановления данные хранятся в самом менеджере
        delete state.persistentNpcData;
      }
    }

    // ===== 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ПОРЯДКА =====
    // СНАЧАЛА вызываем story.onSystemEnter (триггеры), ПОТОМ спавним NPC.
    //
    // Причина: в ACT1_TRIGGERS.onSystemEnter регистрируются persistent NPC
    // (questGiver и merchant) через persistentNpcManager.register().
    // Если спавн произойдёт ДО триггеров — менеджер будет пуст, и NPC не появятся.
    // Раньше здесь был обратный порядок: спавн → story hook,
    // из-за чего в логах было "Spawned 0 NPC ships" при первом входе в систему.
    //
    // Теперь порядок правильный:
    // 1. Триггеры акта регистрируют persistent NPC в менеджере
    //    (для новой игры — создают с нуля, для загрузки — восстанавливают недостающих)
    // 2. spawnSystemActors находит их через getForSystem(systemId)
    // 3. Также генерируются временные NPC (pirates/merchants)
    this.ctx.story?.onSystemEnter?.({ systemId: sid, ctx: this.ctx });

    // spawn NPC
    const activeQuestDefs = Object.keys(this.ctx.quest?.active ?? {}).map((qid) => this.ctx.content?.questsById?.[qid]).filter(Boolean);
    const spawned = spawnSystemActors({
      galaxySeed: galaxy.seed,
      systemId: sid,
      playerFactionId: state.player?.factionId ?? "union",
      spawnAlertLevel: getSpawnAlertLevelFromQuests(activeQuestDefs),
      actId: this.ctx.act?.current ?? "act1",
      persistentNpcManager: state.persistentNpcManager,
    });

    // ===== ДИАГНОСТИКА СПАВНА (можно удалить после отладки) =====
    console.group("[BootstrapSystem] Post-spawn NPC diagnostics");
    console.log(`Spawned ${spawned.ships.length} NPC ships`);
    console.log(`Persistent manager has ${state.persistentNpcManager.getAll().length} total NPCs`);
    for (const npc of spawned.ships) {
      console.log(`  NPC id="${npc?.id}" name="${npc?.name}" alive=${npc?.alive} persistent=${npc?.persistent ?? false} runtime.dead=${npc?.runtime?.dead} hasRuntime=${!!npc?.runtime}`, {
        id: npc?.id,
        factionId: npc?.factionId,
        stats: npc?.stats,
        runtimeKeys: npc?.runtime ? Object.keys(npc.runtime) : "NO RUNTIME",
      });
    }
    // Проверяем дубликаты id
    const ids = spawned.ships.map(s => s?.id).filter(Boolean);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error(`  🚨 DUPLICATE IDs DETECTED! ${ids.length} ships but only ${uniqueIds.size} unique ids`);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      console.error(`  Duplicates:`, dupes);
    }
    console.groupEnd();
    // ===== КОНЕЦ ДИАГНОСТИКИ =====

    state.characters = spawned.characters;
    state.ships = [state.playerShip, ...spawned.ships].filter(Boolean);

    state.ships.forEach((ship) => {
      if (!ship || ship === state.playerShip) return;

      ship.talkType = ship.factionId === "pirates" ? "enemy" : "npc";
      ship.talkRadius = 280;
      ship.dialogShown = false;
      ship.nextAutoDialogAt = 0;

      // ===== 🚨 ИСПРАВЛЕНО: Инициализация недостающих полей runtime для NPC =====
      // spawnSystemActors создаёт runtime только с x, z, vx, vz, yaw.
      // Без этих полей NPCStatusWidget показывает 0/100, а EnemyAISystem может
      // некорректно обрабатывать корабль (например, runtime.dead === undefined).
      // Это главная причина, по которой NPC "пропадают" — они либо удаляются
      // фильтром aliveShips, либо не отображаются из-за некорректных статов.
      if (ship.runtime) {
        // y координата (высота) — нужна для корректной проекции на экран
        if (ship.runtime.y === undefined) {
          ship.runtime.y = 0;
        }

        // alive флаг — если генератор NPC не установил его, считаем живым
        if (ship.alive === undefined) {
          ship.alive = true;
        }

        // dead флаг — гарантируем, что runtime.dead явно false для живых NPC
        if (ship.runtime.dead === undefined) {
          ship.runtime.dead = false;
        }

        // HP (armor) — берём из stats, если есть, иначе дефолт 100
        const npcStats = ship.stats ?? {};
        if (ship.runtime.armorMax === undefined) {
          ship.runtime.armorMax = Math.round(npcStats.hull ?? npcStats.armor ?? 100);
        }
        if (ship.runtime.armor === undefined) {
          ship.runtime.armor = ship.runtime.armorMax;
        }

        // Щиты — берём из stats, если есть, иначе дефолт 0
        if (ship.runtime.shieldMax === undefined) {
          ship.runtime.shieldMax = Math.round(npcStats.shields ?? 0);
        }
        if (ship.runtime.shield === undefined) {
          ship.runtime.shield = ship.runtime.shieldMax;
        }

        // Энергия — берём из stats, если есть
        if (ship.runtime.energyMax === undefined) {
          ship.runtime.energyMax = Math.round(npcStats.energy ?? 0);
        }
        if (ship.runtime.energy === undefined) {
          ship.runtime.energy = ship.runtime.energyMax;
        }

        // Движение — если генератор не задал, ставим дефолты
        if (ship.runtime.accel === undefined) {
          ship.runtime.accel = npcStats.accel ?? 150;
        }
        if (ship.runtime.turnSpeed === undefined) {
          ship.runtime.turnSpeed = npcStats.turnSpeed ?? 2.0;
        }
        if (ship.runtime.maxSpeed === undefined) {
          ship.runtime.maxSpeed = 260 * (npcStats.speed ?? 1.0);
        }
      }

      // Гарантируем наличие уникального id
      if (!ship.id) {
        ship.id = `npc_${Math.random().toString(36).slice(2, 10)}`;
        console.warn(`[BootstrapSystem] NPC without id — generated: ${ship.id}`, ship);
      }
      // ===== КОНЕЦ ИНИЦИАЛИЗАЦИИ NPC =====
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
      
      // ✅ ДОБАВЛЕНО: инициализация accel и turnSpeed
      // Эти поля используются в shipMovement.js и autoCombat.js для расчёта движения и поворотов.
      // Если они не инициализированы, расчёты могут возвращать NaN или undefined,
      // что приводит к хаотичному поведению корабля.
      r.accel = stats.accel ?? 180;      // Ускорение корабля (единиц/сек²)
      r.turnSpeed = stats.turnSpeed ?? 2.5; // Скорость поворота (рад/сек)
    }

    // quest line last log (без падений)
    this.ctx.lastLog =
      this.ctx.quest?.log?.at?.(-1)?.text ?? this.ctx.lastLog ?? "";
  }
}
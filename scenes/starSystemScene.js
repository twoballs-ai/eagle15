import { createStarSystem } from "../data/starSystem.js";
import { stepShipMovement } from "../gameplay/shipMovement.js";
import { raycastToGround } from "../gameplay/cameraRay.js";
import {
  getShipControls,
  getAutopilotControls,
} from "../gameplay/shipController.js";
import { EngineFlame } from "../engine/renderer/engineFlame.js";
import { QuestState } from "../gameplay/quest/questState.js";
import { createAct1Poi } from "../data/system/act1PoiFromSystem.js";
import { PoiRuntimeOrbit } from "../gameplay/poi/poiRuntimeOrbit.js";
import { runAct1Event } from "../gameplay/quest/eventsAct1.js";
import { HudOverlay } from "../ui/hudOverlay.js";
import { ShipStatsHUD } from "../ui/shipStatsHud.js";
import { spawnSystemActors } from "../gameplay/spawn/spawnSystem.js";
import { RelationIconsOverlay } from "../ui/relationIconsOverlay.js";
import { projectWorldToScreen } from "../gameplay/math/project.js";
import { getFactionRelation } from "../data/faction/factionRelationsUtil.js";
import { getBasis } from "../assets/modelBasis.js";
import { createEnemyFireSystem } from "../gameplay/combat/enemyFire.js";
import {
  createColliderSystem,
  clearColliders,
  addCollider,
  circleOverlap,
  circlePenetration,
} from "../gameplay/collisions/colliders.js";
import {
  createProjectileSystem,
  tryFire,
  stepProjectiles,
  applyProjectileHits,
  buildTracersXYZ
} from "../gameplay/weapons/projectiles.js";
export class StarSystemScene {
  constructor(game) {
    this.game = game;
    this.name = "Star System";
    this.flame = new EngineFlame(game.gl, { max: 2000 });
    this.system = null;
    this.time = 0;
    this.quest = new QuestState();
    this.poiDef = null; // список POI (данные)
    this.poi = null; // runtime
    this.poiFocus = null; // текущий фокус (для UI)
    this.poiHint = "";
    this.relIcons = new RelationIconsOverlay({ canvas: this.game.canvas });
    this.enemyFire = createEnemyFireSystem({
  range: 520,
  fireRate: 1.2,
  damage: 18,
  fireArcCos: 0.25, // шире/уже сектор
  jitter: 0.02,
});
    // строки для простого UI (пока хоть console.log)
    this.questLine = "";
    this.lastLog = "";
    this.hud = null;
    this._hudTimer = 0;
    this.shipHud = null;
    this._shipHudT = 0;
    this.colliders = createColliderSystem();

    this.projectiles = createProjectileSystem({
  bulletSpeed: 1100,
  bulletLife: 1.1,
  fireCooldown: 0.09,
  muzzleAhead: 16,
  damage: 14,
  hitRadius: 6,
  spread: 0.01, // чуть-чуть
});
    // main 3D camera
    this.cam3d = {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 5000, // базовое, переопределим в enter()
    };
    // follow/orbit camera tuning
    this.followCam = {
      distance: 340, // расстояние до корабля
      height: 220, // базовая высота (можно крутить)
      yawOffset: 0.0, // поворот вокруг корабля (в радианах)
      pitch: -0.55, // наклон вниз (отрицательный = смотрим вниз)
      targetAhead: 40, // насколько target уходит вперед по направлению корабля
      targetLift: 0, // можно приподнять target над плоскостью
      smooth: 12.0, // сглаживание камеры (больше = быстрее догоняет)
      minHeight: 40,
      maxHeight: 900,
      minDistance: 120,
      maxDistance: 1200,
      minPitch: -1.35, // почти сверху
      maxPitch: -0.15, // почти горизонтально
    };
    // базовое, переопределим в enter()
    this.boundsRadius = 1200;

    // minimap settings
    this.minimap = {
      sizeCSS: 200,
      padCSS: 12,
      height: 900, // высота камеры сверху
      radius: 1200, // можешь удалить позже, если не используешь
    };
  }

  enter(systemId) {
    const { galaxy } = this.game;
    const sys = galaxy.systems[systemId];

    this.system = createStarSystem(galaxy.seed, sys.id);
    this.time = 0;
    this.poiDef = createAct1Poi(this.game.galaxy.seed, sys.id, this.system);
    this.poi = new PoiRuntimeOrbit({
      poiDef: this.poiDef,
      resolvePos: (poi) => this.getPoiWorldPos(poi),
    });

    this.poiHint = "";
    this.poiFocus = null;
    // debug: проверим, что POI создались
    console.log("POI DEF:", this.poiDef);

    // ✅ boundsRadius по размеру системы
    const planets = this.system?.planets || [];
    let maxOrbit = 0;
    for (const p of planets) maxOrbit = Math.max(maxOrbit, p.orbitRadius || 0);

    // запас: 25% за последней планетой
    this.boundsRadius = Math.max(1200, maxOrbit * 1.25);

    // ✅ чтобы дальние объекты не резались камерой
    this.cam3d.far = Math.max(5000, this.boundsRadius * 2.5);

    // reset camera
    this.cam3d.eye = [0, 220, 340];
    this.cam3d.target = [0, 0, 0];

    // reset ship
    const ship = this.game.state.playerShip;
    if (ship?.runtime) {
      ship.runtime.x = 0;
      ship.runtime.z = 0;
      ship.runtime.vx = 0;
      ship.runtime.vz = 0;
      ship.runtime.yaw = 0;
      ship.runtime.targetX = null;
      ship.runtime.targetZ = null;
    }
    // ✅ Спавним NPC/врагов детерминированно
    const spawned = spawnSystemActors({
      galaxySeed: this.game.galaxy.seed,
      systemId,
      playerFactionId: this.game.state.player?.factionId ?? "union",
    });

    // сохраняем в state (и/или в сцене)
    this.game.state.characters = spawned.characters;
    this.game.state.ships = [this.game.state.playerShip, ...spawned.ships];

    // если хочешь дебажить точки
    this.spawnPoints = spawned.spawnPoints;

    const r = this.game.state.playerShip?.runtime;
    const stats = this.game.state.playerShip?.stats;

    if (r && stats) {
      // hull/shields/energy из stats
      r.hpMax = Math.round(stats.hull);
      r.hp = r.hp ?? r.hpMax;

      r.shieldMax = Math.round(stats.shields);
      r.shield = r.shield ?? r.shieldMax;

      r.energyMax = Math.round(stats.energy);
      r.energy = r.energy ?? r.energyMax;

      // speed модификатор
      r.maxSpeed = 260 * (stats.speed ?? 1.0);
    }
    if (!this.shipHud) this.shipHud = new ShipStatsHUD();
    this.shipHud.update(this.game.state.playerShip?.runtime);
    this.quest.addLog(
      "Выход из прыжка: корабль повреждён. Нужно восстановить системы и покинуть систему."
    );
    this.lastLog = this.quest.log.at(-1)?.text ?? "";
    this.updateQuestLine();
    if (!this.hud) {
      this.hud = new HudOverlay({ anchor: "bottom-left" });
    }
    // reset follow cam
    this.followCam.distance = 340;
    this.followCam.height = 220;
    this.followCam.yawOffset = 0.0;
    this.followCam.pitch = -0.55;
    // сразу обновим текст
    this.updateHudText(true);
    // временно: чтобы видеть, что работает
    console.log(this.questLine);
    console.log("LOG:", this.lastLog);
  }

  update(dt) {
    this.time += dt;
    this.updatePlayerShip(dt);
    this.updateEnemies(dt);
    this.enemyFire.update(dt, this.game.state.ships, this.game.state.playerShip);
      this.buildColliders();     
    this.debugPoiOncePerSecond(dt);
    this.updatePoiAndQuests(dt);
    this.updateHudText(false, dt);
    this.updateCameraInput(dt);
    // ---- PROJECTILES ----
      this.stepProjectilesAndHits(dt);
  this.resolveShipCollisions(dt);
stepProjectiles(this.projectiles, dt, this.boundsRadius);
applyProjectileHits(this.projectiles, this.game.state.ships || []);
  }
 updateCameraInput(dt) {
    const input = this.game.input;
    const c = this.followCam;

    // 1) Колёсико: зум (distance)
    // ВАЖНО: ниже два варианта. Выбери тот, который у тебя есть в Input.
    // Вариант A: input.getWheelDelta?.()
    const wheel = input.getWheelDelta ? input.getWheelDelta() : 0;

    // Вариант B: если у тебя wheel хранится в input.getMouse()
    // const m = input.getMouse();
    // const wheel = m.wheelDelta ?? 0;

    if (wheel) {
      c.distance = clamp(c.distance * (1 + wheel * -0.0015), c.minDistance, c.maxDistance);
    }

    // 2) Высота: Q/E
    if (input.isKeyDown("KeyQ")) c.height -= 220 * dt;
    if (input.isKeyDown("KeyE")) c.height += 220 * dt;
    c.height = clamp(c.height, c.minHeight, c.maxHeight);

    // 3) Вращение вокруг корабля: Z/C (yawOffset)
    if (input.isKeyDown("KeyZ")) c.yawOffset -= 1.6 * dt;
    if (input.isKeyDown("KeyC")) c.yawOffset += 1.6 * dt;

    // 4) Наклон (pitch): R/F
    if (input.isKeyDown("KeyR")) c.pitch -= 1.2 * dt; // сильнее вниз
    if (input.isKeyDown("KeyF")) c.pitch += 1.2 * dt; // ближе к горизонту
    c.pitch = clamp(c.pitch, c.minPitch, c.maxPitch);

    // (опционально) быстрый сброс
    if (this.game.actions?.take?.("camReset")) {
      c.distance = 340;
      c.height = 220;
      c.yawOffset = 0;
      c.pitch = -0.55;
    }
  }
  resolveShipCollisions(dt) {
  const ship = this.game.state.playerShip;
  if (!ship?.runtime) return;
  if (ship.alive === false) return;

  const r = ship.runtime;
  const myR = (r.radius ?? 6);

  // толкаем корабль из пересечений
  for (const c of this.colliders.list) {
    if (c.alive === false) continue;
    if (c.id === ship.id) continue;

    // хочешь — сталкиваться только с obstacles/ships:
    if (c.kind !== "ship" && c.kind !== "obstacle" && c.kind !== "poi") continue;

    const pen = circlePenetration(r.x, r.z, myR, c.x, c.z, c.r);
    if (!pen) continue;

    // 1) выталкиваем
    r.x += pen.nx * pen.pen;
    r.z += pen.nz * pen.pen;

    // 2) гасим скорость в сторону столкновения (убирает “влипание”)
    const vn = r.vx * pen.nx + r.vz * pen.nz;
    if (vn < 0) {
      r.vx -= pen.nx * vn * 1.2;
      r.vz -= pen.nz * vn * 1.2;
    }
  }
}

stepProjectilesAndHits(dt) {
  if (!this.projectiles) return;

  // движение пуль
  // (если у тебя stepProjectiles(system, dt, boundsRadius) — оставь как есть)
  // stepProjectiles(this.projectiles, dt, this.boundsRadius);

  // попадания: projectile vs colliders
  const bullets = this.projectiles.list;
  const hitR = this.projectiles.hitRadius ?? 6;
  const dmg = this.projectiles.damage ?? 10;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    for (const c of this.colliders.list) {
      if (c.alive === false) continue;
      if (c.kind !== "ship") continue;
      if (c.id === b.ownerId) continue; // не бить владельца

      if (circleOverlap(b.x, b.z, hitR, c.x, c.z, c.r)) {
        const ship = c.ref;
        if (ship?.runtime) {
          ship.runtime.hp = (ship.runtime.hp ?? 100) - dmg;
          if (ship.runtime.hp <= 0) {
            ship.runtime.hp = 0;
            ship.alive = false;
          }
        }
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

  updateHudText(force = false, dt = 0) {
    if (!this.hud) return;

    // обновляем 10 раз в секунду, чтобы не дергать DOM каждый кадр
    this._hudTimer += dt;
    if (!force && this._hudTimer < 0.1) return;
    this._hudTimer = 0;

    // Доп. инфо: расстояние до фокуса (приятно и полезно)
    let focusLine = "";
    const shipR = this.game.state.playerShip?.runtime;
    const focus = this.poiFocus; // из шага 3
    if (shipR && focus) {
      const dx = (focus.worldX ?? 0) - shipR.x;
      const dz = (focus.worldZ ?? 0) - shipR.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      focusLine = `\nДистанция: ${dist.toFixed(0)}m`;
    }

    const text =
      `АКТ 1\n` +
      `${this.questLine || ""}\n\n` +
      `Рядом: ${this.poiHint || "—"}` +
      focusLine +
      `\n\n` +
      `Событие: ${this.lastLog || "—"}`;

    this.hud.setText(text);
  }
  updatePoiAndQuests(dt) {
    const shipR = this.game.state.playerShip?.runtime;
    if (!shipR || !this.poiDef || !this.poi) return;
    // ✅ DEV: Reset (R)
    if (this.game.actions.take("reset")) {
      // сброс квеста
      this.quest.reset();
      this.quest.addLog("Квест сброшен (dev).");
      this.lastLog = this.quest.log.at(-1)?.text ?? "";
      this.updateQuestLine();

      // ✅ важно: сбросить runtime POI, иначе entered/visited состояния могут остаться
      this.poi = new PoiRuntimeOrbit({
        poiDef: this.poiDef,
        resolvePos: (poi) => this.getPoiWorldPos(poi),
      });

      // сброс UI подсказок
      this.poiFocus = null;
      this.poiHint = "";
    }

    const { entered, focus } = this.poi.update(shipR);

    // 1) ENTER: событие по входу (один раз на POI)
    for (const p of entered) {
      if (!this.quest.isVisited(p.id)) {
        this.quest.markVisited(p.id);

        if (p.onEnter) {
          runAct1Event(p.onEnter, { quest: this.quest, shipRuntime: shipR });
          this.lastLog = this.quest.log.at(-1)?.text ?? "";
          this.updateQuestLine();
          // для отладки
          console.log("EVENT:", p.onEnter, "LOG:", this.lastLog);
        }
      }
    }

    // 2) FOCUS: подсказка рядом с объектом
    this.poiFocus = focus ?? null;
    this.poiHint = "";

    if (focus) {
      if (focus.id === "poi_beacon") {
        this.poiHint = this.quest.hasFlag("beacon_enabled")
          ? "E: активировать маяк"
          : "Маяк заблокирован (нужно починить корабль)";
      } else {
        this.poiHint = focus.name;
      }
    }

    if (this.game.actions.take("interact")) {
      this.tryInteractFocusedPoi();
    }
  }
  updateEnemies(dt) {
    const player = this.game.state.playerShip?.runtime;
    if (!player) return;

    const ships = this.game.state.ships || [];
    for (const ship of ships) {
      if (ship === this.game.state.playerShip) continue;
      if (!ship?.runtime) continue;

      // ✅ считаем врагом по флагу или по фракции
      const isEnemy = ship.isEnemy || ship.factionId === "pirates";
      if (!isEnemy) continue;

      const r = ship.runtime;

      // --- простейшее преследование ---
      const dx = player.x - r.x;
      const dz = player.z - r.z;
      const dist = Math.hypot(dx, dz);

      // если далеко — просто дрейф
      if (dist > 1200) {
        r.vx *= 0.98;
        r.vz *= 0.98;
        continue;
      }

      // направление
      const nx = dx / (dist || 1);
      const nz = dz / (dist || 1);

      // yaw чтобы "смотрел" на игрока
      r.yaw = Math.atan2(dx, -dz);

      // скорость
      const speed = dist > 180 ? 120 : 0; // подлетел — остановился
      r.vx = nx * speed;
      r.vz = nz * speed;

      // интеграция (перемещение)
      r.x += r.vx * dt;
      r.z += r.vz * dt;
    }
  }
  tryInteractFocusedPoi() {
    const focus = this.poiFocus;
    if (!focus) return;

    if (focus.id === "poi_beacon") {
      if (this.quest.hasFlag("beacon_enabled")) {
        this.quest.activateBeacon();
        this.lastLog = this.quest.log.at(-1)?.text ?? "";
        this.updateQuestLine();

        console.log("BEACON ACTIVATED:", this.lastLog);

        // TODO: переход на карту/следующую систему
        // например:
        // this.game.setScene("GalaxyMap");
        // или this.game.scenes.setActive("GalaxyMap")
      } else {
        this.quest.addLog("Маяк не активируется: корабль ещё не готов.");
        this.lastLog = this.quest.log.at(-1)?.text ?? "";
        console.log("BEACON BLOCKED:", this.lastLog);
      }
    }
  }
  updatePlayerShip(dt) {
    const { input, state, getView } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;
    const view = getView();
// ---- FIRE ----
// ЛКМ или Space
const wantFire =

  this.game.input.isKeyDown?.("Space")
  false;

tryFire(this.projectiles, r, ship.id, dt, wantFire);
    // ЛКМ ставит цель
    if (input.isMousePressed("left")) {
      const m = input.getMouse();
      const hit = raycastToGround(m.x, m.y, view.w, view.h, this.cam3d);
      if (hit) {
        r.targetX = hit.x;
        r.targetZ = hit.z;
      }
    }

    const manualControls = getShipControls(input);
    // ✅ если игрок даёт ручной ввод — отключаем автопилот
    if (manualControls.manual) {
      r.targetX = null;
      r.targetZ = null;
    }
    const autoControls = manualControls.manual ? null : getAutopilotControls(r);
    const controls = autoControls ?? manualControls;

    const { fx, fz } = stepShipMovement(r, controls, dt, {
      boundsRadius: this.boundsRadius,
    });
    // --- Engine flame ---
    const pos = [r.x, 0, r.z];

    // forward dir из ship movement (у тебя уже есть!)
    const dir = [fx, 0, fz];

    // throttle 0..1 (берём из runtime если есть, иначе 1)
    const throttle = Math.max(0, Math.min(1, r.throttleValue ?? 1.0));

    this.flame.update(dt, pos, dir, throttle);
    // камера за кораблём
  // ---- Follow / Orbit Camera (привязка к точке, не к модели) ----
    const c = this.followCam;

    // anchor = точка корабля
    const ax = r.x;
    const az = r.z;

    // направление "за кораблём" с учётом yawOffset камеры
    const yaw = r.yaw + c.yawOffset;

    // forward (куда смотрит корабль)
    const fwdX = Math.sin(r.yaw);
    const fwdZ = -Math.cos(r.yaw);

    // target: чуть впереди корабля (и можно приподнять)
    const tx = ax + fwdX * c.targetAhead;
    const ty = c.targetLift;
    const tz = az + fwdZ * c.targetAhead;

    // eye: сфера вокруг target (yaw + pitch + distance) + отдельная высота
    // базовая орбита
    const cosP = Math.cos(c.pitch);
    const sinP = Math.sin(c.pitch);

    const backX = Math.sin(yaw) * (c.distance * cosP);
    const backZ = -Math.cos(yaw) * (c.distance * cosP);

    const ex = tx - backX;
    const ez = tz - backZ;

    // высота = базовая высота + орбитальная компонента pitch
    const ey = c.height + (-sinP) * c.distance;

    // сглаживание (чтобы не дёргалось)
    const k = 1 - Math.exp(-c.smooth * dt);

    this.cam3d.target[0] = lerp(this.cam3d.target[0], tx, k);
    this.cam3d.target[1] = lerp(this.cam3d.target[1], ty, k);
    this.cam3d.target[2] = lerp(this.cam3d.target[2], tz, k);

    this.cam3d.eye[0] = lerp(this.cam3d.eye[0], ex, k);
    this.cam3d.eye[1] = lerp(this.cam3d.eye[1], ey, k);
    this.cam3d.eye[2] = lerp(this.cam3d.eye[2], ez, k);
    // --- стабилизация up, чтобы не было roll-флипов ---
const ex0 = this.cam3d.eye[0], ey0 = this.cam3d.eye[1], ez0 = this.cam3d.eye[2];
const tx0 = this.cam3d.target[0], ty0 = this.cam3d.target[1], tz0 = this.cam3d.target[2];

// forward = normalize(target - eye)
let fx0 = tx0 - ex0;
let fy0 = ty0 - ey0;
let fz0 = tz0 - ez0;
const fl = Math.hypot(fx0, fy0, fz0) || 1;
fx0 /= fl; fy0 /= fl; fz0 /= fl;

// worldUp
const wux = 0, wuy = 1, wuz = 0;

// right = normalize(cross(worldUp, forward))
let rx0 = wuy * fz0 - wuz * fy0;
let ry0 = wuz * fx0 - wux * fz0;
let rz0 = wux * fy0 - wuy * fx0;
let rl = Math.hypot(rx0, ry0, rz0);

// если почти параллельно worldUp — подстрахуемся (редкий случай)
if (rl < 1e-6) {
  // берем другой "вверх" временно
  const awx = 0, awy = 0, awz = 1;
  rx0 = awy * fz0 - awz * fy0;
  ry0 = awz * fx0 - awx * fz0;
  rz0 = awx * fy0 - awy * fx0;
  rl = Math.hypot(rx0, ry0, rz0) || 1;
}

rx0 /= rl; ry0 /= rl; rz0 /= rl;

// up = cross(forward, right)
const ux0 = fy0 * rz0 - fz0 * ry0;
const uy0 = fz0 * rx0 - fx0 * rz0;
const uz0 = fx0 * ry0 - fy0 * rx0;

this.cam3d.up[0] = ux0;
this.cam3d.up[1] = uy0;
this.cam3d.up[2] = uz0;
  }
buildColliders() {
  clearColliders(this.colliders);

  // --- SHIPS ---
  const ships = this.game.state.ships || [];
  for (const s of ships) {
    if (!s?.runtime) continue;
    if (s.alive === false) continue;

    addCollider(this.colliders, {
      id: s.id,
      kind: "ship",
      x: s.runtime.x,
      z: s.runtime.z,
      r: (s.runtime.radius ?? 6), // твой runtime.radius
      alive: true,
      ref: s,
    });
  }

  // --- POI как препятствия (если хочешь) ---
  // Например маяк/станция/астероид:
  // if (this.poiDef) for (const p of this.poiDef) { ... addCollider(...) }
}

  render() {
    const { gl, r3d, getView } = this.game;
    const view = getView();

    // ---- MAIN PASS ----
    gl.viewport(0, 0, view.w, view.h);
    gl.clearColor(0.02, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const dpr = this.game.runtime?.dpr ?? 1;

    const ship = this.game.state.playerShip?.runtime;
    const k = 0.002; // сила параллакса (тюнится)
    const px = ship ? -ship.x * k : 0;
    const pz = ship ? -ship.z * k : 0;

    r3d.drawBackground(view, this.cam3d, dpr, px, pz);

    r3d.begin(view, this.cam3d);
    this.drawProjectiles3D(r3d);
    this.drawSystem3D(r3d);
    this.drawPoiDebug3D(r3d);
    this.drawSpawnPointsDebug3D?.(r3d);
    this.drawPlayerShip3D(r3d);
    this.drawOtherShips3D(r3d);
    this.flame.draw(r3d.getVP(), dpr);
    const lines = this.enemyFire.getTracerLinesY(1.2);
if (lines.length >= 6) {
  // красноватый/оранжевый трассер
  r3d.drawLines(lines, [1.0, 0.35, 0.15, 0.9]);
}
    this.drawAutopilotDebug3D(r3d);
    this.updateRelationIcons(view, r3d.getVP());
  }
  drawProjectiles3D(r3d) {
  if (!this.projectiles) return;
  const pts = buildTracersXYZ(this.projectiles, 1.2, 0.03);
  if (pts.length < 6) return;

  // яркие линии
  r3d.drawLines(pts, [1.0, 0.35, 0.15, 0.95]);
}
drawOtherShips3D(r3d) {
  const ships = this.game.state.ships || [];
  const shipModel = this.game.assets?.models?.ship;
  if (!shipModel) return;

  const b = getBasis("ship");

  for (const ship of ships) {
    if (ship === this.game.state.playerShip) continue;
    if (!ship?.runtime) continue;

    const r = ship.runtime;

    r3d.drawModel(shipModel, {
      position: [r.x, 0, r.z],
      scale: [1, 1, 1],
      rotationY: r.yaw,
      basisX: b.x,
      basisY: b.y,
      basisZ: b.z,
      ambient: 0.8,
      emissive: (ship.isEnemy || ship.factionId === "pirates") ? 0.3 : 0.0,
    });
  }
}


  drawSpawnPointsDebug3D(r3d) {
    if (!this.spawnPoints) return;
    for (const p of this.spawnPoints) {
      const col =
        p.type === "pirate"
          ? [1, 0.2, 0.2, 0.7]
          : p.type === "trader"
          ? [0.2, 1, 0.2, 0.7]
          : [0.8, 0.8, 1.0, 0.7];

      r3d.drawCrossAt(p.x, 0.8, p.z, 12, col);
      r3d.drawCircleAt(p.x, 0.8, p.z, 22, 32, [col[0], col[1], col[2], 0.25]);
    }
  }
  drawPoiMinimap(r3d) {
    if (!this.poiDef) return;

    for (const poi of this.poiDef) {
      const pos = this.getPoiWorldPos(poi);
      if (!pos) continue;

      const isFocus = this.poiFocus && this.poiFocus.id === poi.id;

      const y = 0.8;
      const size = isFocus ? 14 : 10;
      const col = isFocus ? [0.2, 0.9, 1.0, 1.0] : [1.0, 0.85, 0.25, 1.0];

      // компактный крест
      r3d.drawCrossAt(pos.x, y, pos.z, size, col);

      // маленький круг-иконка
      r3d.drawCircleAt(pos.x, y, pos.z, 12, 40, [col[0], col[1], col[2], 0.35]);
    }
  }

  drawPoiDebug3D(r3d) {
    if (!this.poiDef) return;

    for (const poi of this.poiDef) {
      const pos = this.getPoiWorldPos(poi);
      if (!pos) continue;

      const y = 0.65;
      // крест
      r3d.drawCrossAt(pos.x, y, pos.z, 10, [1.0, 0.85, 0.25, 1.0]);

      // круг радиуса триггера
      const r = poi.radius ?? 120;
      r3d.drawCircleAt(pos.x, y, pos.z, r, 64, [1.0, 0.85, 0.25, 0.25]);

      // круг радиуса interact (потоньше)
      const ir = poi.interactRadius ?? r;
      r3d.drawCircleAt(pos.x, y, pos.z, ir, 64, [0.2, 0.9, 1.0, 0.18]);
    }
  }

  updateRelationIcons(view, vp) {
    const player = this.game.state.player;
    const playerFaction = player?.factionId ?? "neutral";

    const ships = this.game.state.ships || [];
    const entities = [];

    for (const ship of ships) {
      if (!ship?.runtime) continue;

      // игроку иконку можно не рисовать (или рисовать отдельную)
      if (ship === this.game.state.playerShip) continue;

      const rel = getFactionRelation(playerFaction, ship.factionId);
      const relation =
        rel === "hostile" ? "hostile" : rel === "ally" ? "ally" : "neutral";

      // позиция над кораблём (чуть выше)
      const wx = ship.runtime.x;
      const wy = 20; // высота “иконки” над плоскостью
      const wz = ship.runtime.z;

      const s = projectWorldToScreen(wx, wy, wz, vp, view);
      if (!s) {
        entities.push({ id: ship.id, relation, visible: false, x: 0, y: 0 });
        continue;
      }

      // спрятать если совсем за краем (не обязательно)
      const visible =
        s.x >= -50 && s.x <= view.w + 50 && s.y >= -50 && s.y <= view.h + 50;

      entities.push({
        id: ship.id,
        relation,
        visible,
        x: s.x,
        y: s.y,
      });
    }

    this.relIcons.update({ view, entities });
  }

  updateQuestLine() {
    const f = this.quest.flags;
    const a = f.nav_restored ? "Навигация ✅" : "Навигация ⬜";
    const b = f.ship_stabilized ? "Стабилизация ✅" : "Стабилизация ⬜";
    const c = f.got_parts ? "Детали ✅" : "Детали ⬜";
    const d = f.installed_upgrade ? "Апгрейд ✅" : "Апгрейд ⬜";

    if (f.act1_complete) {
      this.questLine = "Акт 1 завершён: прыжок выполнен/доступен.";
    } else if (f.beacon_enabled) {
      this.questLine = `Цель: активировать маяк\n${a} | ${b} | ${c} | ${d}`;
    } else {
      this.questLine = `Цель: починить корабль\n${a} | ${b} | ${c} | ${d}`;
    }
  }
  debugPoiOncePerSecond(dt) {
    this._poiDbgT = (this._poiDbgT ?? 0) + dt;
    if (this._poiDbgT < 1.0) return;
    this._poiDbgT = 0;

    if (!this.poiDef) return;

    // покажем 2-3 POI с координатами
    const sample = this.poiDef.slice(0, 3).map((p) => {
      const pos = this.getPoiWorldPos(p);
      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        x: pos?.x?.toFixed?.(1),
        z: pos?.z?.toFixed?.(1),
      };
    });

    console.log("POI sample:", sample);
  }
  getPlanetWorldPosById(planetId) {
    const p = this.system?.planets?.find((pp) => pp.id === planetId);
    if (!p) return null;

    // ТА ЖЕ формула, что в drawSystem3D()
    const a = this.time * p.speed + p.phase;
    const x = Math.cos(a) * p.orbitRadius;
    const z = Math.sin(a) * p.orbitRadius;
    return { x, z };
  }

  getPoiWorldPos(poi) {
    if (!poi) return null;

    if (poi.kind === "static") {
      return { x: poi.x ?? 0, z: poi.z ?? 0 };
    }
    if (poi.kind === "planet") {
      return this.getPlanetWorldPosById(poi.planetId);
    }
    return null;
  }

  drawPlayerShip3D(r3d) {
    const { state, assets } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;

    const shipModel = assets?.models?.ship;
    if (!shipModel) return;

const b = getBasis("ship");

r3d.drawModel(shipModel, {
  position: [r.x, 0, r.z],
  scale: [1, 1, 1],
  rotationY: r.yaw,     // только yaw из физики
  basisX: b.x,
  basisY: b.y,
  basisZ: b.z,

rotationX: r.pitchV ?? 0,
rotationZ: r.bank ?? 0,
});
  }

  drawSystem3D(r3d, { scaleMul = 1.0 } = {}) {
    if (!this.system) return;

    const { star, planets } = this.system;

    const sunModel = this.game.assets?.models?.sun;
    const planetPack = this.game.assets?.models?.planets;

    // ---- SUN ----
    if (sunModel) {
      const s = star.radius * 10 * scaleMul;
      r3d.drawModel(sunModel, {
        position: [0, 0, 0],
        scale: [s, s, s],
        rotationY: this.time * 0.05,
        emissive: 2.5,
        ambient: 0.95,
      });
    }

    for (const p of planets) {
      r3d.drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25]);

      const a = this.time * p.speed + p.phase;
      const x = Math.cos(a) * p.orbitRadius;
      const z = Math.sin(a) * p.orbitRadius;

      const model = planetPack?.[p.modelUrl];
      if (!model) continue;

      const s = p.size * scaleMul;

      r3d.drawModel(model, {
        position: [x, 0, z],
        scale: [s, s, s],
        rotationY: this.time * 0.2,
        ambient: 0.85,
        emissive: 0.0,
      });
    }

    // ✅ ВИЗУАЛЬНАЯ ГРАНИЦА ПОЛЁТА
    r3d.drawOrbit(this.boundsRadius, 260, [0.95, 0.25, 0.25, 0.45]);
  }
  drawAutopilotDebug3D(r3d) {
    const ship = this.game.state.playerShip;
    const r = ship?.runtime;
    if (!r) return;
    if (r.targetX == null || r.targetZ == null) return;

    const tx = r.targetX;
    const tz = r.targetZ;

    // --- 1) маркер цели ---
    r3d.drawCrossAt(tx, 0.65, tz, 12, [0.2, 0.9, 1.0, 1.0]);
    r3d.drawCircleAt(tx, 0.65, tz, 16, 48, [0.2, 0.9, 1.0, 0.45]);

    // --- 2) траектория: простой прогноз вперед ---
    // копия runtime чтобы не портить реальный
    const rr = {
      ...r,
      vx: r.vx || 0,
      vz: r.vz || 0,
      yaw: r.yaw || 0,
      throttleValue: r.throttleValue ?? 0,
      turnValue: r.turnValue ?? 0,
      // target оставляем
      targetX: tx,
      targetZ: tz,
    };

    const dt = 0.1;
    const steps = 48; // ~4.8 сек
    const pts = new Float32Array((steps + 1) * 3);

    let k = 0;
    pts[k++] = rr.x;
    pts[k++] = 0.55;
    pts[k++] = rr.z;

    for (let i = 0; i < steps; i++) {
      const c = getAutopilotControls(rr); // или getAutopilotControls(rr, apOpts) если добавишь opts
      if (!c) break;

      stepShipMovement(rr, c, dt, { boundsRadius: this.boundsRadius });

      pts[k++] = rr.x;
      pts[k++] = 0.55;
      pts[k++] = rr.z;

      if (rr.targetX == null) break;
    }

    // k = количество float’ов
    r3d.drawLineStrip(pts.subarray(0, k), [1.0, 1.0, 1.0, 0.35]);
  }
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
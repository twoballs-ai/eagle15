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
    // строки для простого UI (пока хоть console.log)
    this.questLine = "";
    this.lastLog = "";
    this.hud = null;
this._hudTimer = 0;
this.shipHud = null;
this._shipHudT = 0;
    // main 3D camera
    this.cam3d = {
      eye: [0, 220, 340],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 5000, // базовое, переопределим в enter()
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
    const r = this.game.state.playerShip?.runtime;
if (r) {
  // базовые статы, если их нет
  if (r.hpMax == null) r.hpMax = 100;
  if (r.hp == null) r.hp = r.hpMax;

  if (r.shieldMax == null) r.shieldMax = 50;
  if (r.shield == null) r.shield = r.shieldMax;

  if (r.energyMax == null) r.energyMax = 100;
  if (r.energy == null) r.energy = r.energyMax;
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

// сразу обновим текст
this.updateHudText(true);
    // временно: чтобы видеть, что работает
    console.log(this.questLine);
    console.log("LOG:", this.lastLog);
  }

  update(dt) {
    this.time += dt;
    this.updatePlayerShip(dt);
    this.debugPoiOncePerSecond(dt);
    this.updatePoiAndQuests(dt);
    this.updateHudText(false, dt);
  }
  updateHudText(force = false, dt = 0) {
  if (!this.hud) return;

  // обновляем 10 раз в секунду, чтобы не дергать DOM каждый кадр
  this._hudTimer += dt;
  if (!force && this._hudTimer < 0.10) return;
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
      }if (this.isPressedResetQuest()) {
  this.quest.reset();
  this.quest.addLog("Квест сброшен (dev).");
  this.lastLog = this.quest.log.at(-1)?.text ?? "";
  this.updateQuestLine();
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

    // 3) Управление: E для маяка
    // У тебя нет примера isKeyPressed, поэтому делаю адаптер:
    if (this.isPressedE()) {
      this.tryInteractFocusedPoi();
    }
  }
isPressedResetQuest() {
  const input = this.game.input;
  // R — reset (если есть такой метод)
  if (input?.isKeyPressed) return input.isKeyPressed("r") || input.isKeyPressed("R");
  if (input?.wasKeyPressed) return input.wasKeyPressed("r") || input.wasKeyPressed("R");
  return false;
}
  isPressedE() {
    const input = this.game.input;

    // Популярные варианты API — проверим несколько
    if (input?.isKeyPressed)
      return input.isKeyPressed("e") || input.isKeyPressed("E");
    if (input?.isPressed) return input.isPressed("e") || input.isPressed("E");
    if (input?.wasKeyPressed)
      return input.wasKeyPressed("e") || input.wasKeyPressed("E");

    // Если ничего нет — вернём false (тогда просто не будет активации маяка)
    return false;
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
    this.cam3d.target[0] = r.x + fx * 40;
    this.cam3d.target[1] = 0;
    this.cam3d.target[2] = r.z + fz * 40;

    this.cam3d.eye[0] = r.x;
    this.cam3d.eye[1] = 220;
    this.cam3d.eye[2] = r.z + 340;
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
    this.drawSystem3D(r3d);
    this.drawPoiDebug3D(r3d);
    this.drawPlayerShip3D(r3d);
    this.flame.draw(r3d.getVP(), dpr);
    this.drawAutopilotDebug3D(r3d);
    // ---- MINIMAP PASS ----
    this.renderMinimap(r3d, gl, view);
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
  renderMinimap(r3d, gl, view) {
    if (!this.system) return;

    const dpr = this.game.runtime?.dpr ?? 1;
    const size = Math.floor(this.minimap.sizeCSS * dpr);
    const pad = Math.floor(this.minimap.padCSS * dpr);

    const x = view.w - pad - size;
    const y = pad;

    r3d.beginViewportRect(view, x, y, size, size);

    gl.clearColor(0.01, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const ship = this.game.state.playerShip?.runtime;
    const cx = ship?.x ?? 0;
    const cz = ship?.z ?? 0;

    const miniCam = {
      eye: [cx, this.minimap.height, cz],
      target: [cx, 0, cz],
      up: [0, 0, -1],
      fovRad: Math.PI / 3,
      near: 0.1,
      far: 20000,
    };

    r3d.begin({ w: size, h: size }, miniCam);

    this.drawSystem3D(r3d);
    // this.drawPoiMinimap(r3d);  // ✅ вместо drawPoiDebug3D
    this.drawPoiDebug3D(r3d);
    this.drawPlayerShip3D(r3d);
    this.drawAutopilotDebug3D(r3d);
    r3d.endViewportRect();
  }

  drawPlayerShip3D(r3d) {
    const { state, assets } = this.game;
    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;

    const shipModel = assets?.models?.ship;
    if (!shipModel) return;

    r3d.drawModel(shipModel, {
      position: [r.x, 0, r.z],
      scale: [1, 1, 1],
      rotationY: r.yaw,
      rotationX: -Math.PI / 2,
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

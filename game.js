// game.js
import { createState } from "./data/state.js";
import { createGalaxy } from "./data/galaxy.js";
import { SHIP_CLASSES } from "./data/ship/shipClasses.js";
import { Input } from "./engine/controllers/input.js";
import { Actions } from "./engine/controllers/actions.js";

import { SceneManager } from "./engine/managers/SceneManager.js";
import { AssetManager } from "./engine/managers/AssetManager.js";
import { UIManager } from "./engine/managers/UIManager.js";

import { GalaxyMapScene } from "./scenes/galaxyMap/galaxyMapScene.js";
import { StarSystemScene } from "./scenes/starSystem/StarSystemScene.js";
import { ASSETS } from "./assets/manifest.js";
import { ContextMenu } from "./ui/contextMenu.js";
import { StartScreen } from "./ui/startScreen.js";
import { Services } from "./engine/core/services.js";
import { EventBus } from "./engine/core/bus.js";
import { loadSave, writeSave, makeSaveFromState } from "./data/save.js";

import { createPilotProfile } from "./data/character/pilot.js"; 
import { applyPilotModifiersToShipStats } from "./data/ship/applyPilotModifiers.js";
export class Game {
  static async create(args) {
    const saved = await loadSave();

    const game = new Game(args, saved);



    return game;
  }

  constructor({ canvas, gl, r2d, r3d, statsEl, getView, getViewPx }, saved) {
    this.canvas = canvas;
    this.gl = gl;
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;

    this.getView = getView;
    this.getViewPx = getViewPx ?? (() => {
      const v = this.getView();
      const dpr = v?.dpr ?? 1;
      return { w: Math.floor(v.w * dpr), h: Math.floor(v.h * dpr), dpr };
    });

    // systems
    this.state = createState(saved);
    
    this.galaxy = createGalaxy(777, {
  ensureConnected: true,
  randomCount: 0,
  isolatedCount: 0,
});
this.started = false;
    this.input = new Input({ canvas, getView: this.getView });
    this.actions = new Actions(this.input);

    this.assets = new AssetManager({ r2d, r3d });
    this.ui = new UIManager({ parent: document.body });
    this.scenes = new SceneManager();

    this.menu = new ContextMenu();
    this.startScreen = new StartScreen();
    this.bus = new EventBus();
    this.services = new Services({
      game: this,           // иногда удобно иметь ссылку на Game
      canvas: this.canvas,
      gl: this.gl,
      r2d: this.r2d,
      r3d: this.r3d,
      statsEl: this.statsEl,
      getView: this.getView,
      getViewPx: this.getViewPx,

      state: this.state,
      galaxy: this.galaxy,

      input: this.input,
      actions: this.actions,

      assets: this.assets,
      ui: this.ui,

      scenes: this.scenes,
      bus: this.bus,
    });

    // scenes instances ✅ теперь передаём services, не Game
    this.sceneGalaxy = new GalaxyMapScene(this.services);
    this.sceneStar = new StarSystemScene(this.services);

const p = this.state.player;
const hasSavedPilot =
  !!(p && typeof p === "object" && p.name && p.raceId && p.classId);

if (hasSavedPilot) {
  this.startScreen.hide();
  this.startNewGame({
    name: this.state.player.name,
    raceId: this.state.player.raceId,
    classId: this.state.player.classId,
    shipClassId: this.state.playerShipClassId ?? "scout", // ✅ ВОТ ТУТ
  });
} else {
  this.startScreen.show();
  this.startScreen.onStart = (cfg) => this.startNewGame(cfg);
}
  }

async startNewGame(cfg) {
  this.started = true; // ✅ теперь можно входить в игру

  // 1) создаём пилота
  const pilot = createPilotProfile({
    id: "pilot_1",
    name: cfg.name,
    raceId: cfg.raceId,
    classId: cfg.classId,
    factionId: "player",
    factionRankId: "outsider",
    reputation: 0,
  });

  this.state.player = pilot;
this.state.playerShipClassId = cfg.shipClassId ?? this.state.playerShipClassId ?? "scout";
  // 2) базовые статы корабля по выбору игрока
const shipBase =
  SHIP_CLASSES[this.state.playerShipClassId]?.baseStats ||
  SHIP_CLASSES.scout.baseStats;

  // 3) применяем модификаторы пилота к кораблю
  this.state.playerShip.stats = applyPilotModifiersToShipStats(shipBase, pilot.modifiers);

  // 4) включаем автосейв ТОЛЬКО ПОСЛЕ СТАРТА
  this._enableAutosave();

  // 5) сохраняем первый раз (теперь уже есть пилот и корабль)
  await writeSave(makeSaveFromState(this.state));

  // 6) загрузка ассетов и вход в систему
  const assets = this.services.get("assets");
  const U = ASSETS.normalizeUrl;

  const shipIconTex = await assets.loadTexture(U(ASSETS.textures.shipIcon));
  await assets.loadModel(U(ASSETS.models.sun));
  await assets.loadModel(U(ASSETS.models.ship));
  await Promise.all(ASSETS.planetModels.map((url) => assets.loadModel(U(ASSETS.normalizeUrl(url)))));

  assets.models = assets.models || {};
  assets.textures = assets.textures || {};

  assets.models.sun = assets.getModel(U(ASSETS.models.sun));
  assets.models.ship = assets.getModel(U(ASSETS.models.ship));

  assets.models.planets = assets.models.planets || {};
  for (const url of ASSETS.planetModels) {
    const uu = U(url);
    assets.models.planets[uu] = assets.getModel(uu);
  }
  assets.models.planetsReady = true;

  assets.textures.shipIcon = shipIconTex;

  this.startScreen.hide();
  const startId =
  this.state.currentSystemId ??
  (this.galaxy.systems[0]?.id ?? "sol");

this.openStarSystem(startId);
}


update(dt, time) {

  if (this.actions.pressed("cancel")) {
    this.menu.close();
    this.state.ui.modalOpen = false;
  }

  this.scenes.update(dt);
  this.ui.update(this, this.scenes.current, dt);
  
}

  render(time) {
    const vp = this.getViewPx();
    this.gl.viewport(0, 0, vp.w, vp.h);

    this.scenes.render(time);
    this.ui.render(this, this.scenes.current);
  }

openStarSystem(id) {
  const sid = String(id);

  // ✅ если игра ещё не стартовала — покажем в консоли почему не перешли
  if (!this.started) {
    console.warn("[Game] openStarSystem ignored (game not started yet):", sid);
    return;
  }

  console.log("[Game] openStarSystem", sid);

  // ✅ важно для всего остального (UI/квесты/карта)
  this.state.currentSystemId = sid;

  // закрываем контекстное меню
  this.menu?.close?.();

  // переключаем сцену и передаём sid
  this.scenes.set(this.sceneStar, sid);
}

_enableAutosave() {
  if (this._autosaveTimer) return;

  this._autosaveTimer = setInterval(() => {
    writeSave(makeSaveFromState(this.state));
  }, 5000);

  window.addEventListener("beforeunload", () => {
    writeSave(makeSaveFromState(this.state));
  });
}
  openGalaxyMap() {
    this.scenes.set(this.sceneGalaxy);
  }
}

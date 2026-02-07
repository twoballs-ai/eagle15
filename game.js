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
import { CreateGameScreen } from "./ui/CreateGameScreen.js";
import { MainMenu } from "./ui/mainMenu.js";

import { Services } from "./engine/core/services.js";
import { EventBus } from "./engine/core/bus.js";

import { loadSave, writeSave, makeSaveFromState, applySaveToState } from "./data/save.js";

import { createPilotProfile } from "./data/character/pilot.js";
import { applyPilotModifiersToShipStats } from "./data/ship/applyPilotModifiers.js";

export class Game {
  static async create(args) {
    // ✅ НИЧЕГО не авто-стартуем.
    // Главное меню само решит: Continue / Load / New.
    const savedMain = await loadSave("main");
    const game = new Game(args, savedMain);
    return game;
  }

  constructor({ canvas, gl, r2d, r3d, statsEl, getView, getViewPx }, savedMain) {
    this.canvas = canvas;
    this.gl = gl;
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;

    this.getView = getView;
    this.getViewPx =
      getViewPx ??
      (() => {
        const v = this.getView();
        const dpr = v?.dpr ?? 1;
        return { w: Math.floor(v.w * dpr), h: Math.floor(v.h * dpr), dpr };
      });

    // === runtime flags ===
    this.started = false;
    this._assetsLoaded = false;
    this._autosaveTimer = null;
    this._currentSaveSlot = null; // будет "main" или любой выбранный

    // === core systems ===
    this.state = createState(savedMain);
    // если createState не применяет save сам — применяем тут:
    // applySaveToState(this.state, savedMain);

    this.galaxy = createGalaxy(777, {
      ensureConnected: true,
      randomCount: 0,
      isolatedCount: 0,
    });

    this.input = new Input({ canvas, getView: this.getView });
    this.actions = new Actions(this.input);

    this.assets = new AssetManager({ r2d, r3d });
    this.ui = new UIManager({ parent: document.body });
    this.scenes = new SceneManager();

    this.menu = new ContextMenu();
    this.createGameScreen = new CreateGameScreen();
    this.mainMenu = new MainMenu();

    this.bus = new EventBus();
    this.services = new Services({
      game: this,
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

    // === scenes ===
    this.sceneGalaxy = new GalaxyMapScene(this.services);
    this.sceneStar = new StarSystemScene(this.services);

    // === UI flow ===
    this.createGameScreen.hide();
this.createGameScreen.onBack = () => {
  this.createGameScreen.hide();
  this.mainMenu.show();
};
    this.createGameScreen.onStart = (cfg) => {
      // Новая игра -> создаём пилота -> сохраняем в main -> входим
      this.startNewGame(cfg);
    };

    this.mainMenu.onNewGame = () => {
      this.mainMenu.hide();
      this.createGameScreen.show();
    };

    this.mainMenu.onContinue = async (slot = "main") => {
      await this.loadAndEnter(slot);
    };

    this.mainMenu.onLoadSlot = async (slot) => {
      await this.loadAndEnter(slot);
    };

    this.mainMenu.onOpenSettings = () => {
      // пока заглушка: позже сделаем полноценный экран
      console.log("[MainMenu] Settings clicked");
      alert("Настройки сделаем следующим шагом (отдельный экран).");
    };

    // ✅ показываем главное меню всегда
    this.mainMenu.show();
  }

  // ========= GAME LOOP =========

update(dt, time) {
  if (this.actions.pressed("cancel")) {
    this.menu.close();
    this.state.ui.modalOpen = false;
  }

  // ✅ UI должен обновляться ВСЕГДА (даже в меню/до старта),
  // чтобы виджеты могли сами скрываться/показываться по game.started и сцене.
  this.ui.update(this, this.scenes.current, dt);

  // если игра ещё не запущена — сцены не трогаем
  if (!this.started) return;

  this.scenes.update(dt);
}

  render(time) {
    const vp = this.getViewPx();
    this.gl.viewport(0, 0, vp.w, vp.h);

    // если не started — просто не рендерим сцены (или можешь рендерить фон)
    if (this.started) {
      this.scenes.render(time);
      this.ui.render(this, this.scenes.current);
    }
  }

  // ========= FLOW: NEW GAME =========

  async startNewGame(cfg) {
    this.started = true;
    this._currentSaveSlot = "main"; // новая игра по умолчанию в main

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

    // 2) выбранный класс корабля
    this.state.playerShipClassId = cfg.shipClassId ?? this.state.playerShipClassId ?? "scout";

    // 3) статы корабля + модификаторы пилота
    const shipBase =
      SHIP_CLASSES[this.state.playerShipClassId]?.baseStats ||
      SHIP_CLASSES.scout.baseStats;

    if (!this.state.playerShip) this.state.playerShip = { stats: { ...shipBase } };

    this.state.playerShip.stats = applyPilotModifiersToShipStats(shipBase, pilot.modifiers);

    // 4) ассеты (один раз)
    await this._ensureAssetsLoaded();

    // 5) первый сейв
    await writeSave(this._currentSaveSlot, makeSaveFromState(this.state));

    // 6) автосейв
    this._enableAutosave();

    // 7) UI закрыть
    this.createGameScreen.hide();
    this.mainMenu.hide();

    // 8) вход в систему
    const startId = this.state.currentSystemId ?? (this.galaxy.systems[0]?.id ?? "sol");
    this.openStarSystem(startId);
  }

  // ========= FLOW: LOAD GAME =========

  async loadAndEnter(slot = "main") {
    const saved = await loadSave(slot);
    if (!saved) {
      console.warn("[Game] loadAndEnter: no save in slot:", slot);
      return;
    }

    // применяем в state
    applySaveToState(this.state, saved);

    // flags
    this.started = true;
    this._currentSaveSlot = slot;

    // ассеты
    await this._ensureAssetsLoaded();

    // автосейв
    this._enableAutosave();

    // UI закрыть
    this.createGameScreen.hide();
    this.mainMenu.hide();

    // вход
    const startId = this.state.currentSystemId ?? (this.galaxy.systems[0]?.id ?? "sol");
    this.openStarSystem(startId);
  }

  // ========= SCENE SWITCH =========

  openStarSystem(id) {
    const sid = String(id);

    if (!this.started) {
      console.warn("[Game] openStarSystem ignored (game not started yet):", sid);
      return;
    }

    this.state.currentSystemId = sid;
    this.menu?.close?.();

    this.scenes.set(this.sceneStar, sid);
  }

  openGalaxyMap() {
    if (!this.started) return;
    this.scenes.set(this.sceneGalaxy);
  }

  // ========= ASSETS =========

  async _ensureAssetsLoaded() {
    if (this._assetsLoaded) return;

    const assets = this.services.get("assets");
    const U = ASSETS.normalizeUrl;

    const shipIconTex = await assets.loadTexture(U(ASSETS.textures.shipIcon));
    await assets.loadModel(U(ASSETS.models.sun));
    await assets.loadModel(U(ASSETS.models.ship));

    await Promise.all(
      ASSETS.planetModels.map((url) => assets.loadModel(U(ASSETS.normalizeUrl(url))))
    );

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

    this._assetsLoaded = true;
  }

  // ========= SAVE =========

  _enableAutosave() {
    if (this._autosaveTimer) return;

    this._autosaveTimer = setInterval(() => {
      const slot = this._currentSaveSlot ?? "main";
      writeSave(slot, makeSaveFromState(this.state));
    }, 5000);

    window.addEventListener("beforeunload", () => {
      const slot = this._currentSaveSlot ?? "main";
      writeSave(slot, makeSaveFromState(this.state));
    });
  }
}

// // game.js
// import { createState } from "./data/state.js";
// import { createGalaxy } from "./data/galaxy.js";
// import { SHIP_CLASSES } from "./data/ship/shipClasses.js";
// import { Input } from "./engine/controllers/input.js";
// import { Actions } from "./engine/controllers/actions.js";

// import { SceneManager } from "./engine/managers/SceneManager.js";
// import { AssetManager } from "./engine/managers/AssetManager.js";
// import { UIManager } from "./engine/managers/UIManager.js";

// import { GalaxyMapScene } from "./scenes/galaxyMap/galaxyMapScene.js";
// import { StarSystemScene } from "./scenes/starSystem/StarSystemScene.js";
// import { ASSETS } from "./assets/manifest.js";
// import { ContextMenu } from "./ui/contextMenu.js";
// import { createGameScreen } from "./ui/createGameScreen.js";
// import { Services } from "./engine/core/services.js";
// import { EventBus } from "./engine/core/bus.js";
// import { loadSave, writeSave, makeSaveFromState } from "./data/save.js";

// import { createPilotProfile } from "./data/character/pilot.js";
// import { applyPilotModifiersToShipStats } from "./data/ship/applyPilotModifiers.js";
// import { MainMenu } from "./ui/mainMenu.js";
// import {
//   loadSave,
//   writeSave,
//   makeSaveFromState,
//   applySaveToState,
// } from "./data/save.js";
// export class Game {
//   static async create(args) {
//     const saved = await loadSave();

//     const game = new Game(args, saved);

//     return game;
//   }

//   constructor({ canvas, gl, r2d, r3d, statsEl, getView, getViewPx }, saved) {
//     this.canvas = canvas;
//     this.gl = gl;
//     this.r2d = r2d;
//     this.r3d = r3d;
//     this.statsEl = statsEl;

//     this.getView = getView;
//     this.getViewPx =
//       getViewPx ??
//       (() => {
//         const v = this.getView();
//         const dpr = v?.dpr ?? 1;
//         return { w: Math.floor(v.w * dpr), h: Math.floor(v.h * dpr), dpr };
//       });

//     // systems
//     this.state = createState(saved);

//     this.galaxy = createGalaxy(777, {
//       ensureConnected: true,
//       randomCount: 0,
//       isolatedCount: 0,
//     });
//     this.started = false;
//     this.input = new Input({ canvas, getView: this.getView });
//     this.actions = new Actions(this.input);

//     this.assets = new AssetManager({ r2d, r3d });
//     this.ui = new UIManager({ parent: document.body });
//     this.scenes = new SceneManager();

//     this.menu = new ContextMenu();
//     this.createGameScreen = new createGameScreen();
//     this.bus = new EventBus();
//     this.services = new Services({
//       game: this, // иногда удобно иметь ссылку на Game
//       canvas: this.canvas,
//       gl: this.gl,
//       r2d: this.r2d,
//       r3d: this.r3d,
//       statsEl: this.statsEl,
//       getView: this.getView,
//       getViewPx: this.getViewPx,

//       state: this.state,
//       galaxy: this.galaxy,

//       input: this.input,
//       actions: this.actions,

//       assets: this.assets,
//       ui: this.ui,

//       scenes: this.scenes,
//       bus: this.bus,
//     });

//     // scenes instances ✅ теперь передаём services, не Game
//     this.sceneGalaxy = new GalaxyMapScene(this.services);
//     this.sceneStar = new StarSystemScene(this.services);

//     const p = this.state.player;
//     const hasSavedPilot = !!(
//       p &&
//       typeof p === "object" &&
//       p.name &&
//       p.raceId &&
//       p.classId
//     );

//     if (hasSavedPilot) {
//       this.createGameScreen.hide();
//       this.startNewGame({
//         name: this.state.player.name,
//         raceId: this.state.player.raceId,
//         classId: this.state.player.classId,
//         shipClassId: this.state.playerShipClassId ?? "scout", // ✅ ВОТ ТУТ
//       });
//     } else {
//       this.createGameScreen.show();
//       this.createGameScreen.onStart = (cfg) => this.startNewGame(cfg);
//     }
//   }

//   async startNewGame(cfg) {
//     this.started = true; // ✅ теперь можно входить в игру

//     // 1) создаём пилота
//     const pilot = createPilotProfile({
//       id: "pilot_1",
//       name: cfg.name,
//       raceId: cfg.raceId,
//       classId: cfg.classId,
//       factionId: "player",
//       factionRankId: "outsider",
//       reputation: 0,
//     });

//     this.state.player = pilot;
//     this.state.playerShipClassId =
//       cfg.shipClassId ?? this.state.playerShipClassId ?? "scout";
//     // 2) базовые статы корабля по выбору игрока
//     const shipBase =
//       SHIP_CLASSES[this.state.playerShipClassId]?.baseStats ||
//       SHIP_CLASSES.scout.baseStats;

//     // 3) применяем модификаторы пилота к кораблю
//     this.state.playerShip.stats = applyPilotModifiersToShipStats(
//       shipBase,
//       pilot.modifiers,
//     );

//     // 4) включаем автосейв ТОЛЬКО ПОСЛЕ СТАРТА
//     this._enableAutosave();

//     // 5) сохраняем первый раз (теперь уже есть пилот и корабль)
//     await writeSave(makeSaveFromState(this.state));

//     // 6) загрузка ассетов и вход в систему
//     const assets = this.services.get("assets");
//     const U = ASSETS.normalizeUrl;

//     const shipIconTex = await assets.loadTexture(U(ASSETS.textures.shipIcon));
//     await assets.loadModel(U(ASSETS.models.sun));
//     await assets.loadModel(U(ASSETS.models.ship));
//     await Promise.all(
//       ASSETS.planetModels.map((url) =>
//         assets.loadModel(U(ASSETS.normalizeUrl(url))),
//       ),
//     );

//     assets.models = assets.models || {};
//     assets.textures = assets.textures || {};

//     assets.models.sun = assets.getModel(U(ASSETS.models.sun));
//     assets.models.ship = assets.getModel(U(ASSETS.models.ship));

//     assets.models.planets = assets.models.planets || {};
//     for (const url of ASSETS.planetModels) {
//       const uu = U(url);
//       assets.models.planets[uu] = assets.getModel(uu);
//     }
//     assets.models.planetsReady = true;

//     assets.textures.shipIcon = shipIconTex;

//     this.createGameScreen.hide();
//     const startId =
//       this.state.currentSystemId ?? this.galaxy.systems[0]?.id ?? "sol";

//     this.openStarSystem(startId);
//   }

//   update(dt, time) {
//     if (this.actions.pressed("cancel")) {
//       this.menu.close();
//       this.state.ui.modalOpen = false;
//     }

//     this.scenes.update(dt);
//     this.ui.update(this, this.scenes.current, dt);
//   }

//   render(time) {
//     const vp = this.getViewPx();
//     this.gl.viewport(0, 0, vp.w, vp.h);

//     this.scenes.render(time);
//     this.ui.render(this, this.scenes.current);
//   }

//   openStarSystem(id) {
//     const sid = String(id);

//     // ✅ если игра ещё не стартовала — покажем в консоли почему не перешли
//     if (!this.started) {
//       console.warn(
//         "[Game] openStarSystem ignored (game not started yet):",
//         sid,
//       );
//       return;
//     }

//     console.log("[Game] openStarSystem", sid);

//     // ✅ важно для всего остального (UI/квесты/карта)
//     this.state.currentSystemId = sid;

//     // закрываем контекстное меню
//     this.menu?.close?.();

//     // переключаем сцену и передаём sid
//     this.scenes.set(this.sceneStar, sid);
//   }

//   _enableAutosave() {
//     if (this._autosaveTimer) return;

//     this._autosaveTimer = setInterval(() => {
//       writeSave(makeSaveFromState(this.state));
//     }, 5000);

//     window.addEventListener("beforeunload", () => {
//       writeSave(makeSaveFromState(this.state));
//     });
//   }
//   openGalaxyMap() {
//     this.scenes.set(this.sceneGalaxy);
//   }
// }

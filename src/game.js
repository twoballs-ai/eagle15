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

import { ASSETS } from "./assets_folder/manifest.js";
import { ContextMenu } from "./ui/contextMenu.js";
import { CreateGameScreen } from "./ui/CreateGameScreen.js";
import { MainMenu } from "./ui/mainMenu.js";

import { Services } from "./engine/core/services.js";
import { EventBus } from "./engine/core/bus.js";

import { loadSave, writeSave, makeSaveFromState, applySaveToState } from "./data/save.js";

import { createPilotProfile } from "./data/character/pilot.js";
import { applyPilotModifiersToShipStats } from "./data/ship/applyPilotModifiers.js";
import { SystemMenu } from "./ui/systemMenu/SystemMenu.js";

import { SurfaceMetrics } from "./engine/runtime/SurfaceMetrics.js";
import { Inventory } from "./gameplay/inventory/Inventory.js";
import { Crafting } from "./gameplay/inventory/Crafting.js";
import { shipRecipes } from "./data/crafting/shipRecipes.js";
export class Game {
  static async create(args) {
    const savedMain = await loadSave("main");
    return new Game(args, savedMain);
  }

  constructor({ canvas, gl, r2d, r3d, statsEl }, savedMain) {
    this.canvas = canvas;
    this.gl = gl;
this.__id = Math.random().toString(16).slice(2);
console.log("[Game:new]", this.__id);
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;

    // ✅ ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ о поверхности
    this.surface = new SurfaceMetrics({ canvas: this.canvas, gl: this.gl });
    // сразу применим размер (первый кадр)
    this.surface.applyCanvasSize();
    this.surface.update();

    // === runtime flags ===
    this.started = false;
    this._assetsLoaded = false;
    this._autosaveTimer = null;
    this._currentSaveSlot = null;

    // === core state ===
    this.state = createState(savedMain);

    this.galaxy = createGalaxy(777, {
      ensureConnected: true,
      randomCount: 0,
      isolatedCount: 0,
    });

    // ✅ Input пока оставляем как есть (он использует viewport CSS)
    // Позже переведём на surface для точного mapping
    this.input = new Input({ canvas: this.canvas, getView: () => this.getView() });
    this.actions = new Actions(this.input);

    this.assets = new AssetManager({ r2d, r3d });
    this.ui = new UIManager({ parent: document.body });
    this.scenes = new SceneManager();

    this.menu = new ContextMenu();
    this.createGameScreen = new CreateGameScreen();
    this.mainMenu = new MainMenu();

    this.bus = new EventBus();

    // ✅ legacy совместимость: getView/getViewPx теперь вычисляются из surface
    const getView = () => {
      const v = this.surface.value;
      return { w: v.canvasCssRect.w, h: v.canvasCssRect.h, dpr: v.dpr ?? 1 };
    };
    const getViewPx = () => {
      const v = this.surface.value;
      return { w: v.buffer.w, h: v.buffer.h, dpr: v.dpr ?? 1 };
    };

    this.services = new Services({
      game: this,
      canvas: this.canvas,
      gl: this.gl,
      r2d: this.r2d,
      r3d: this.r3d,
      statsEl: this.statsEl,

      // ✅ совместимость (но истина = surface)
      getView,
      getViewPx,

      // ✅ истина
      surface: this.surface,

      state: this.state,
      galaxy: this.galaxy,

      input: this.input,
      actions: this.actions,

      assets: this.assets,
      ui: this.ui,

      scenes: this.scenes,
      bus: this.bus,
    });

this.systemMenu = new SystemMenu(this.services);
this.inventory = new Inventory({
  capacity: 100,
  slots: [
    { id: "oxygen", n: 40 },
    { id: "iron_ore", n: 30 },
    { id: "copper_ore", n: 30 },
    { id: "silicon_dust", n: 30 },
    { id: "polymer_slurry", n: 20 },
  ],
});

this.crafting = new Crafting({
  inventory: this.inventory,
  recipes: shipRecipes,
});

this.services.set("inventory", this.inventory);
this.services.set("crafting", this.crafting);
    // scenes
    this.sceneGalaxy = new GalaxyMapScene(this.services);
    this.sceneStar = new StarSystemScene(this.services);

    // UI flow
    this.createGameScreen.hide();

    this.createGameScreen.onBack = () => {
      this.createGameScreen.hide();
      this.mainMenu.show();
    };

    this.createGameScreen.onStart = (cfg) => {
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
      console.log("[MainMenu] Settings clicked");
      alert("Настройки сделаем следующим шагом (отдельный экран).");
    };

    this.mainMenu.show();
  }

  // ========= helpers (legacy API, derived from surface) =========
  getView() {
    const v = this.surface.value;
    return { w: v.canvasCssRect.w, h: v.canvasCssRect.h, dpr: v.dpr ?? 1 };
  }
  getViewPx() {
    const v = this.surface.value;
    return { w: v.buffer.w, h: v.buffer.h, dpr: v.dpr ?? 1 };
  }

  // ========= GAME LOOP =========

update(dt, time) {
  const esc = this.actions.pressed("cancel");

  const blocked = this.systemMenu.handleEngineInputEsc(esc);
  if (blocked) {
    this.systemMenu.update(dt);
    return;
  }

  if (esc) {
    this.menu.close();
    this.state.ui.modalOpen = false;
  }

  this.ui.update(this, this.scenes.current, dt);
  if (!this.started) return;

  this.scenes.update(dt);
}

  render(time) {
    // ✅ 1) единственное место resize drawingBuffer
    this.surface.applyCanvasSize();

    // ✅ 2) обновили метрики (buffer/scale)
    const s = this.surface.update();

    // ✅ 3) единственное место viewport для главного прохода
    this.gl.viewport(0, 0, s.buffer.w, s.buffer.h);

    if (!this.started) return;

    // 1) основной рендер сцены
    this.scenes.render(time);

    // 2) HUD/прочий UI (он может трогать GL)
    this.ui.render(this, this.scenes.current);

    // 3) ✅ МЕНЮ-КАРТА ПОСЛЕДНЕЙ (иначе её затирает ui.render)
    this.systemMenu?.renderGL?.(this, this.scenes.current);
  }

  // ========= FLOW: NEW GAME =========

  async startNewGame(cfg) {
    this.started = true;
    this._currentSaveSlot = "main";

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

    this.state.playerShipClassId =
      cfg.shipClassId ?? this.state.playerShipClassId ?? "scout";

    const shipBase =
      SHIP_CLASSES[this.state.playerShipClassId]?.baseStats ||
      SHIP_CLASSES.scout.baseStats;

    if (!this.state.playerShip) this.state.playerShip = { stats: { ...shipBase } };
    this.state.playerShip.stats = applyPilotModifiersToShipStats(shipBase, pilot.modifiers);

    await this._ensureAssetsLoaded();
    await writeSave(this._currentSaveSlot, makeSaveFromState(this.state));

    this._enableAutosave();

    this.createGameScreen.hide();
    this.mainMenu.hide();

    const startId = this.state.currentSystemId ?? (this.galaxy.systems[0]?.id ?? "sol");
    this.openStarSystem(startId);
  }

  async loadAndEnter(slot = "main") {
    const saved = await loadSave(slot);
    if (!saved) {
      console.warn("[Game] loadAndEnter: no save in slot:", slot);
      return;
    }

    applySaveToState(this.state, saved);

    this.started = true;
    this._currentSaveSlot = slot;

    await this._ensureAssetsLoaded();
    this._enableAutosave();

    this.createGameScreen.hide();
    this.mainMenu.hide();

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

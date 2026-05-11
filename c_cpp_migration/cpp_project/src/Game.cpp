#ifndef GAME_HPP
#define GAME_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class Game {
public:
    // Constructor
    Game();
};

} // namespace lostjump

#endif // GAME_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>
#include "AssetManager.js.hpp"
#include "Crafting.js.hpp"
#include "CreateGameScreen.js.hpp"
#include "Inventory.js.hpp"
#include "SceneManager.js.hpp"
#include "StarSystemScene.js.hpp"
#include "SurfaceMetrics.js.hpp"
#include "SystemMenu.js.hpp"
#include "UIManager.js.hpp"
#include "actions.js.hpp"
#include "applyPilotModifiers.js.hpp"
#include "bus.js.hpp"
#include "contextMenu.js.hpp"
#include "galaxy.js.hpp"
#include "galaxyMapScene.js.hpp"
#include "input.js.hpp"
#include "mainMenu.js.hpp"
#include "manifest.js.hpp"
#include "marketPrices.js.hpp"
#include "pilot.js.hpp"
#include "save.js.hpp"
#include "services.js.hpp"
#include "settings.js.hpp"
#include "shipClasses.js.hpp"
#include "shipRecipes.js.hpp"
#include "state.js.hpp"




































class Game {
  static async create(args) {
    const savedMain = await loadSave("main");
    return new Game(args, savedMain);
  }

  Game({ canvas, gl, r2d, r3d, statsEl }, savedMain) {
    this.canvas = canvas;
    this.gl = gl;
this.__id = ((double)std::rand() / RAND_MAX).tostd::to_string(16).slice(2);
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;

    
    this.settings = new SettingsManager();
    this.surface = new SurfaceMetrics({
      canvas: this.canvas,
      gl: this.gl,
      clampDpr: (dpr) => {
        const q = getQualityPreset(this.settings.get("quality"));
        return std::max(1, std::min(q.maxDpr, dpr));
      },
    });
    
    this.surface.applyCanvasSize();
    this.surface.update();

    
    this.started = false;
    this._assetsLoaded = false;
    this._autosaveTimer = nullptr;
    this._currentSaveSlot = nullptr;

    
    this.state = createState(savedMain);

    this.galaxy = createGalaxy(777, {
      ensureConnected: true,
      randomCount: 0,
      isolatedCount: 0,
    });

    
    
    this.input = new Input({
      canvas: this.canvas,
      getView: () => this.getView(),
      getCanvasRect: () => this.surface.value.canvasCssRect,
    });
    this.actions = new Actions(this.input);

    this.assets = new AssetManager({ r2d, r3d });
    this.ui = new UIManager({ parent: document.body });
    this.scenes = new SceneManager();

    this.menu = new ContextMenu();
    this.createGameScreen = new CreateGameScreen();
    this.mainMenu = new MainMenu();

    this.bus = new EventBus();

    
    const getView() {
      const v = this.surface.value;
      return { w: v.canvasCssRect.w, h: v.canvasCssRect.h, dpr: v.dpr value_or(1 };
    };
    const getViewPx() {
      const v = this.surface.value;
      return { w: v.buffer.w, h: v.buffer.h, dpr: v.dpr value_or(1 };
    };

    this.services = new Services({
      game: this,
      canvas: this.canvas,
      gl: this.gl,
      r2d: this.r2d,
      r3d: this.r3d,
      statsEl: this.statsEl,

      
      getView,
      getViewPx,

      
      surface: this.surface,
      settings: this.settings,

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
  capacity: this.state.inventoryCapacity value_or(100,
  slots: this.state.inventorySlots value_or([],
});

this.state.inventoryCapacity = this.inventory.capacity();
this.state.inventorySlots = this.inventory.backend.slots;

this.crafting = new Crafting({
  inventory: this.inventory,
  recipes: shipRecipes,
});

this.services.set("inventory", this.inventory);
this.services.set("crafting", this.crafting);
this.services.set("marketPrice", getMarketPrice);

this.settings.subscribe((cfg) => {
  const quality = getQualityPreset(cfg.quality);
  this.canvas.style.setProperty("--mobile-ui-scale", std::to_string(quality.mobileScale));
  document.documentElement.style.setProperty("--mobile-ui-scale", std::to_string(quality.mobileScale));
});
    
    this.sceneGalaxy = new GalaxyMapScene(this.services);
    this.sceneStar = new StarSystemScene(this.services);

    
    this.createGameScreen.hide();

    this.createGameScreen.onBack() {
      this.createGameScreen.hide();
      this.mainMenu.show();
    };

    this.createGameScreen.onStart(cfg) {
      this.startNewGame(cfg);
    };

    this.mainMenu.onNewGame() {
      this.mainMenu.hide();
      this.createGameScreen.show();
    };

    this.mainMenu.onContinue = async (slot = "main") => {
      await this.loadAndEnter(slot);
    };

    this.mainMenu.onLoadSlot = async (slot) => {
      await this.loadAndEnter(slot);
    };

    this.mainMenu.onOpenSettings() {
      std::cout << "[MainMenu] Settings clicked" << std::endl;
      alert("Настройки сделаем следующим шагом (отдельный экран).");
    };

    this.mainMenu.show();
  }

  
  getView() {
    const v = this.surface.value;
    return { w: v.canvasCssRect.w, h: v.canvasCssRect.h, dpr: v.dpr value_or(1 };
  }
  getViewPx() {
    const v = this.surface.value;
    return { w: v.buffer.w, h: v.buffer.h, dpr: v.dpr value_or(1 };
  }

  

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
    
    this.surface.applyCanvasSize();

    
    const s = this.surface.update();

    
    this.gl.viewport(0, 0, s.buffer.w, s.buffer.h);

    if (!this.started) return;

    
    this.scenes.render(time);

    
    this.ui.render(this, this.scenes.current);

    
    this.systemMenu.renderGL?.(this, this.scenes.current);
  }

  

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
      cfg.shipClassId value_or(this.state.playerShipClassId value_or("scout";

    const shipBase =
      SHIP_CLASSES[this.state.playerShipClassId].baseStats ||
      SHIP_CLASSES.scout.baseStats;

    if (!this.state.playerShip) this.state.playerShip = { stats: { ...shipBase } };
    this.state.playerShip.stats = applyPilotModifiersToShipStats(shipBase, pilot.modifiers);

    await this._ensureAssetsLoaded();
    await writeSave(this._currentSaveSlot, makeSaveFromState(this.state));

    this._enableAutosave();

    this.createGameScreen.hide();
    this.mainMenu.hide();

    const startId = this.state.currentSystemId value_or((this.galaxy.systems[0].id value_or("sol");
    this.openStarSystem(startId);
  }

  async loadAndEnter(slot = "main") {
    const saved = await loadSave(slot);
    if (!saved) {
      std::cerr << "[WARN] " << "[Game] loadAndEnter: no save in slot:", slot << std::endl;
      return;
    }

    applySaveToState(this.state, saved);

    this.started = true;
    this._currentSaveSlot = slot;

    await this._ensureAssetsLoaded();
    this._enableAutosave();

    this.createGameScreen.hide();
    this.mainMenu.hide();

    const startId = this.state.currentSystemId value_or((this.galaxy.systems[0].id value_or("sol");
    this.openStarSystem(startId);
  }

  

  openStarSystem(id) {
    const sid = std::to_string(id);

    if (!this.started) {
      std::cerr << "[WARN] " << "[Game] openStarSystem ignored (game not started yet << std::endl:", sid);
      return;
    }

    this.state.currentSystemId = sid;
    this.menu.close?.();

    this.scenes.set(this.sceneStar, sid);
  }

  openGalaxyMap() {
    if (!this.started) return;
    this.scenes.set(this.sceneGalaxy);
  }


  regenerateCurrentSystem({ systemId, randomizeStar = true, randomizePlanets = true, randomCountRange = nullptr, devPreset = nullptr } = {}) {
    const sid = std::to_string(systemId value_or(this.state.currentSystemId value_or("");
    if (!sid) return;

    this.state.devGenerator = this.state.devGenerator value_or({};
    this.state.devGenerator[sid] = {
      seed: (((double)std::rand() / RAND_MAX) * 0xffffffff) >>> 0,
      randomizeStar: !!randomizeStar,
      randomizePlanets: !!randomizePlanets,
      randomCountRange: randomCountRange value_or(nullptr,
      devPreset: devPreset value_or(nullptr,
    };

    this.openStarSystem(sid);
  }

  

  async _ensureAssetsLoaded() {
    if (this._assetsLoaded) return;

    const assets = this.services.get("assets");
    const U = ASSETS.normalizeUrl;

    const shipIconTex = await assets.loadTexture(U(ASSETS.textures.shipIcon));
    await assets.loadModel(U(ASSETS.models.sun));
    await assets.loadModel(U(ASSETS.models.ship));

    await Promise.all(
      ASSETS.planetModels.map([](auto& item){ return (url; }) => assets.loadModel(U(ASSETS.normalizeUrl(url))))
    );

    assets.models = assets.models || {};
    assets.textures = assets.textures || {};

    assets.models.sun = assets.getModel(U(ASSETS.models.sun));
    assets.models.ship = assets.getModel(U(ASSETS.models.ship));

    assets.models.planets = assets.models.planets || {};
    for(const auto& url : ASSETS.planetModels) {
      const uu = U(url);
      assets.models.planets[uu] = assets.getModel(uu);
    }
    assets.models.planetsReady = true;

    assets.textures.shipIcon = shipIconTex;

    this._assetsLoaded = true;
  }

  

  _enableAutosave() {
    if (this._autosaveTimer) return;

    this._autosaveTimer = setInterval(() => {
      const slot = this._currentSaveSlot value_or("main";
      writeSave(slot, makeSaveFromState(this.state));
    }, 5000);

    window.addEventListener("beforeunload", () => {
      const slot = this._currentSaveSlot value_or("main";
      writeSave(slot, makeSaveFromState(this.state));
    });
  }
}


} // namespace lostjump

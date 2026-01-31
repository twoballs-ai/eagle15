// game.js
import { createState } from "./data/state.js";
import { createGalaxy } from "./data/galaxy.js";

import { Input } from "./engine/controllers/input.js";
import { Actions } from "./engine/controllers/actions.js";

import { SceneManager } from "./engine/managers/SceneManager.js";
import { AssetManager } from "./engine/managers/AssetManager.js";
import { UIManager } from "./engine/managers/UIManager.js";

import { GalaxyMapScene } from "./scenes/galaxyMapScene.js";
import { StarSystemScene } from "./scenes/starSystem/StarSystemScene.js";
import { ASSETS } from "./assets/manifest.js";
import { ContextMenu } from "./ui/contextMenu.js";
import { StartScreen } from "./ui/startScreen.js";
import { Services } from "./engine/core/services.js";
import { EventBus } from "./engine/core/bus.js";
export class Game {
  constructor({ canvas, gl, r2d, r3d, statsEl, getView, getViewPx }) {
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
    this.state = createState();
    this.galaxy = createGalaxy(777);

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

    // start
    this.startScreen.show();
    this.startScreen.onStart = (cfg) => this.startNewGame(cfg);
  }

async startNewGame(cfg) {
  const assets = this.services.get("assets");
  const U = ASSETS.normalizeUrl;

  // текстуры
  const shipIconTex = await assets.loadTexture(U(ASSETS.textures.shipIcon));

  // модели
  await assets.loadModel(U(ASSETS.models.sun));
  await assets.loadModel(U(ASSETS.models.ship));

  // планеты
  await Promise.all(ASSETS.planetModels.map((url) => assets.loadModel(U(url))));

  // bridge под старый рендер
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
  this.openStarSystem(0);
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
  console.log("[Game] openStarSystem", id);
  this.scenes.set(this.sceneStar, id);
}

  openGalaxyMap() {
    this.scenes.set(this.sceneGalaxy);
  }
}

// game.js
import { createState } from "./data/state.js";
import { createGalaxy } from "./data/galaxy.js";

import { GalaxyMapScene } from "./scenes/galaxyMapScene.js";
import { StarSystemScene } from "./scenes/starSystemScene.js";

import { ContextMenu } from "./ui/contextMenu.js";
import { StartScreen } from "./ui/startScreen.js";

import { Input } from "./engine/controllers/input.js";
import { Actions } from "./engine/controllers/actions.js";

import { createCharacter } from "./data/сharacter/character.js";
import { createShip } from "./data/ship/ship.js";

import { PLANET_MODELS } from "./data/models/planetModels.js";

export class Game {
  constructor({ canvas, gl, r2d, r3d, statsEl, getView, getViewPx }) {
    this.canvas = canvas;
    this.gl = gl;
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;

    // ✅ View helpers
    this.getView = getView;
    this.getViewPx =
      getViewPx ??
      (() => {
        const v = this.getView();
        const dpr = v?.dpr ?? 1;
        return {
          w: Math.floor((v?.w ?? 0) * dpr),
          h: Math.floor((v?.h ?? 0) * dpr),
          dpr,
        };
      });

    // ✅ Input/Actions
    this.input = new Input({ canvas, getView: this.getView });
    this.actions = new Actions(this.input);

    // ✅ World state
    this.state = createState();
    this.galaxy = createGalaxy(777);

    // ✅ Assets container
    this.assets = {
      models: {},
      textures: {},
    };

    // ✅ UI: context menu (global)
    this.menu = new ContextMenu();
    this.menu.onClose = () => {
      this.state.ui.menuOpen = false;
      this.state.selectedSystemId = null;
    };

    // ✅ Scenes
    this.scenes = {
      galaxyMap: new GalaxyMapScene(this),
      starSystem: new StarSystemScene(this),
    };
    this.currentScene = this.scenes.galaxyMap;

    // ✅ Start screen
    this.startScreen = new StartScreen();
    this.startScreen.show();

    this.startScreen.onStart = async (cfg) => {
      try {
        await this.startNewGame(cfg);
      } catch (e) {
        console.error("[startNewGame] failed", e);
      }
    };
  }

  // -----------------------
  // Game bootstrap
  // -----------------------
  async startNewGame({ name, raceId, classId, specializationId } = {}) {
    // 1) Create player + ship
    const player = createCharacter({
      id: "player",
      name: name ?? "Player",
      raceId,
      classId,
      factionId: "union",
      factionRankId: "recruit",
      reputation: 0,
    });

    const ship = createShip({
      id: "player_ship",
      name: "ISS Pioneer",
      raceId,
      classId: "scout",
      factionId: player.factionId,
    });

    ship.ownerId = player.id;

    // 2) Put into state
    this.state.player = player;
    this.state.playerShip = ship;
    this.state.ships = [ship];

    // 3) Load assets (fire-and-forget allowed, but we await the essentials)
    await this._loadCoreAssets();

    // 4) Hide start screen, go to gameplay
    this.startScreen.hide();
    this.openStarSystem(0);
  }

  async _loadCoreAssets() {
    // Textures (2D icon)
    if (!this.assets.textures.shipIcon) {
      this.r2d
        .loadTexture("./assets/2d/raketa_minify.png")
        .then((t) => {
          this.assets.textures.shipIcon = t;
          console.log("[shipIcon] loaded");
        })
        .catch((e) => console.error("[shipIcon] failed", e));
    }

    // Models
    const jobs = [];

    if (!this.assets.models.sun) {
      jobs.push(
        this.r3d
          .loadGLB("./assets/models/Sun.glb")
          .then((m) => (this.assets.models.sun = m))
      );
    }

    if (!this.assets.models.ship) {
      jobs.push(
        this.r3d
          .loadGLB("./assets/models/spaceship.glb")
          .then((m) => (this.assets.models.ship = m))
      );
    }

    // Planets pack
    if (!this.assets.models.planets) this.assets.models.planets = {};
    if (!this.assets.models.planetsReady) {
      jobs.push(
        Promise.all(
          PLANET_MODELS.map((url) =>
            this.r3d
              .loadGLB(url)
              .then((m) => {
                this.assets.models.planets[url] = m;
              })
              .catch((e) => console.error("Failed to load planet model:", url, e))
          )
        ).then(() => {
          this.assets.models.planetsReady = true;
        })
      );
    }

    // Await main models, planets can still stream; but it’s ok to await all too.
    await Promise.allSettled(jobs);
  }

  // -----------------------
  // Main loop hooks
  // -----------------------
  update(dt, time) {
    // ✅ global cancel (ESC)
    if (this.actions.pressed("cancel")) {
      this.menu.close();
      this.state.ui.modalOpen = false;
    }

    this.currentScene?.update?.(dt);

    // optional stats
    // const sceneName = this.currentScene?.name ?? "Unknown";
    // this.statsEl.textContent = `FPS: ${time?.fps ?? 0} | Scene: ${sceneName}`;
  }

  render(time) {
    // ✅ viewport ALWAYS in GL px
    const viewPx = this.getViewPx();
    this.gl.viewport(0, 0, viewPx.w, viewPx.h);

    this.currentScene?.render?.(time);

    // ❌ больше никаких minimap.draw() здесь
    // HUD/миникарты рисуются в сценах через HUDManager (StarSystemScene.hud.render)
  }

  // -----------------------
  // Navigation
  // -----------------------
  openStarSystem(systemId) {
    this.state.currentSystemId = systemId;
    this.state.ui.modalOpen = false;
    this.menu.close();

    this.currentScene = this.scenes.starSystem;
    this.currentScene?.enter?.(systemId);
  }

  openGalaxyMap() {
    this.menu.close();

    this.currentScene = this.scenes.galaxyMap;
    this.currentScene?.enter?.();
  }
}

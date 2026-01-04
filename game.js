import { createState } from "./data/state.js";
import { createGalaxy } from "./data/galaxy.js";
import { GalaxyMapScene } from "./scenes/galaxyMapScene.js";
import { StarSystemScene } from "./scenes/starSystemScene.js";
import { ContextMenu } from "./ui/contextMenu.js";
import { Input } from "./engine/input.js";
import { getFactionName, getRankName } from "./data/factionsUtil.js";
import { StartScreen } from "./ui/startScreen.js";
import { createCharacter } from "./data/сharacter/character.js";
import { createShip } from "./data/ship/ship.js";
import { MinimapSolarSystem } from "./ui/minimapSolarSystem.js";
import { MinimapGalaxy } from "./ui/minimapGalaxy.js";
import { PLANET_MODELS } from "./data/models/planetModels.js";
export class Game {
  constructor({ canvas, gl, r2d, r3d, statsEl, getView }) {
    this.canvas = canvas;
    this.gl = gl;
    this.r2d = r2d;
    this.r3d = r3d;
    this.statsEl = statsEl;
    this.getView = getView;

    this.state = createState();
    this.galaxy = createGalaxy(777);

    this.menu = new ContextMenu();
    this.menu.onClose = () => {
      this.state.ui.menuOpen = false;
      this.state.selectedSystemId = null;
    };

    // Scenes
    this.scenes = {
      galaxyMap: new GalaxyMapScene(this),
      starSystem: new StarSystemScene(this),
    };
    this.currentScene = this.scenes.galaxyMap;



    // Input (единый)
    this.input = new Input({ canvas, getView });
// --- Start screen ---
this.startScreen = new StartScreen();
this.startScreen.show();

this.startScreen.onStart = ({ name, raceId, classId, specializationId }) => {
  const player = createCharacter({
    id: "player",
    name,
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

  // ✅ ассеты
  this.assets = { models: {} };

  // ---- SUN ----
  this.r3d.loadGLB("./assets/models/Sun.glb")
    .then((m) => (this.assets.models.sun = m))
    .catch(console.error);

  // ---- SHIP ----
  this.r3d.loadGLB("./assets/models/spaceship.glb")
    .then((m) => (this.assets.models.ship = m))
    .catch(console.error);

  // ✅ ---- PLANETS PACK ----
  // models.planets будет словарь: { [url]: model }
  this.assets.models.planets = {};
  this.assets.models.planetsReady = false;

  Promise.all(
    PLANET_MODELS.map((url) =>
      this.r3d.loadGLB(url)
        .then((m) => {
          this.assets.models.planets[url] = m;
        })
        .catch((e) => {
          console.error("Failed to load planet model:", url, e);
        })
    )
  ).then(() => {
    this.assets.models.planetsReady = true;
    // console.log("Planets pack loaded:", Object.keys(this.assets.models.planets).length);
  });

  // ---- state ----
  this.state.player = player;
  this.state.playerShip = ship;
  this.state.ships = [ship];

  this.startScreen.hide();

  // ✅ стартуем сразу в звездной системе
  this.openStarSystem(0);
};


    // ESC — закрыть меню/модалки
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        this.menu.close();
        this.state.ui.modalOpen = false;
      }
    });

this.minimapSolar = new MinimapSolarSystem({ size: 200, fit: 0.94, maxBodyPx: 14, maxStarPx: 22 });
this.minimapGalaxy = new MinimapGalaxy(); // пока не используется
  }

  update(dt, time) {

if (!this.state.player) {
  this.statsEl.textContent = "Create your character...";
  this.input.beginFrame();
  return;
}
    if (this.currentScene.update) {
      this.currentScene.update(dt);
    }

    // Stats
    const cam = this.state.camera;
    const sceneName = this.currentScene.name || "Unknown";
    const p = this.state.player;
    this.statsEl.textContent =
    `FPS: ${time.fps} | Scene: ${sceneName} | Cam: (${cam.x.toFixed(0)},${cam.y.toFixed(0)}) z=${cam.zoom.toFixed(2)}` +
    (this.state.currentSystemId != null ? ` | Current system: ${this.state.currentSystemId}` : "") +
    (p
        ? ` | ${getFactionName(p.factionId)} / ${getRankName(p.factionRankId)}`
        : "");
    this.input.beginFrame();
  }

  render(time) {
    const view = this.getView();
    this.gl.viewport(0, 0, view.w, view.h);

    if (this.currentScene.render) {
      this.currentScene.render();
    }
      // ✅ UI-оверлей (миникарта)
if (this.currentScene === this.scenes.starSystem) {
  this.minimapSolar.draw(this, this.currentScene);
}
  }

  // ---------- Core game actions ----------
  openStarSystem(systemId) {
    this.state.currentSystemId = systemId;
    this.state.ui.modalOpen = false;
    this.menu.close();

    this.currentScene = this.scenes.starSystem;
    if (this.currentScene.enter) this.currentScene.enter(systemId);
  }

  openGalaxyMap() {
    this.menu.close();

    this.currentScene = this.scenes.galaxyMap;
    if (this.currentScene.enter) this.currentScene.enter();
  }
}

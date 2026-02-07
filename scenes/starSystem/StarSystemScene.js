import { Scene } from "../../engine/core/scene.js";
import { createStarSystemCtx } from "./ctx.js";
import { CutsceneSystem } from "./systems/CutsceneSystem.js";
import { TimeSystem } from "./systems/TimeSystem.js";
import { BootstrapSystem } from "./systems/BootstrapSystem.js";
import { CameraInputSystem } from "./systems/CameraInputSystem.js";
import { ShipControlSystem } from "./systems/ShipControlSystem.js";
import { EnemyAISystem } from "./systems/EnemyAISystem.js";
import { EnemyFireSystem } from "./systems/EnemyFireSystem.js";
import { ProjectilesSystem } from "./systems/ProjectilesSystem.js";
import { CollisionsSystem } from "./systems/CollisionsSystem.js";
import { PoiQuestSystem } from "./systems/PoiQuestSystem.js";
import { RelationIconsSystem } from "./systems/RelationIconsSystem.js";
import { HudSystem } from "./systems/HudSystem.js";
import { RenderSystem } from "./systems/RenderSystem.js";
import { DebugOverlaySystem } from "./systems/DebugOverlaySystem.js";


export class StarSystemScene extends Scene {
  constructor(services) {
    super(services);
    this.name = "Star System";
    this.ctx = createStarSystemCtx(services);

    // порядок важен
    this.add(new TimeSystem(services, this.ctx));
    this.add(new BootstrapSystem(services, this.ctx));
this.add(new CutsceneSystem(services, this.ctx));
    this.add(new CameraInputSystem(services, this.ctx));
    this.add(new ShipControlSystem(services, this.ctx));
    this.add(new EnemyAISystem(services, this.ctx));

    this.add(new EnemyFireSystem(services, this.ctx));
    this.add(new ProjectilesSystem(services, this.ctx));

    this.add(new CollisionsSystem(services, this.ctx));
    this.add(new PoiQuestSystem(services, this.ctx));

    this.add(new RelationIconsSystem(services, this.ctx));

    this.add(new RenderSystem(services, this.ctx));
        this.add(new HudSystem(services, this.ctx));

    this.add(new DebugOverlaySystem(services, this.ctx));

  }
}

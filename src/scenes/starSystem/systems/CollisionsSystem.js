import { System } from "../../../engine/core/lifecycle.js";
import {
  clearColliders,
  addCollider,
  buildColliderGrid,
  resolveDynamicCollisions,
  projectileHits,
  LAYER,
} from "../../../gameplay/collisions/colliders.js";
import { applyShipDamage } from "../../../gameplay/combat/applyShipDamage.js";

export class CollisionsSystem extends System {
  constructor(services, ctx) { super(services); this.ctx = ctx; }

  update(dt) {
    this.buildColliders();

    resolveDynamicCollisions(this.ctx.colliders, {
      kinds: ["ship"],
      iterations: 2,
      push: 1.0,
      damp: 1.2,
      setPos: (runtime, x, z) => { runtime.x = x; runtime.z = z; },
      getVel: (runtime) => ({ vx: runtime.vx ?? 0, vz: runtime.vz ?? 0 }),
      setVel: (runtime, vx, vz) => { runtime.vx = vx; runtime.vz = vz; },
    });

    const hits = projectileHits(this.ctx.colliders, { allowFriendlyFire: false });
    for (const h of hits) {
      const bullet = h.proj.ref;
      const targetRuntime = h.target.ref;
      if (!targetRuntime) continue;

      const dmg = bullet?.damage ?? this.ctx.projectiles.damage ?? 10;
      applyShipDamage(targetRuntime, dmg);
      if ((targetRuntime.armor ?? 0) <= 0) targetRuntime.dead = true;
      if (bullet) bullet.alive = false;
    }
  }

  buildColliders() {
    const state = this.s.get("state");
    const sys = this.ctx.system;

    clearColliders(this.ctx.colliders);

    const ships = state.ships || [];
    const playerShip = state.playerShip;

    for (const s of ships) {
      if (!s?.runtime) continue;
      if (s.runtime.dead) s.alive = false;
      if (s.alive === false) continue;

      const isPlayer = s === playerShip;
      const PHYS_MUL = 2.5;

      addCollider(this.ctx.colliders, {
        id: s.id,
        kind: "ship",
        x: s.runtime.x,
        z: s.runtime.z,
        r: (s.runtime.radius ?? 10) * PHYS_MUL,
        ref: s.runtime,
        alive: true,
        layer: isPlayer ? LAYER.PLAYER : LAYER.NPC,
        teamId: s.factionId ?? (isPlayer ? "player" : "npc"),
      });
    }

    // projectiles
    if (this.ctx.projectiles?.list) {
      for (let i = 0; i < this.ctx.projectiles.list.length; i++) {
        const b = this.ctx.projectiles.list[i];
        addCollider(this.ctx.colliders, {
          id: `bullet:${b.id ?? i}`,
          kind: "projectile",
          x: b.x,
          z: b.z,
          r: this.ctx.projectiles.hitRadius ?? 6,
          ref: b,
          alive: b.alive !== false,
          layer: LAYER.PROJECTILE,
          mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
          ownerId: b.ownerId ?? null,
          teamId: b.teamId ?? null,
          isTrigger: true,
        });
      }
    }

    // celestial (triggers)
    if (sys?.star) {
      const sunR = sys.star.radius * 10 * 0.95;
      addCollider(this.ctx.colliders, {
        id: "cel:sun",
        kind: "celestial",
        x: 0,
        z: 0,
        r: sunR,
        ref: null,
        alive: true,
        layer: LAYER.CELESTIAL,
        mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
        isTrigger: true,
      });
    }

    if (sys?.planets) {
      for (const p of sys.planets) {
        const a = this.ctx.time * p.speed + p.phase;
        const x = Math.cos(a) * p.orbitRadius;
        const z = Math.sin(a) * p.orbitRadius;
        const pr = (p.size ?? 10) * 1.05;
        addCollider(this.ctx.colliders, {
          id: `cel:planet:${p.id}`,
          kind: "celestial",
          x, z,
          r: pr,
          ref: null,
          alive: true,
          layer: LAYER.CELESTIAL,
          mask: LAYER.PLAYER | LAYER.NPC | LAYER.SHIP,
          isTrigger: true,
        });
      }
    }

    buildColliderGrid(this.ctx.colliders);
  }
}

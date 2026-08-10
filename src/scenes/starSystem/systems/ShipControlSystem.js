import { System } from "../../../engine/core/lifecycle.js";
import { raycastToGround } from "../../../gameplay/cameraRay.js";
import { tryFire, getWeaponPreset, WEAPON_PRESETS } from "../../../gameplay/weapons/projectiles.js";
import { findAutoTarget } from "../../../gameplay/combat/autoCombat.js";

export class ShipControlSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
  }

  update(dt) {
    if (this.ctx.inputLock?.ship) return;

    const input = this.s.get("input");
    const actions = this.s.get("actions");
    const state = this.s.get("state");
    const getView = this.s.get("getView");
    const getViewPx = this.s.get("getViewPx");

    const ship = state.playerShip;
    if (!ship?.runtime) return;

    const r = ship.runtime;

    // ==================================================
    // WEAPON
    // ==================================================
    if (this.ctx.weapons && WEAPON_PRESETS.length) {
      if (this.ctx.weapons.currentIndex == null) {
        this.ctx.weapons.currentIndex = 0;
      }
    }
    
    if (actions?.pressed("cycleWeapon")) {
      const next = (this.ctx.weapons.currentIndex + 1) % WEAPON_PRESETS.length;
      this.ctx.weapons.currentIndex = next;
    }

    const weapon = getWeaponPreset(this.ctx.weapons?.currentIndex ?? 0);
    const playerFaction = ship.factionId ?? state.player?.factionId ?? "player";

    // ==================================================
    // 🖱️ MOUSE CLICK → TARGET POINT
    // ==================================================
    if (actions?.pressed("clickPrimary")) {
      const m = input?.getMouse?.();
      if (m) {
        const viewPx = getViewPx ? getViewPx() : null;
        let w = viewPx?.w;
        let h = viewPx?.h;

        if (w == null || h == null) {
          const view = getView ? getView() : { w: 0, h: 0, dpr: 1 };
          const dpr = view?.dpr ?? 1;
          w = Math.floor((view?.w ?? 0) * dpr);
          h = Math.floor((view?.h ?? 0) * dpr);
        }

        const hit = raycastToGround(m.x, m.y, w, h, this.ctx.cam3d);
        if (hit) {
          r.targetX = hit.x;
          r.targetZ = hit.z;
        }
      }
    }

    // ==================================================
    // TARGET (Auto-combat) — ищем атакующего врага
    // ==================================================
    if (!("currentTarget" in this.ctx.autoCombat)) {
      this.ctx.autoCombat.currentTarget = null;
    }

    const targetData = findAutoTarget(
      r,
      state.ships || [],
      playerFaction,
      this.ctx.autoCombat.currentTarget,
    );

    this.ctx.autoCombat.currentTarget = targetData;

    // ==================================================
    // 🚀 ДВИЖЕНИЕ: всегда по targetX/Z или стоянка
    // ==================================================
    const hasTarget = Number.isFinite(r.targetX) && Number.isFinite(r.targetZ);

    if (hasTarget) {
      const dx = r.targetX - r.x;
      const dz = r.targetZ - r.z;
      const dist = Math.hypot(dx, dz);

      const arrivalRadius = 60;
      const stopRadius = 12;
      const cruiseSpeed = 220;
      const minSpeed = 25;

      if (dist < stopRadius) {
        r.targetX = null;
        r.targetZ = null;
        r.vx *= Math.pow(0.1, dt);
        r.vz *= Math.pow(0.1, dt);
      } else {
        // Если нет врага — поворачиваемся к точке
        if (!targetData) {
          const targetYaw = Math.atan2(dx, -dz);
          let yawDiff = targetYaw - (r.yaw ?? 0);
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          r.yaw = (r.yaw ?? 0) + yawDiff * Math.min(1, dt * 2.5);
        }

        let desiredSpeed = cruiseSpeed;
        if (dist < arrivalRadius) {
          const t = (dist - stopRadius) / (arrivalRadius - stopRadius);
          desiredSpeed = minSpeed + (cruiseSpeed - minSpeed) * Math.max(0, t);
        }

        const fx = Math.sin(r.yaw);
        const fz = -Math.cos(r.yaw);
        const k = Math.min(1, dt * 2);
        r.vx = lerp(r.vx, fx * desiredSpeed, k);
        r.vz = lerp(r.vz, fz * desiredSpeed, k);
      }

      r.x += r.vx * dt;
      r.z += r.vz * dt;
    } else {
      // Нет целевой точки — стоим на месте
      r.vx *= Math.pow(0.05, dt);
      r.vz *= Math.pow(0.05, dt);
      if (Math.hypot(r.vx, r.vz) < 1) {
        r.vx = 0;
        r.vz = 0;
      }
    }

    // ==================================================
    // 🎯 АВТОБОЙ: автоматическая стрельба по атакующему врагу
    // ==================================================
    if (targetData) {
      this.ctx.autoCombat.enabled = true;

      const targetShip = targetData.ship;
      const targetRuntime = targetShip.runtime;

      // Поворот к врагу для стрельбы
      const dx = targetRuntime.x - r.x;
      const dz = targetRuntime.z - r.z;
      const dist = Math.hypot(dx, dz);
      const targetYaw = Math.atan2(dx, -dz);

      let yawDiff = targetYaw - (r.yaw ?? 0);
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      r.yaw = (r.yaw ?? 0) + yawDiff * Math.min(1, dt * 3.0);

      // Проверка стрельбы
      const nx = dx / dist;
      const nz = dz / dist;
      const fx = Math.sin(r.yaw ?? 0);
      const fz = -Math.cos(r.yaw ?? 0);
      const dot = fx * nx + fz * nz;

      const maxFireRange = 550;
      const fireArcCos = 0.6;
      const inRange = dist <= maxFireRange;
      const inArc = dot >= fireArcCos;
      const shouldFire = inRange && inArc;

      if (shouldFire && weapon) {
        for (let i = 0; i < weapon.pellets; i++) {
          const side = weapon.pellets > 1 ? (i - (weapon.pellets - 1) * 0.5) * 1.2 : 0;

          tryFire(
            this.ctx.projectiles,
            r,
            ship.id,
            dt,
            true,
            {
              teamId: playerFaction,
              targetId: targetShip.id,
              targetX: targetRuntime.x,
              targetZ: targetRuntime.z,
              damage: weapon.damage,
              bulletSpeed: weapon.bulletSpeed,
              bulletLife: weapon.bulletLife,
              spread: weapon.spread,
              fireCooldown: weapon.fireCooldown,
              muzzleSide: side,
              presetId: weapon.id,
              ignoreCooldown: i > 0,
            },
          );
        }
      }
    } else {
      this.ctx.autoCombat.enabled = false;
    }

    this.updateFlame(dt, r);
    this.applyFollowCamera(dt, r);
  }

  updateFlame(dt, r) {
    if (!this.ctx.flame) return;

    const fx = Math.sin(r.yaw ?? 0);
    const fz = -Math.cos(r.yaw ?? 0);

    const throttle = Math.hypot(r.vx ?? 0, r.vz ?? 0) > 10 ? 1.0 : 0.2;

    this.ctx.flame.update(
      dt,
      [r.x, 0, r.z],
      [fx, 0, fz],
      throttle,
    );
  }

  applyFollowCamera(dt, r) {
    const cam = this.ctx.cam3d;
    const c = this.ctx.followCam;

    const ax = r.x;
    const az = r.z;

    const yaw = c.yawOffset;
    const fwdX = Math.sin(yaw);
    const fwdZ = -Math.cos(yaw);

    const tx = ax + fwdX * c.targetAhead;
    const ty = c.targetLift;
    const tz = az + fwdZ * c.targetAhead;

    const cosP = Math.cos(c.pitch);
    const sinP = Math.sin(c.pitch);

    const backX = Math.sin(yaw) * (c.distance * cosP);
    const backZ = -Math.cos(yaw) * (c.distance * cosP);

    const ex = tx - backX;
    const ez = tz - backZ;
    const ey = c.height + -sinP * c.distance;

    const k = 1 - Math.exp(-c.smooth * dt);

    cam.target[0] = lerp(cam.target[0], tx, k);
    cam.target[1] = lerp(cam.target[1], ty, k);
    cam.target[2] = lerp(cam.target[2], tz, k);

    cam.eye[0] = lerp(cam.eye[0], ex, k);
    cam.eye[1] = lerp(cam.eye[1], ey, k);
    cam.eye[2] = lerp(cam.eye[2], ez, k);

    stabilizeUp(cam);
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function stabilizeUp(cam) {
  const ex0 = cam.eye[0], ey0 = cam.eye[1], ez0 = cam.eye[2];
  const tx0 = cam.target[0], ty0 = cam.target[1], tz0 = cam.target[2];

  let fx0 = tx0 - ex0, fy0 = ty0 - ey0, fz0 = tz0 - ez0;
  const fl = Math.hypot(fx0, fy0, fz0) || 1;
  fx0 /= fl; fy0 /= fl; fz0 /= fl;

  const wux = 0, wuy = 1, wuz = 0;

  let rx0 = wuy * fz0 - wuz * fy0;
  let ry0 = wuz * fx0 - wux * fz0;
  let rz0 = wux * fy0 - wuy * fx0;
  let rl = Math.hypot(rx0, ry0, rz0);

  if (rl < 1e-6) {
    const awx = 0, awy = 0, awz = 1;
    rx0 = awy * fz0 - awz * fy0;
    ry0 = awz * fx0 - awx * fz0;
    rz0 = awx * fy0 - awy * fx0;
    rl = Math.hypot(rx0, ry0, rz0) || 1;
  }

  rx0 /= rl; ry0 /= rl; rz0 /= rl;

  const ux0 = fy0 * rz0 - fz0 * ry0;
  const uy0 = fz0 * rx0 - fx0 * rz0;
  const uz0 = fx0 * ry0 - fy0 * rx0;

  cam.up[0] = ux0; cam.up[1] = uy0; cam.up[2] = uz0;
}
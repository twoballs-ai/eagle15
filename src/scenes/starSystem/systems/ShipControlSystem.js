// src/scenes/starSystem/systems/ShipControlSystem.js
import { System } from "../../../engine/core/lifecycle.js";
import { raycastToGround } from "../../../gameplay/cameraRay.js";
import { tryFire } from "../../../gameplay/weapons/projectiles.js";
import { findAutoTarget } from "../../../gameplay/combat/autoCombat.js";
import { stepShipMovement } from "../../../gameplay/shipMovement.js";
import { getAutopilotControls } from "../../../gameplay/shipController.js";
import { getWeapon } from "../../../data/items/weapons.js"; // ✅ ЕДИНСТВЕННЫЙ источник данных об оружии

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
    const playerFaction = ship.factionId ?? state.player?.factionId ?? "player";

    // Инициализируем карту кулдаунов для каждого типа оружия на корабле
    if (!r._weaponCooldowns) r._weaponCooldowns = new Map();
    r._weaponCooldowns.forEach((val, key) => r._weaponCooldowns.set(key, val - dt));

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
    // TARGET (Auto-combat)
    // ==================================================
    if (!("currentTarget" in this.ctx.autoCombat)) {
      this.ctx.autoCombat.currentTarget = null;
    }
    const targetData = findAutoTarget(r, state.ships || [], playerFaction, this.ctx.autoCombat.currentTarget);
    this.ctx.autoCombat.currentTarget = targetData;

    // ==================================================
    // 🚀 ДВИЖЕНИЕ
    // ==================================================
    const hasTarget = Number.isFinite(r.targetX) && Number.isFinite(r.targetZ);
    let controls = null;

    if (hasTarget) {
      controls = getAutopilotControls(r);
    } else if (targetData) {
      const targetRuntime = targetData.ship.runtime;
      const dx = targetRuntime.x - r.x;
      const dz = targetRuntime.z - r.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0) {
        const targetYaw = Math.atan2(dx, -dz);
        let yawDiff = targetYaw - (r.yaw ?? 0);
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        r.yaw = (r.yaw ?? 0) + yawDiff * Math.min(1, dt * 3.0);
      }
      controls = { throttle: 0, turn: 0, boost: false, manual: false };
    } else {
      controls = { throttle: 0, turn: 0, boost: false, manual: false };
    }

    const { fx, fz } = stepShipMovement(r, controls, dt, { boundsRadius: this.ctx.boundsRadius });

    // ==================================================
    // 🎯 СТРЕЛЬБА: Перебираем ВСЕ слоты оружия
    // ==================================================
    if (targetData && ship.weaponSlots) {
      this.ctx.autoCombat.enabled = true;
      const targetRuntime = targetData.ship.runtime;
      const dx = targetRuntime.x - r.x;
      const dz = targetRuntime.z - r.z;
      const dist = Math.hypot(dx, dz);
      
      if (dist > 0) {
        const nx = dx / dist;
        const nz = dz / dist;
        const fxFire = Math.sin(r.yaw ?? 0);
        const fzFire = -Math.cos(r.yaw ?? 0);
        const dot = fxFire * nx + fzFire * nz;
        const inArc = dot >= 0.6; // fireArcCos

        // ✅ ЦИКЛ ПО ВСЕМ СЛОТАМ ОРУЖИЯ
        ship.weaponSlots.forEach((slot, slotIndex) => {
          if (!slot?.item) return; // Слот пуст

          const weaponData = getWeapon(slot.item.id);
          if (!weaponData) return;

          const maxFireRange = weaponData.range || 800;
          const inRange = dist <= maxFireRange;

          if (inRange && inArc) {
            const cdKey = `slot_${slotIndex}`;
            const currentCd = r._weaponCooldowns.get(cdKey) || 0;

            if (currentCd <= 0) {
              // Устанавливаем кулдаун
              r._weaponCooldowns.set(cdKey, weaponData.fireCooldown);

              // Стреляем (учитываем pellets для дробовика и т.д.)
              const pellets = weaponData.pellets || 1;
              for (let i = 0; i < pellets; i++) {
                const side = pellets > 1 ? (i - (pellets - 1) * 0.5) * 1.2 : 0;
                tryFire(
                  this.ctx.projectiles, r, ship.id, dt, true,
                  {
                    teamId: playerFaction,
                    targetId: targetData.ship.id,
                    targetX: targetRuntime.x,
                    targetZ: targetRuntime.z,
                    damage: weaponData.damage,
                    bulletSpeed: weaponData.bulletSpeed,
                    bulletLife: weaponData.bulletLife,
                    spread: weaponData.spread,
                    fireCooldown: weaponData.fireCooldown,
                    muzzleSide: side,
                    presetId: weaponData.id, // ✅ ID из каталога для VFX
                    ignoreCooldown: i > 0,
                  }
                );
              }
            }
          }
        });
      }
    } else {
      this.ctx.autoCombat.enabled = false;
    }

    this.updateFlame(dt, r, fx, fz);
    this.applyFollowCamera(dt, r);
  }

  updateFlame(dt, r, fx, fz) {
    if (!this.ctx.flame) return;
    const speed = Math.hypot(r.vx ?? 0, r.vz ?? 0);
    const throttle = speed > 5 ? Math.min(1.0, speed / 100) : 0;
    this.ctx.flame.update(dt, [r.x, 0, r.z], [fx, 0, fz], throttle);
  }

  applyFollowCamera(dt, r) {
    const cam = this.ctx.cam3d;
    const c = this.ctx.followCam;
    const ax = r.x, az = r.z;
    const yaw = c.yawOffset;
    const fwdX = Math.sin(yaw), fwdZ = -Math.cos(yaw);
    const tx = ax + fwdX * c.targetAhead;
    const ty = c.targetLift;
    const tz = az + fwdZ * c.targetAhead;
    const cosP = Math.cos(c.pitch), sinP = Math.sin(c.pitch);
    const backX = Math.sin(yaw) * (c.distance * cosP);
    const backZ = -Math.cos(yaw) * (c.distance * cosP);
    const ex = tx - backX, ez = tz - backZ, ey = c.height + -sinP * c.distance;
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
    rx0 = 0 * fz0 - 1 * fy0; ry0 = 1 * fx0 - 0 * fz0; rz0 = 0 * fy0 - 0 * fx0;
    rl = Math.hypot(rx0, ry0, rz0) || 1;
  }
  rx0 /= rl; ry0 /= rl; rz0 /= rl;
  cam.up[0] = fy0 * rz0 - fz0 * ry0;
  cam.up[1] = fz0 * rx0 - fx0 * rz0;
  cam.up[2] = fx0 * ry0 - fy0 * rx0;
}
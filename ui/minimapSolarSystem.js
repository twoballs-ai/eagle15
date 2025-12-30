// ui/minimapSolarSystemHUD.js
export class MinimapSolarSystem {
  constructor({
    size = 180,
    padding = 12,

    // авто-масштаб: сколько % от окна занимает крайняя орбита (0.85..0.95)
    fit = 0.90,

    // минимальные/максимальные размеры точек на карте (в пикселях)
    minBodyPx = 2.0,
    maxBodyPx = 10.0,
    minStarPx = 3.0,
    maxStarPx = 16.0,
  } = {}) {
    this.size = size;
    this.padding = padding;
    this.fit = fit;
    this.minBodyPx = minBodyPx;
    this.maxBodyPx = maxBodyPx;
    this.minStarPx = minStarPx;
    this.maxStarPx = maxStarPx;
  }

  draw(game, scene) {
    const { r3d, getView, state } = game;
    if (!r3d || !scene?.system) return;

    const view = getView();
    const dpr = game.runtime?.dpr ?? 1;

    const size = Math.floor(this.size * dpr);
    const pad  = Math.floor(this.padding * dpr);

    const x = view.w - pad - size;
    const y = pad;

    // окно миникарты (viewport+scissor + ortho 0..size)
    r3d.beginOverlayRect(view, x, y, size, size);

    const gl = game.gl;
    gl.clearColor(0.03, 0.05, 0.09, 0.75);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const { star, planets } = scene.system;
    const ship = state.playerShip?.runtime;

    const cx = size * 0.5;
    const cy = size * 0.5;

    const radius = size * 0.5 - 3;           // внешний радиус рамки в px
    const usable = radius * this.fit;        // куда помещаем систему

    // ---------- АВТО-МАСШТАБ ПО РАЗМЕРУ СИСТЕМЫ ----------
    // максимум: крайняя орбита + размер планеты (чтобы не обрезало)
    let maxR = star.radius; // на всякий
    for (const p of planets) {
      const r = p.orbitRadius + p.size;
      if (r > maxR) maxR = r;
    }
    // world->px коэффициент
    const k = usable / Math.max(1e-6, maxR);

    const toMap = (wx, wz) => [cx + wx * k, cy + wz * k];

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // ---------- РАМКА ----------
    r3d.drawCircle2D(cx, cy, radius, 120, [1, 1, 1, 0.28]);

    // ---------- ОРБИТЫ (влезают всегда, т.к. k по maxR) ----------
    for (const p of planets) {
      const rr = p.orbitRadius * k;
      r3d.drawCircle2D(cx, cy, rr, 120, [0.7, 0.8, 1.0, 0.10]);
    }

    // ---------- СОЛНЦЕ (масштабное, но с clamp) ----------
    const starPx = clamp(star.radius * k, this.minStarPx * dpr, this.maxStarPx * dpr);
    r3d.drawDisc([cx, cy, 0], starPx, [1.0, 0.86, 0.60, 0.95], 0.15);

    // ---------- ПЛАНЕТЫ ----------
    for (const p of planets) {
      const a = scene.time * p.speed + p.phase;
      const wx = Math.cos(a) * p.orbitRadius;
      const wz = Math.sin(a) * p.orbitRadius;

      const [mx, my] = toMap(wx, wz);

      const prPx = clamp(p.size * k, this.minBodyPx * dpr, this.maxBodyPx * dpr);
      r3d.drawDisc([mx, my, 0], prPx, [0.75, 0.85, 1.0, 0.85], 0.18);
    }

    // ---------- ЦЕЛЬ ----------
    if (ship?.targetX != null && ship?.targetZ != null) {
      const [mx, my] = toMap(ship.targetX, ship.targetZ);
      r3d.drawCircle2D(mx, my, 7 * dpr, 40, [0.3, 1.0, 0.5, 0.9]);
    }

    // ---------- КОРАБЛЬ ----------
    if (ship) {
      const [mx, my] = toMap(ship.x, ship.z);
      r3d.drawDisc([mx, my, 0], 3.2 * dpr, [0.5, 0.9, 1.0, 0.95], 0.22);

      const nx = mx + Math.cos(ship.yaw) * 9 * dpr;
      const ny = my + Math.sin(ship.yaw) * 9 * dpr;
      r3d.drawDisc([nx, ny, 0], 2.0 * dpr, [1.0, 0.65, 0.25, 0.95], 0.22);
    }

    r3d.endOverlayRect();
  }
}

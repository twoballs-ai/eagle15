// src/engine/renderer/vfx/ImpulseLaserRenderer.js

function findShipRuntime(projectile, ships) {
    if (projectile.targetId == null) return null;

    for (const ship of ships) {
        if (ship?.id === projectile.targetId && ship.runtime) {
            return ship.runtime;
        }
    }

    return null;
}

export function renderImpulseLaser(
    r3d,
    gl,
    projectile,
    vfxConfig,
    ships,
    time = 0
) {
    const target = findShipRuntime(projectile, ships);

    if (!target) return;

    const sx = projectile.x;
    const sz = projectile.z;

    const ex = target.x;
    const ez = target.z;

    const y = 1.2;

    const color = vfxConfig.color || [0.2, 0.9, 1.0];
    const coreColor = vfxConfig.coreColor || [1, 1, 1];

    const dx = ex - sx;
    const dz = ez - sz;
    const dist = Math.hypot(dx, dz);

    if (dist < 1) return;

    const nx = dx / dist;
    const nz = dz / dist;

    // Луч чуть не доходит до центра корабля
    const impactOffset = 8;

    const ix = ex - nx * impactOffset;
    const iz = ez - nz * impactOffset;

    const beam = new Float32Array([
        sx, y, sz,
        ix, y, iz
    ]);

    const prevBlend = gl.getParameter(gl.BLEND);
    const prevSrc = gl.getParameter(gl.BLEND_SRC_RGB);
    const prevDst = gl.getParameter(gl.BLEND_DST_RGB);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // =====================================================
    // ВНЕШНЕЕ СВЕЧЕНИЕ
    // =====================================================

    r3d.drawLineStrip(
        beam,
        [color[0], color[1], color[2], 0.12]
    );

    r3d.drawLineStrip(
        beam,
        [color[0], color[1], color[2], 0.28]
    );

    // =====================================================
    // ОСНОВНОЙ ЛУЧ
    // =====================================================

    r3d.drawLineStrip(
        beam,
        [color[0], color[1], color[2], 0.65]
    );

    // =====================================================
    // БЕЛОЕ ЯДРО
    // =====================================================

    r3d.drawLineStrip(
        beam,
        [coreColor[0], coreColor[1], coreColor[2], 0.95]
    );

    // =====================================================
    // ВСПЫШКА У СТВОЛА
    // =====================================================

    const muzzleLen = 14;

    const mx = sx + nx * muzzleLen;
    const mz = sz + nz * muzzleLen;

    r3d.drawLineStrip(
        new Float32Array([
            sx, y, sz,
            mx, y, mz
        ]),
        [1, 1, 1, 1]
    );

    r3d.drawLineStrip(
        new Float32Array([
            sx, y, sz,
            mx + nx * 8, y, mz + nz * 8
        ]),
        [color[0], color[1], color[2], 0.45]
    );

    // =====================================================
    // ВСПЫШКА ПОПАДАНИЯ
    // =====================================================

    const hitLen = 16;

    r3d.drawLineStrip(
        new Float32Array([
            ix - nx * hitLen, y, iz - nz * hitLen,
            ix + nx * hitLen, y, iz + nz * hitLen
        ]),
        [1, 1, 1, 1]
    );

    r3d.drawLineStrip(
        new Float32Array([
            ix - nx * hitLen * 1.8, y, iz - nz * hitLen * 1.8,
            ix + nx * hitLen * 1.8, y, iz + nz * hitLen * 1.8
        ]),
        [color[0], color[1], color[2], 0.5]
    );

    // =====================================================

    if (!prevBlend) {
        gl.disable(gl.BLEND);
    } else {
        gl.blendFunc(prevSrc, prevDst);
    }
}
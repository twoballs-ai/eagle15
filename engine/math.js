export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.hypot(dx, dy);
}

// 3x3 matrix for 2D affine transforms in column-major order
// [ m0 m3 m6 ]
// [ m1 m4 m7 ]
// [ m2 m5 m8 ]  (we'll keep last row 0,0,1)
export function mat3Identity() {
  return new Float32Array([1,0,0,  0,1,0,  0,0,1]);
}

// Ortho projection to NDC with camera pan/zoom baked in (world->clip)
export function mat3WorldToClip(viewW, viewH, camX, camY, zoom) {
  // screen = (world - cam) * zoom + (view/2)
  // clip = (screen / view)*2 - 1, with y flipped (top-left to clip)
  // Combine into a single affine:
  //
  // clipX = ((worldX - camX)*zoom + viewW/2) * (2/viewW) - 1
  //      = worldX*(zoom*2/viewW) + (-camX*zoom*2/viewW) + (viewW/2)*(2/viewW) - 1
  //      = worldX*sx + tx, where tx = (-camX*zoom*2/viewW) + 1 - 1 = (-camX*zoom*2/viewW)
  //
  // clipY: screenY grows down, clipY grows up:
  // clipY = 1 - ((worldY - camY)*zoom + viewH/2) * (2/viewH)
  //      = worldY*(-zoom*2/viewH) + (camY*zoom*2/viewH) + 1 - 1
  //      = worldY*sy + ty, where sy negative.
  const sx = (zoom * 2) / viewW;
  const sy = -(zoom * 2) / viewH;
  const tx = (-camX * zoom * 2) / viewW;
  const ty = (camY * zoom * 2) / viewH;

  // mat3:
  // [ sx  0  tx ]
  // [ 0  sy  ty ]
  // [ 0   0  1  ]
  return new Float32Array([sx,0,0,  0,sy,0,  tx,ty,1]);
}

export function screenToWorld(screenX, screenY, viewW, viewH, camX, camY, zoom) {
  // world = cam + (screen - view/2)/zoom
  const wx = camX + (screenX - viewW * 0.5) / zoom;
  const wy = camY + (screenY - viewH * 0.5) / zoom;
  return { x: wx, y: wy };
}

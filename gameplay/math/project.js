// gameplay/math/project.js
import { vec4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export function projectWorldToScreen(x, y, z, vp, view) {
  const p = vec4.fromValues(x, y, z, 1);
  vec4.transformMat4(p, p, vp);

  // за камерой
  if (p[3] <= 0.00001) return null;

  const ndcX = p[0] / p[3];
  const ndcY = p[1] / p[3];
  const ndcZ = p[2] / p[3];

  // вне clip-space по Z тоже можно прятать
  if (ndcZ < -1 || ndcZ > 1) return null;

  // NDC -> экран (top-left origin)
  const sx = (ndcX * 0.5 + 0.5) * view.w;
  const sy = (-ndcY * 0.5 + 0.5) * view.h;

  return { x: sx, y: sy, z: ndcZ };
}

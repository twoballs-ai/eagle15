// gameplay/poi/poiRuntimeOrbit.js
// Runtime POI: enter/exit + focus. Подходит для "движущихся планет",
// если ты даёшь функцию resolvePos(poi) -> {x,z}

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export class PoiRuntimeOrbit {
  constructor({ poiDef, resolvePos }) {
    this.poiDef = poiDef || [];
    this.resolvePos = resolvePos; // (poi) => {x,z} | null

    this._inside = {}; // { [poiId]: bool }
    this.currentFocusId = null;
  }

  update(ship) {
    const entered = [];
    let focus = null;
    let bestD2 = Infinity;

    for (const p of this.poiDef) {
      const pos = this.resolvePos(p);
      if (!pos) continue;

      const d2 = dist2(ship.x, ship.z, pos.x, pos.z);

      // focus (для подсказки)
      const ir = (p.interactRadius ?? p.radius ?? 100);
      const ir2 = ir * ir;
      if (d2 <= ir2 && d2 < bestD2) {
        bestD2 = d2;
        focus = { ...p, worldX: pos.x, worldZ: pos.z, d2 };
      }

      // enter (только в момент входа)
      const r = (p.radius ?? p.interactRadius ?? 120);
      const r2 = r * r;

      const wasInside = !!this._inside[p.id];
      const isInside = d2 <= r2;

      if (!wasInside && isInside) {
        this._inside[p.id] = true;
        entered.push({ ...p, worldX: pos.x, worldZ: pos.z });
      } else if (wasInside && !isInside) {
        this._inside[p.id] = false;
      }
    }

    this.currentFocusId = focus?.id ?? null;
    return { entered, focus };
  }
}

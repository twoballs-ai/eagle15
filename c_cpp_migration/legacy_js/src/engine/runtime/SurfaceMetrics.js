// engine/runtime/SurfaceMetrics.js
export class SurfaceMetrics {
  constructor({
    canvas,
    gl,
    getUiRect,
    getDpr,
    clampDpr = (dpr) => Math.max(1, Math.min(2, dpr)),
  } = {}) {
    this.canvas = canvas;
    this.gl = gl;

    this.getUiRect =
      getUiRect ??
      (() => {
        const r = this.canvas.getBoundingClientRect();
        // fallback если canvas ещё не разложен
        const w = r.width || this.canvas.clientWidth || 1;
        const h = r.height || this.canvas.clientHeight || 1;
        return { x: r.left || 0, y: r.top || 0, w, h };
      });

    this.getDpr = getDpr ?? (() => window.devicePixelRatio || 1);
    this.clampDpr = clampDpr;

    this.value = {
      dpr: 1,
      canvasCssRect: { x: 0, y: 0, w: 1, h: 1 },
      buffer: { w: 1, h: 1 },
      scale: { x: 1, y: 1 },
    };
  }

  applyCanvasSize() {
    const r = this.getUiRect();
    const dpr = this.clampDpr(this.getDpr());

    const bw = Math.max(1, Math.floor((r.w || 1) * dpr));
    const bh = Math.max(1, Math.floor((r.h || 1) * dpr));

    if (this.canvas.width !== bw) this.canvas.width = bw;
    if (this.canvas.height !== bh) this.canvas.height = bh;

    return { r, dpr, bw, bh };
  }

  update() {
    const r = this.getUiRect();

    const bw = this.gl?.drawingBufferWidth ?? this.canvas.width ?? 1;
    const bh = this.gl?.drawingBufferHeight ?? this.canvas.height ?? 1;

    const sx = r.w > 0 ? bw / r.w : 1;
    const sy = r.h > 0 ? bh / r.h : 1;

    const dpr = r.w > 0 ? bw / r.w : 1;

    this.value = {
      dpr,
      canvasCssRect: { x: r.x, y: r.y, w: r.w, h: r.h },
      buffer: { w: bw, h: bh },
      scale: { x: sx, y: sy },
    };

    return this.value;
  }

  viewportToCanvasCss(pt) {
    const c = this.value.canvasCssRect;
    return { x: pt.x - c.x, y: pt.y - c.y };
  }

  canvasCssToBuffer(pt) {
    const s = this.value.scale;
    return { x: Math.floor(pt.x * s.x), y: Math.floor(pt.y * s.y) };
  }

  viewportToBuffer(pt) {
    return this.canvasCssToBuffer(this.viewportToCanvasCss(pt));
  }

  viewportRectToCanvasCssRect(rc) {
    const c = this.value.canvasCssRect;
    return { x: rc.x - c.x, y: rc.y - c.y, w: rc.w, h: rc.h };
  }

  canvasCssRectToBufferRect(rc) {
    const s = this.value.scale;
    const b = this.value.buffer;
    return {
      x: Math.floor(rc.x * s.x),
      y: Math.floor(rc.y * s.y),
      w: Math.floor(rc.w * s.x),
      h: Math.floor(rc.h * s.y),
      bufW: b.w,
      bufH: b.h,
    };
  }

  viewportRectToBufferRect(rc) {
    return this.canvasCssRectToBufferRect(this.viewportRectToCanvasCssRect(rc));
  }

  elementToRects(el) {
    const r = el.getBoundingClientRect();
    const viewportRect = { x: r.left, y: r.top, w: r.width, h: r.height };
    const canvasCssRect = this.viewportRectToCanvasCssRect(viewportRect);
    const bufferRect = this.canvasCssRectToBufferRect(canvasCssRect);
    return { viewportRect, canvasCssRect, bufferRect };
  }
}

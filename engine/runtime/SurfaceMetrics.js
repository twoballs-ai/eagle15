// engine/runtime/SurfaceMetrics.js
export class SurfaceMetrics {
  constructor({ canvas, gl, getUiRect } = {}) {
    this.canvas = canvas;
    this.gl = gl;

    // UI-rect поверхности в "логических" пикселях (на Web это CSS px)
    this.getUiRect =
      getUiRect ??
      (() => {
        const r = this.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      });

    this.value = {
      canvasCssRect: { x: 0, y: 0, w: 1, h: 1 },
      buffer: { w: 1, h: 1 },     // drawingBuffer px (истина для GL)
      scale: { x: 1, y: 1 },      // CSS -> buffer
    };
  }

  update() {
    const r = this.getUiRect();
    const gl = this.gl;

    const bw = gl?.drawingBufferWidth ?? this.canvas.width ?? 1;
    const bh = gl?.drawingBufferHeight ?? this.canvas.height ?? 1;

    const sx = r.w > 0 ? bw / r.w : 1;
    const sy = r.h > 0 ? bh / r.h : 1;

    this.value = {
      canvasCssRect: { x: r.x, y: r.y, w: r.w, h: r.h },
      buffer: { w: bw, h: bh },
      scale: { x: sx, y: sy },
    };

    return this.value;
  }

  // ===== points =====

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

  // ===== rects =====

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

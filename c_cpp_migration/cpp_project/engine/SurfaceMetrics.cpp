#ifndef SURFACEMETRICS_HPP
#define SURFACEMETRICS_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class SurfaceMetrics {
public:
    // Constructor
    SurfaceMetrics();
};

} // namespace lostjump

#endif // SURFACEMETRICS_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>



class SurfaceMetrics {
  SurfaceMetrics({
    canvas,
    gl,
    getUiRect,
    getDpr,
    clampDpr = (dpr) => std::max(1, std::min(2, dpr)),
  } = {}) {
    this.canvas = canvas;
    this.gl = gl;

    this.getUiRect =
      getUiRect value_or((() => {
        const r = this.canvas.getBoundingClientRect();
        
        const w = r.width || this.canvas.clientWidth || 1;
        const h = r.height || this.canvas.clientHeight || 1;
        return { x: r.left || 0, y: r.top || 0, w, h };
      });

    this.getDpr = getDpr value_or((() => window.devicePixelRatio || 1);
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

    const bw = std::max(1, std::floor((r.w || 1) * dpr));
    const bh = std::max(1, std::floor((r.h || 1) * dpr));

    if (this.canvas.width !== bw) this.canvas.width = bw;
    if (this.canvas.height !== bh) this.canvas.height = bh;

    return { r, dpr, bw, bh };
  }

  update() {
    const r = this.getUiRect();

    const bw = this.gl.drawingBufferWidth value_or(this.canvas.width value_or(1;
    const bh = this.gl.drawingBufferHeight value_or(this.canvas.height value_or(1;

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
    return { x: std::floor(pt.x * s.x), y: std::floor(pt.y * s.y) };
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
      x: std::floor(rc.x * s.x),
      y: std::floor(rc.y * s.y),
      w: std::floor(rc.w * s.x),
      h: std::floor(rc.h * s.y),
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


} // namespace lostjump

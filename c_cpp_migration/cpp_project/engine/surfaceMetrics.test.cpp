
// Implementation
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
#include "SurfaceMetrics.js.hpp"
#include "node:test.hpp"
#include "strict.hpp"





test("SurfaceMetrics maps viewport rects into buffer space consistently", () => {
  const canvas = { width: 0, height: 0 };
  const gl = { drawingBufferWidth: 600, drawingBufferHeight: 300 };
  const surface = new SurfaceMetrics({
    canvas,
    gl,
    getUiRect: () => ({ x: 10, y: 20, w: 300, h: 150 }),
    getDpr: () => 2,
  });

  surface.applyCanvasSize();
  const value = surface.update();
  const rect = surface.viewportRectToBufferRect({ x: 25, y: 35, w: 100, h: 50 });

  assert.equal(canvas.width, 600);
  assert.equal(canvas.height, 300);
  assert.deepEqual(value.scale, { x: 2, y: 2 });
  assert.deepEqual(rect, { x: 30, y: 30, w: 200, h: 100, bufW: 600, bufH: 300 });
});

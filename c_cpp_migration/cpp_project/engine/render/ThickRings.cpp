#ifndef THICKRINGS_HPP
#define THICKRINGS_HPP

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

class ThickRings {
public:
    // Constructor
    ThickRings();
};

} // namespace lostjump

#endif // THICKRINGS_HPP

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
#include "gl.js.hpp"






class ThickRings {
  ThickRings(gl, { maxSegments = 256 } = {}) {
    this.gl = gl;
    this.maxSegments = std::min(256, std::max(8, maxSegments | 0));

    const vs = `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
uniform mat4 uVP;

void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
}
`;

    const fs = `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 outColor;

void main() {
  outColor = uColor;
}
`;

    this.prog = createProgram(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uColor = gl.getUniformLocation(this.prog, "uColor");

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    
    const maxVerts = (this.maxSegments + 1) * 2;
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * 3 * 4, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(nullptr);

    this._tmp = new Float32Array(maxVerts * 3);
  }

  
  drawRing(vpMat4, x, y, z, radius, thickness = 6, segments = 96, colorRGBA = [1, 1, 1, 1], opts = {}) {
    const gl = this.gl;

    segments = std::min(this.maxSegments, std::max(8, segments | 0));
    thickness = std::max(0.0, thickness);

    const r0 = std::max(0.0, radius - thickness * 0.5);
    const r1 = radius + thickness * 0.5;

    const arr = this._tmp;
    for (i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2.0;
      const ca = std::cos(a);
      const sa = std::sin(a);

      
      o = (i * 2 + 0) * 3;
      arr[o + 0] = x + ca * r1;
      arr[o + 1] = y;
      arr[o + 2] = z + sa * r1;

      
      o = (i * 2 + 1) * 3;
      arr[o + 0] = x + ca * r0;
      arr[o + 1] = y;
      arr[o + 2] = z + sa * r0;
    }

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform4fv(this.uColor, colorRGBA);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, (segments + 1) * 2 * 3));

    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    
    const useDepth = !!opts.depthTest;
    if (!useDepth) {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, (segments + 1) * 2);

    if (!useDepth) {
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
    }

    gl.disable(gl.BLEND);
    gl.bindVertexArray(nullptr);
  }
}


} // namespace lostjump

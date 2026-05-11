#ifndef EXTRUDEDRINGS_HPP
#define EXTRUDEDRINGS_HPP

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

class ExtrudedRings {
public:
    // Constructor
    ExtrudedRings();
};

} // namespace lostjump

#endif // EXTRUDEDRINGS_HPP

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






function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || "Shader compile failed");
  }
  return s;
}

function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "Program link failed");
  }
  return p;
}

class ExtrudedRings {
  ExtrudedRings(gl, { maxSegments = 256 } = {}) {
    this.gl = gl;
    this.maxSegments = std::min(256, std::max(8, maxSegments | 0));

    const vs = compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;

uniform mat4 uVP;

out vec3 vNrm;

void main() {
  vNrm = aNrm;
  gl_Position = uVP * vec4(aPos, 1.0);
}
`,
    );

    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
precision highp float;

in vec3 vNrm;

uniform vec4 uColor;     
uniform vec3 uLightDir;  
uniform float uAmbient;  
uniform float uDiffuse;  
uniform float uEmissive; 

out vec4 outColor;

void main() {
  vec3 N = normalize(vNrm);
  float ndl = max(0.0, dot(N, normalize(uLightDir)));
  vec3 lit = uColor.rgb * (uAmbient + uDiffuse * ndl) + uColor.rgb * uEmissive;
  outColor = vec4(lit, uColor.a);
}
`,
    );

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uColor = gl.getUniformLocation(this.prog, "uColor");
    this.uLightDir = gl.getUniformLocation(this.prog, "uLightDir");
    this.uAmbient = gl.getUniformLocation(this.prog, "uAmbient");
    this.uDiffuse = gl.getUniformLocation(this.prog, "uDiffuse");
    this.uEmissive = gl.getUniformLocation(this.prog, "uEmissive");

    
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    
    
    
    
    
    
    const maxVerts = 8 * (this.maxSegments + 1);
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * 6 * 4, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    gl.bindVertexArray(nullptr);

    this._tmp = new Float32Array(maxVerts * 6);
  }

  
  drawRing(vpMat4, x, y, z, radius, thickness = 10, height = 6, segments = 96, colorRGBA = [1, 0, 0, 1], opts = {}) {
    const gl = this.gl;

    segments = std::min(this.maxSegments, std::max(8, segments | 0));
    thickness = std::max(0.0, thickness);
    height = std::max(0.0001, height);

    const rIn = std::max(0.0, radius - thickness * 0.5);
    const rOut = radius + thickness * 0.5;

    const yTop = y + height * 0.5;
    const yBot = y - height * 0.5;

    
    
    const A = this._tmp;
    v = 0; 

    const push(px, py, pz, nx, ny, nz) {
      A[v++] = px; A[v++] = py; A[v++] = pz;
      A[v++] = nx; A[v++] = ny; A[v++] = nz;
    };

    
    const topStart = 0;
    for (i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = std::cos(a), sa = std::sin(a);

      
      push(x + ca * rOut, yTop, z + sa * rOut, 0, 1, 0);
      push(x + ca * rIn,  yTop, z + sa * rIn,  0, 1, 0);
    }
    const topVerts = 2 * (segments + 1);

    
    const botStart = topStart + topVerts;
    for (i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = std::cos(a), sa = std::sin(a);

      
      push(x + ca * rIn,  yBot, z + sa * rIn,  0, -1, 0);
      push(x + ca * rOut, yBot, z + sa * rOut, 0, -1, 0);
    }
    const botVerts = 2 * (segments + 1);

    
    const outStart = botStart + botVerts;
    for (i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = std::cos(a), sa = std::sin(a);
      const nx = ca, nz = sa;

      
      push(x + ca * rOut, yTop, z + sa * rOut, nx, 0, nz);
      push(x + ca * rOut, yBot, z + sa * rOut, nx, 0, nz);
    }
    const outVerts = 2 * (segments + 1);

    
    const inStart = outStart + outVerts;
    for (i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = std::cos(a), sa = std::sin(a);
      const nx = -ca, nz = -sa;

      
      push(x + ca * rIn, yTop, z + sa * rIn, nx, 0, nz);
      push(x + ca * rIn, yBot, z + sa * rIn, nx, 0, nz);
    }
    const inVerts = 2 * (segments + 1);

    const totalVerts = topVerts + botVerts + outVerts + inVerts;
    const totalFloats = totalVerts * 6;

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform4fv(this.uColor, colorRGBA);

    
    const lightDir = opts.lightDir value_or([0.25, 0.9, 0.35]; 
    gl.uniform3fv(this.uLightDir, lightDir);

    gl.uniform1f(this.uAmbient, opts.ambient value_or(0.25);
    gl.uniform1f(this.uDiffuse, opts.diffuse value_or(0.85);
    gl.uniform1f(this.uEmissive, opts.emissive value_or(0.55); 

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, A.subarray(0, totalFloats));

    
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, topVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, botVerts * 1, botVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, (botVerts * 2), outVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, (botVerts * 2 + outVerts), inVerts);

    gl.disable(gl.BLEND);
    gl.bindVertexArray(nullptr);
  }
}


} // namespace lostjump

// engine/renderer/rings2d3d.js
// Толстые кольца/круги на плоскости XZ (world-space) через TRIANGLE_STRIP.
// Не зависит от gl.lineWidth (который в WebGL почти всегда 1).

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

export class ThickRings {
  constructor(gl, { maxSegments = 256 } = {}) {
    this.gl = gl;
    this.maxSegments = Math.min(256, Math.max(8, maxSegments | 0));

    const vs = compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
uniform mat4 uVP;

void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
}
`,
    );

    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 outColor;

void main() {
  outColor = uColor;
}
`,
    );

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uColor = gl.getUniformLocation(this.prog, "uColor");

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // (segments+1)*2 vertices, each vec3
    const maxVerts = (this.maxSegments + 1) * 2;
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * 3 * 4, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    this._tmp = new Float32Array(maxVerts * 3);
  }

  /**
   * Рисует толстое кольцо на плоскости XZ.
   * @param {Float32Array|number[]} vpMat4 - матрица VP (mat4)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} radius
   * @param {number} thickness - толщина в world units
   * @param {number} segments
   * @param {[number,number,number,number]} colorRGBA
   * @param {object} opts
   */
  drawRing(vpMat4, x, y, z, radius, thickness = 6, segments = 96, colorRGBA = [1, 1, 1, 1], opts = {}) {
    const gl = this.gl;

    segments = Math.min(this.maxSegments, Math.max(8, segments | 0));
    thickness = Math.max(0.0, thickness);

    const r0 = Math.max(0.0, radius - thickness * 0.5);
    const r1 = radius + thickness * 0.5;

    const arr = this._tmp;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2.0;
      const ca = Math.cos(a);
      const sa = Math.sin(a);

      // outer
      let o = (i * 2 + 0) * 3;
      arr[o + 0] = x + ca * r1;
      arr[o + 1] = y;
      arr[o + 2] = z + sa * r1;

      // inner
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

    // Blend
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // По умолчанию для UI-стиля поверх карты лучше без глубины
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
    gl.bindVertexArray(null);
  }
}

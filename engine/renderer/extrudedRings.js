// engine/renderer/extrudedRings.js
// Объёмные кольца (3D) на плоскости XZ: top/bottom + inner/outer walls.
// Рисуется в world-space, трансформируется только uVP (как линии).

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

export class ExtrudedRings {
  constructor(gl, { maxSegments = 256 } = {}) {
    this.gl = gl;
    this.maxSegments = Math.min(256, Math.max(8, maxSegments | 0));

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

uniform vec4 uColor;     // rgb + alpha
uniform vec3 uLightDir;  // world-space dir (normalized, from surface to light)
uniform float uAmbient;  // 0..1
uniform float uDiffuse;  // 0..2
uniform float uEmissive; // 0..2

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

    // VAO/VBO: interleaved pos3 + nrm3
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // Максимум вершин на одно кольцо:
    // top strip:    2*(S+1)
    // bottom strip: 2*(S+1)
    // outer wall:   2*(S+1)
    // inner wall:   2*(S+1)
    // total = 8*(S+1)
    const maxVerts = 8 * (this.maxSegments + 1);
    gl.bufferData(gl.ARRAY_BUFFER, maxVerts * 6 * 4, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    gl.bindVertexArray(null);

    this._tmp = new Float32Array(maxVerts * 6);
  }

  /**
   * Рисует объёмное кольцо.
   * radius + thickness => inner/outer
   */
  drawRing(vpMat4, x, y, z, radius, thickness = 10, height = 6, segments = 96, colorRGBA = [1, 0, 0, 1], opts = {}) {
    const gl = this.gl;

    segments = Math.min(this.maxSegments, Math.max(8, segments | 0));
    thickness = Math.max(0.0, thickness);
    height = Math.max(0.0001, height);

    const rIn = Math.max(0.0, radius - thickness * 0.5);
    const rOut = radius + thickness * 0.5;

    const yTop = y + height * 0.5;
    const yBot = y - height * 0.5;

    // Заполняем один общий буфер, а рисуем 4 TRIANGLE_STRIP подряд с оффсетами.
    // Формат: [px,py,pz,nx,ny,nz] * vertCount
    const A = this._tmp;
    let v = 0; // float offset

    const push = (px, py, pz, nx, ny, nz) => {
      A[v++] = px; A[v++] = py; A[v++] = pz;
      A[v++] = nx; A[v++] = ny; A[v++] = nz;
    };

    // ---------- TOP (normal +Y) ----------
    const topStart = 0;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);

      // outer then inner for strip
      push(x + ca * rOut, yTop, z + sa * rOut, 0, 1, 0);
      push(x + ca * rIn,  yTop, z + sa * rIn,  0, 1, 0);
    }
    const topVerts = 2 * (segments + 1);

    // ---------- BOTTOM (normal -Y) ----------
    const botStart = topStart + topVerts;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);

      // для нижней поверхности лучше поменять порядок, чтобы нормаль/вinding было корректнее
      push(x + ca * rIn,  yBot, z + sa * rIn,  0, -1, 0);
      push(x + ca * rOut, yBot, z + sa * rOut, 0, -1, 0);
    }
    const botVerts = 2 * (segments + 1);

    // ---------- OUTER WALL (normal radial out) ----------
    const outStart = botStart + botVerts;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = ca, nz = sa;

      // top then bottom
      push(x + ca * rOut, yTop, z + sa * rOut, nx, 0, nz);
      push(x + ca * rOut, yBot, z + sa * rOut, nx, 0, nz);
    }
    const outVerts = 2 * (segments + 1);

    // ---------- INNER WALL (normal radial in) ----------
    const inStart = outStart + outVerts;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = -ca, nz = -sa;

      // top then bottom
      push(x + ca * rIn, yTop, z + sa * rIn, nx, 0, nz);
      push(x + ca * rIn, yBot, z + sa * rIn, nx, 0, nz);
    }
    const inVerts = 2 * (segments + 1);

    const totalVerts = topVerts + botVerts + outVerts + inVerts;
    const totalFloats = totalVerts * 6;

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform4fv(this.uColor, colorRGBA);

    // свет: можно крутить как хочешь
    const lightDir = opts.lightDir ?? [0.25, 0.9, 0.35]; // сверху + чуть сбоку
    gl.uniform3fv(this.uLightDir, lightDir);

    gl.uniform1f(this.uAmbient, opts.ambient ?? 0.25);
    gl.uniform1f(this.uDiffuse, opts.diffuse ?? 0.85);
    gl.uniform1f(this.uEmissive, opts.emissive ?? 0.55); // чтобы “неон” был ярким

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, A.subarray(0, totalFloats));

    // Для объёма — depth ON
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // Чтобы выглядело “неоном”, обычно лучше alpha-blend
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Рисуем 4 полосы
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, topVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, botVerts * 1, botVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, (botVerts * 2), outVerts);
    gl.drawArrays(gl.TRIANGLE_STRIP, (botVerts * 2 + outVerts), inVerts);

    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }
}

import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

/* ==================== utils ==================== */

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s));
  }
  return s;
}

function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  return p;
}

/* ==================== STARFIELD ==================== */

export class Starfield {
  constructor(gl, { starCount = 3500, radius = 12000, seed = 1337 } = {}) {
    this.gl = gl;
    this.starCount = starCount;
    this.radius = radius;
    this.nebulaCount = 12;

    /* ---------- shaders ---------- */

    const vs = compile(gl, gl.VERTEX_SHADER, `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
layout(location=1) in float aSize;
layout(location=2) in vec3 aColor;
layout(location=3) in float aAlpha;

uniform mat4 uVP;
uniform float uDpr;

out vec3 vColor;
out float vAlpha;

void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
  gl_PointSize = aSize * uDpr;
  vColor = aColor;
  vAlpha = aAlpha;
}
`);

    const fs = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);

  float a = smoothstep(1.0, 0.15, r);
  outColor = vec4(vColor, vAlpha * a);
}
`);

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");

    /* ---------- stars ---------- */
    this.starBuf = new Float32Array(this.starCount * 8);
    fillStars(this.starBuf, this.starCount, radius, seed);

    this.starVao = gl.createVertexArray();
    this.starVbo = gl.createBuffer();

    gl.bindVertexArray(this.starVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.starBuf, gl.STATIC_DRAW);

    setupAttribs(gl, 8);
    gl.bindVertexArray(null);

    /* ---------- nebulae ---------- */
    this.nebulaBuf = new Float32Array(this.nebulaCount * 8);
    fillNebulae(this.nebulaBuf, this.nebulaCount, radius * 0.85, seed + 999);

    this.nebulaVao = gl.createVertexArray();
    this.nebulaVbo = gl.createBuffer();

    gl.bindVertexArray(this.nebulaVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nebulaVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.nebulaBuf, gl.STATIC_DRAW);

    setupAttribs(gl, 8);
    gl.bindVertexArray(null);

    /* ---------- matrices ---------- */
    this._proj = mat4.create();
    this._view = mat4.create();
    this._vp = mat4.create();
  }

  draw(view, cam, dpr = 1) {
    const gl = this.gl;

    const skyCam = {
      eye: [0, 0, 0],
      target: [
        cam.target[0] - cam.eye[0],
        cam.target[1] - cam.eye[1],
        cam.target[2] - cam.eye[2],
      ],
      up: cam.up,
      fovRad: cam.fovRad,
      near: 1,
      far: this.radius * 2,
    };

    mat4.perspective(
      this._proj,
      skyCam.fovRad,
      view.w / view.h,
      skyCam.near,
      skyCam.far
    );
    mat4.lookAt(this._view, skyCam.eye, skyCam.target, skyCam.up);
    mat4.multiply(this._vp, this._proj, this._view);

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, this._vp);
    gl.uniform1f(this.uDpr, dpr);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // 🌫 nebulae (background)
    gl.bindVertexArray(this.nebulaVao);
    gl.drawArrays(gl.POINTS, 0, this.nebulaCount);

    // ⭐ stars (foreground)
    gl.bindVertexArray(this.starVao);
    gl.drawArrays(gl.POINTS, 0, this.starCount);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
}

/* ==================== helpers ==================== */

function setupAttribs(gl, strideFloats) {
  const stride = strideFloats * 4;
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 4 * 4);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 7 * 4);
}

function fillStars(buf, n, radius, seed) {
  const rand = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const d = randomDir(rand);
    const o = i * 8;
    buf[o]     = d[0] * radius;
    buf[o + 1] = d[1] * radius;
    buf[o + 2] = d[2] * radius;
    buf[o + 3] = 1.0 + rand() * 2.2;
    buf[o + 4] = 1;
    buf[o + 5] = 1;
    buf[o + 6] = 1;
    buf[o + 7] = 0.3 + rand() * 0.7;
  }
}

function fillNebulae(buf, n, radius, seed) {
  const rand = mulberry32(seed);
  const palette = [
    [0.6, 0.3, 0.9],
    [0.2, 0.6, 1.0],
    [1.0, 0.4, 0.2],
    [0.9, 0.8, 0.4],
  ];

  for (let i = 0; i < n; i++) {
    const d = randomDir(rand);
    const c = palette[(rand() * palette.length) | 0];
    const o = i * 8;
    buf[o]     = d[0] * radius;
    buf[o + 1] = d[1] * radius;
    buf[o + 2] = d[2] * radius;
    buf[o + 3] = 800 + rand() * 1600;
    buf[o + 4] = c[0];
    buf[o + 5] = c[1];
    buf[o + 6] = c[2];
    buf[o + 7] = 0.08 + rand() * 0.12;
  }
}

function randomDir(rand) {
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

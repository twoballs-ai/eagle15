import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import { createProgram } from "../gl.js";

/* ==================== utils ==================== */

/* ==================== STARFIELD ==================== */

export class Starfield {
  constructor(gl, { starCount = 3500, radius = 12000, seed = 1337 } = {}) {
    this.gl = gl;
    this.starCount = starCount;
    this.radius = radius;

    this.nebulaCount = 12;
    this.bandCount = 900;

    /* ---------- shaders ---------- */

    const vs = `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
layout(location=1) in float aSize;
layout(location=2) in vec3 aColor;
layout(location=3) in float aAlpha;

uniform mat4 uVP;
uniform float uDpr;

// ✅ параллакс
uniform vec2 uParallax; // world dx,dz (маленький)
uniform float uLayer;   // 0..1 (насколько сильный параллакс у слоя)

out vec3 vColor;
out float vAlpha;

void main() {
  vec3 pos = aPos;

  // сдвигаем фон чуть-чуть по XZ (уLayer зададим для nebula/band/stars)
  pos.xz += uParallax * uLayer;

  gl_Position = uVP * vec4(pos, 1.0);
  gl_PointSize = aSize * uDpr;
  vColor = aColor;
  vAlpha = aAlpha;
}
`;

    const fs = `#version 300 es
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
`;

    this.prog = createProgram(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");
this.uParallax = gl.getUniformLocation(this.prog, "uParallax");
this.uLayer = gl.getUniformLocation(this.prog, "uLayer");
    /* ---------- stars ---------- */
    this.starBuf = new Float32Array(this.starCount * 8);
    fillStars(this.starBuf, this.starCount, radius, seed);

    this.starVao = gl.createVertexArray();
    this.starVbo = gl.createBuffer();
    gl.bindVertexArray(this.starVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.starBuf, gl.STATIC_DRAW);
    setupAttribs(gl);
    gl.bindVertexArray(null);

    /* ---------- nebulae ---------- */
    this.nebulaBuf = new Float32Array(this.nebulaCount * 8);
    fillNebulae(this.nebulaBuf, this.nebulaCount, radius * 0.85, seed + 999);

    this.nebulaVao = gl.createVertexArray();
    this.nebulaVbo = gl.createBuffer();
    gl.bindVertexArray(this.nebulaVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nebulaVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.nebulaBuf, gl.STATIC_DRAW);
    setupAttribs(gl);
    gl.bindVertexArray(null);

    /* ---------- milky way band ---------- */
    this.bandBuf = new Float32Array(this.bandCount * 8);
    fillMilkyWayBand(this.bandBuf, this.bandCount, radius * 0.92, seed + 2025);

    this.bandVao = gl.createVertexArray();
    this.bandVbo = gl.createBuffer();
    gl.bindVertexArray(this.bandVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bandVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.bandBuf, gl.STATIC_DRAW);
    setupAttribs(gl);
    gl.bindVertexArray(null);

    /* ---------- matrices ---------- */
    this._proj = mat4.create();
    this._view = mat4.create();
    this._vp = mat4.create();
  }

draw(view, cam, dpr = 1, parallaxX = 0, parallaxZ = 0) {
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
gl.uniform2f(this.uParallax, parallaxX, parallaxZ);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // 🌫 nebulae (background)
gl.uniform1f(this.uLayer, 0.20);
gl.bindVertexArray(this.nebulaVao);
gl.drawArrays(gl.POINTS, 0, this.nebulaCount);

// 🌌 milky way band (middle) — средний
gl.uniform1f(this.uLayer, 0.12);
gl.bindVertexArray(this.bandVao);
gl.drawArrays(gl.POINTS, 0, this.bandCount);

// ⭐ stars (foreground) — очень слабый (почти skybox)
gl.uniform1f(this.uLayer, 0.05);
gl.bindVertexArray(this.starVao);
gl.drawArrays(gl.POINTS, 0, this.starCount);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
}

/* ==================== helpers ==================== */

function setupAttribs(gl) {
  const stride = 8 * 4;
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

function fillMilkyWayBand(buf, n, radius, seed) {
  const rand = mulberry32(seed);

  let nx = rand() * 2 - 1;
  let ny = rand() * 2 - 1;
  let nz = rand() * 2 - 1;
  const nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl; ny /= nl; nz /= nl;

  let ax = 0, ay = 1, az = 0;
  if (Math.abs(ny) > 0.9) { ax = 1; ay = 0; az = 0; }

  let ux = ny * az - nz * ay;
  let uy = nz * ax - nx * az;
  let uz = nx * ay - ny * ax;
  const ul = Math.hypot(ux, uy, uz) || 1;
  ux /= ul; uy /= ul; uz /= ul;

  let vx = ny * uz - nz * uy;
  let vy = nz * ux - nx * uz;
  let vz = nx * uy - ny * ux;

  const bandWidth = 0.10;
  const palette = [
    [0.95, 0.95, 1.0],
    [0.85, 0.90, 1.0],
    [1.0, 0.92, 0.78],
  ];

  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const w = (rand() * 2 - 1) * bandWidth;

    let dx = ux * Math.cos(t) + vx * Math.sin(t);
    let dy = uy * Math.cos(t) + vy * Math.sin(t);
    let dz = uz * Math.cos(t) + vz * Math.sin(t);

    dx += nx * w;
    dy += ny * w;
    dz += nz * w;

    const dl = Math.hypot(dx, dy, dz) || 1;
    dx /= dl; dy /= dl; dz /= dl;

    const dust = 0.55 + 0.45 *
      Math.sin(t * 3.0 + 1.7) *
      Math.sin(t * 2.0 + 0.4);

    const col = palette[(rand() * palette.length) | 0];
    const o = i * 8;

    buf[o]     = dx * radius;
    buf[o + 1] = dy * radius;
    buf[o + 2] = dz * radius;
    buf[o + 3] = 18 + rand() * 45;
    buf[o + 4] = col[0];
    buf[o + 5] = col[1];
    buf[o + 6] = col[2];
    buf[o + 7] = (0.06 + rand() * 0.10) * Math.max(0.15, dust);
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

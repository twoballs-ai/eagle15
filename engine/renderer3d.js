// engine/renderer3d.js
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import { loadGLBModel } from "../assets/glbLoader.js";
import { ModelRenderer } from "./renderer/modelRenderer.js";
import { Starfield } from "./renderer/starfield.js";

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

export class Renderer3D {
  constructor(gl) {
    this.gl = gl;

    // ===== Line program (orbits) =====
    const vsLine = compile(gl, gl.VERTEX_SHADER, `#version 300 es
      precision highp float;

      layout(location=0) in vec3 aPos;
      uniform mat4 uVP;

      void main() {
        gl_Position = uVP * vec4(aPos, 1.0);
      }
    `);

    const fsLine = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;

      uniform vec4 uColor;
      out vec4 outColor;

      void main() { outColor = uColor; }
    `);

    this.progLine = link(gl, vsLine, fsLine);
    this.uLine = {
      vp: gl.getUniformLocation(this.progLine, "uVP"),
      color: gl.getUniformLocation(this.progLine, "uColor"),
    };

    this.vaoLine = gl.createVertexArray();
    gl.bindVertexArray(this.vaoLine);

    this.vboLine = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * 3 * 512, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    // temp orbit buffer (xyz * 256)
    this._orbit = new Float32Array(3 * 256);

    // cached per begin()
    this._vp = mat4.create();
    this._m = mat4.create();

    // models
    this.models = new ModelRenderer(gl);
    this._modelCache = new Map();

    // viewport restore
    this._savedViewport = null;
    this._starfield = new Starfield(gl, {
  starCount: 3500,
  radius: 12000,
  seed: 1337,
});
  }

  // ---- scene begin: computes VP and sets common GL state ----
 begin(view, camera) {
  const gl = this.gl;
  const aspect = view.w / view.h;

  const proj = mat4.create();

  // ✅ ORTHO для миникарты (если camera.ortho === true)
  if (camera.ortho) {
    const halfH = camera.orthoSize ?? 1000; // world units: половина высоты видимого квадрата
    const halfW = halfH * aspect;
    mat4.ortho(proj, -halfW, halfW, -halfH, halfH, camera.near, camera.far);
  } else {
    mat4.perspective(proj, camera.fovRad, aspect, camera.near, camera.far);
  }

  const viewM = mat4.create();
  mat4.lookAt(viewM, camera.eye, camera.target, camera.up);

  mat4.multiply(this._vp, proj, viewM);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);
}


  // ---- minimap / second pass: render into a screen-rect ----
  // x,y,w,h in screen pixels with origin at TOP-LEFT (like UI)
  beginViewportRect(view, x, y, w, h) {
    const gl = this.gl;

    this._savedViewport = gl.getParameter(gl.VIEWPORT);

    const yBottom = view.h - (y + h);
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(x, yBottom, w, h);
    gl.scissor(x, yBottom, w, h);
  }

  endViewportRect() {
    const gl = this.gl;
    gl.disable(gl.SCISSOR_TEST);

    if (this._savedViewport) {
      gl.viewport(
        this._savedViewport[0],
        this._savedViewport[1],
        this._savedViewport[2],
        this._savedViewport[3]
      );
      this._savedViewport = null;
    }
  }

  // ---- models ----
  async loadGLB(url) {
    if (this._modelCache.has(url)) return this._modelCache.get(url);
    const model = await loadGLBModel(this.gl, url);
    this._modelCache.set(url, model);
    return model;
  }

drawModel(model, {
  position=[0,0,0],
  scale=[1,1,1],

  rotationY=0,
  rotationX=0,
  rotationZ=0,

  basisX=0,
  basisY=0,
  basisZ=0,

  ambient=0.85,
  emissive=0.0,
} = {}) {

  mat4.identity(this._m);
  mat4.translate(this._m, this._m, position);

  // ✅ 1) СНАЧАЛА basis модели
  if (basisY) mat4.rotateY(this._m, this._m, basisY);
  if (basisX) mat4.rotateX(this._m, this._m, basisX);
  if (basisZ) mat4.rotateZ(this._m, this._m, basisZ);

  // ✅ 2) ПОТОМ world rotation (yaw/pitch/roll объекта)
  if (rotationY) mat4.rotateY(this._m, this._m, rotationY);
  if (rotationX) mat4.rotateX(this._m, this._m, rotationX);
  if (rotationZ) mat4.rotateZ(this._m, this._m, rotationZ);

  mat4.scale(this._m, this._m, scale);
  this.models.draw(model, this._vp, this._m, { ambient, emissive });
}


  // ---- orbits ----
drawOrbit(radius, segments = 160, colorRGBA = [0.3, 0.3, 0.35, 0.25]) {
  const gl = this.gl;
  if (segments > 256) segments = 256;

  const arr = this._orbit;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const o = i * 3;
    arr[o + 0] = x;
    arr[o + 1] = 0.12; // ✅ чуть выше плоскости (убирает “кружок”/z-fighting)
    arr[o + 2] = z;
  }

  gl.useProgram(this.progLine);
  gl.bindVertexArray(this.vaoLine);

  gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
  gl.uniform4fv(this.uLine.color, colorRGBA);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));

  // ✅ blending только для орбит
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ✅ чтобы линии не “портили” depth (обычно выглядит лучше)
  gl.depthMask(false);

  gl.drawArrays(gl.LINE_LOOP, 0, segments);

  gl.depthMask(true);
  gl.disable(gl.BLEND);

  gl.bindVertexArray(null);
}
drawBackground(view, camera, dpr = 1, parallaxX = 0, parallaxZ = 0) {
  this._starfield.draw(view, camera, dpr, parallaxX, parallaxZ);
}

  drawLineStrip(pointsXYZ, colorRGBA = [1, 1, 1, 1]) {
    const gl = this.gl;
    const n = (pointsXYZ.length / 3) | 0;
    if (n < 2) return;

    gl.useProgram(this.progLine);
    gl.bindVertexArray(this.vaoLine);

    gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
    gl.uniform4fv(this.uLine.color, colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointsXYZ);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.drawArrays(gl.LINE_STRIP, 0, n);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  drawLines(pointsXYZ, colorRGBA = [1, 1, 1, 1]) {
    const gl = this.gl;
    const n = (pointsXYZ.length / 3) | 0;
    if (n < 2) return;

    gl.useProgram(this.progLine);
    gl.bindVertexArray(this.vaoLine);

    gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
    gl.uniform4fv(this.uLine.color, colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointsXYZ);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.drawArrays(gl.LINES, 0, n);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  drawCircleAt(x, y, z, radius, segments = 48, colorRGBA = [0.2, 0.9, 1.0, 0.45]) {
    const gl = this.gl;
    if (segments > 256) segments = 256;

    const arr = this._orbit;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const o = i * 3;
      arr[o + 0] = x + Math.cos(a) * radius;
      arr[o + 1] = y;
      arr[o + 2] = z + Math.sin(a) * radius;
    }

    gl.useProgram(this.progLine);
    gl.bindVertexArray(this.vaoLine);

    gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
    gl.uniform4fv(this.uLine.color, colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.drawArrays(gl.LINE_LOOP, 0, segments);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  drawCrossAt(x, y, z, size = 10, colorRGBA = [0.2, 0.9, 1.0, 1.0]) {
    // 4 линии = 8 вершин => 24 float'а
    const pts = new Float32Array([
      x - size, y, z,   x + size, y, z,
      x, y, z - size,   x, y, z + size,
    ]);
    this.drawLines(pts, colorRGBA);
  }
getVP() {
  return this._vp;
}
}

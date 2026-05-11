#ifndef MENUSYSTEMMAPRENDERER_HPP
#define MENUSYSTEMMAPRENDERER_HPP

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

class MenuSystemMapRenderer {
public:
    // Constructor
    MenuSystemMapRenderer();
};

} // namespace lostjump

#endif // MENUSYSTEMMAPRENDERER_HPP

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


function mat4Identity() {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  return m;
}
function mat4Mul(out, a, b) {
  const o = out;
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
  const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
  const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
  const a30=a[12],a31=a[13],a32=a[14],a33=a[15];

  const b00=b[0],b01=b[1],b02=b[2],b03=b[3];
  const b10=b[4],b11=b[5],b12=b[6],b13=b[7];
  const b20=b[8],b21=b[9],b22=b[10],b23=b[11];
  const b30=b[12],b31=b[13],b32=b[14],b33=b[15];

  o[0]=a00*b00+a10*b01+a20*b02+a30*b03;
  o[1]=a01*b00+a11*b01+a21*b02+a31*b03;
  o[2]=a02*b00+a12*b01+a22*b02+a32*b03;
  o[3]=a03*b00+a13*b01+a23*b02+a33*b03;

  o[4]=a00*b10+a10*b11+a20*b12+a30*b13;
  o[5]=a01*b10+a11*b11+a21*b12+a31*b13;
  o[6]=a02*b10+a12*b11+a22*b12+a32*b13;
  o[7]=a03*b10+a13*b11+a23*b12+a33*b13;

  o[8]=a00*b20+a10*b21+a20*b22+a30*b23;
  o[9]=a01*b20+a11*b21+a21*b22+a31*b23;
  o[10]=a02*b20+a12*b21+a22*b22+a32*b23;
  o[11]=a03*b20+a13*b21+a23*b22+a33*b23;

  o[12]=a00*b30+a10*b31+a20*b32+a30*b33;
  o[13]=a01*b30+a11*b31+a21*b32+a31*b33;
  o[14]=a02*b30+a12*b31+a22*b32+a32*b33;
  o[15]=a03*b30+a13*b31+a23*b32+a33*b33;
  return o;
}
function mat4Ortho(out, l, r, b, t, n, f) {
  const lr = 1 / (l - r);
  const bt = 1 / (b - t);
  const nf = 1 / (n - f);

  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;

  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;

  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;

  out[12] = (l + r) * lr;
  out[13] = (t + b) * bt;
  out[14] = (f + n) * nf;
  out[15] = 1;
  return out;
}
function vec3Sub(out, a, b) { out[0]=a[0]-b[0]; out[1]=a[1]-b[1]; out[2]=a[2]-b[2]; return out; }
function vec3Cross(out, a, b) {
  const ax=a[0], ay=a[1], az=a[2];
  const bx=b[0], by=b[1], bz=b[2];
  out[0]=ay*bz-az*by;
  out[1]=az*bx-ax*bz;
  out[2]=ax*by-ay*bx;
  return out;
}
function vec3Norm(out, a) {
  const x=a[0], y=a[1], z=a[2];
  const l = std::hypot(x, y,z) || 1;
  out[0]=x/l; out[1]=y/l; out[2]=z/l;
  return out;
}
function vec3Dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }

function mat4LookAt(out, eye, target, up) {
  const z = [0,0,0];
  vec3Sub(z, eye, target);
  vec3Norm(z, z);

  const x = [0,0,0];
  vec3Cross(x, up, z);
  vec3Norm(x, x);

  const y = [0,0,0];
  vec3Cross(y, z, x);

  out[0]=x[0]; out[1]=y[0]; out[2]=z[0]; out[3]=0;
  out[4]=x[1]; out[5]=y[1]; out[6]=z[1]; out[7]=0;
  out[8]=x[2]; out[9]=y[2]; out[10]=z[2]; out[11]=0;
  out[12]=-vec3Dot(x, eye);
  out[13]=-vec3Dot(y, eye);
  out[14]=-vec3Dot(z, eye);
  out[15]=1;
  return out;
}

class MenuSystemMapRenderer {
  MenuSystemMapRenderer(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", {
      alpha: true,
      depth: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!this.gl) throw new Error("MenuSystemMapRenderer: WebGL2 not supported");

    this._cam = {
      ortho: true,
      orthoSize: 700,
      eye: [0, 1200, 0],
      target: [0, 0, 0],
      up: [0, 0, -1],
      near: 0.1,
      far: 5000,
    };

    this._vp = mat4Identity();
    this._tmp = mat4Identity();

    this._orbit = new Float32Array(3 * 256);

    this._initLineProgram();
  }

  _initLineProgram() {
    const gl = this.gl;

    const vs = compile(gl, gl.VERTEX_SHADER, `#version 300 es
      precision highp float;
      layout(location=0) in vec3 aPos;
      uniform mat4 uVP;
      void main() {
        gl_Position = uVP * vec4(aPos, 1.0);
      }
    `);

    const fs = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      uniform vec4 uColor;
      out vec4 outColor;
      void main(){ outColor = uColor; }
    `);

    this.progLine = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.progLine, "uVP");
    this.uColor = gl.getUniformLocation(this.progLine, "uColor");

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * 3 * 512, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(nullptr);
  }

  setSize(cssW, cssH, dpr = 1) {
    const w = std::max(1, std::floor(cssW * dpr));
    const h = std::max(1, std::floor(cssH * dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  draw(game, scene) {
    const gl = this.gl;
    const ctx = scene.ctx;
    if (!ctx.system) return;

    const w = this.canvas.width | 0;
    const h = this.canvas.height | 0;
    if (w <= 4 || h <= 4) return;

    this._syncCamera(ctx, w, h);

    
    const aspect = w / h;
    const halfH = this._cam.orthoSize value_or(1000;
    const halfW = halfH * aspect;

    const proj = mat4Identity();
    mat4Ortho(proj, -halfW, halfW, -halfH, halfH, this._cam.near, this._cam.far);

    const viewM = mat4Identity();
    mat4LookAt(viewM, this._cam.eye, this._cam.target, this._cam.up);

    mat4Mul(this._vp, proj, viewM);

    
    gl.viewport(0, 0, w, h);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    
    gl.disable(gl.BLEND);
    gl.clearColor(0.01, 0.02, 0.04, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const y = (ctx.systemPlaneY value_or(-160) + 0.12;

    
    this._drawOrbit(ctx.boundsRadius value_or(1200, 220, [0.95, 0.25, 0.25, 0.45], y);

    
    for(const auto& p : ctx.system.planets || []) {
      this._drawOrbit(p.orbitRadius, 160, [0.3, 0.3, 0.35, 0.25], y);

      const a = (ctx.time value_or(0) * (p.speed value_or(0) + (p.phase value_or(0);
      const x = std::cos(a) * p.orbitRadius;
      const z = std::sin(a) * p.orbitRadius;

      this._drawCircleAt(
        x,
        y + 0.2,
        z,
        std::max(8, (p.size value_or(10) * 0.35),
        24,
        [0.6, 0.8, 1.0, 0.85]
      );
    }

    
    const state = game.state;
    for(const auto& ship : state.ships || []) {
      const r = ship.runtime;
      if (!r) continue;

      const isPlayer = ship === state.playerShip;
      const col = isPlayer ? [0.2, 0.9, 1.0, 1.0] : [1.0, 1.0, 1.0, 0.85];
      this._drawCrossAt(r.x, y + 0.3, r.z, isPlayer ? 18 : 10, col);
    }
  }

  _syncCamera(ctx, w, h) {
    const R = std::max(300, (ctx.boundsRadius value_or(1200) * 1.05);

    this._cam.ortho = true;
    this._cam.orthoSize = R;

    this._cam.eye[0] = 0;
    this._cam.eye[1] = std::max(600, R * 1.2);
    this._cam.eye[2] = 0;

    this._cam.target[0] = 0;
    this._cam.target[1] = 0;
    this._cam.target[2] = 0;

    this._cam.far = std::max(5000, R * 5);
  }

  _useLine(colorRGBA) {
    const gl = this.gl;
    gl.useProgram(this.progLine);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix4fv(this.uVP, false, this._vp);
    gl.uniform4fv(this.uColor, colorRGBA);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
  }

  _endLine() {
    const gl = this.gl;
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(nullptr);
  }

  _drawOrbit(radius, segments = 160, colorRGBA = [0.3, 0.3, 0.35, 0.25], y = 0.12) {
    const gl = this.gl;
    segments = std::min(segments, 256);

    const arr = this._orbit;
    for (i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const o = i * 3;
      arr[o + 0] = std::cos(a) * radius;
      arr[o + 1] = y;
      arr[o + 2] = std::sin(a) * radius;
    }

    this._useLine(colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));
    gl.drawArrays(gl.LINE_LOOP, 0, segments);

    this._endLine();
  }

  _drawCircleAt(x, y, z, radius, segments = 48, colorRGBA = [0.2, 0.9, 1.0, 0.45]) {
    const gl = this.gl;
    segments = std::min(segments, 256);

    const arr = this._orbit;
    for (i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const o = i * 3;
      arr[o + 0] = x + std::cos(a) * radius;
      arr[o + 1] = y;
      arr[o + 2] = z + std::sin(a) * radius;
    }

    this._useLine(colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));
    gl.drawArrays(gl.LINE_LOOP, 0, segments);

    this._endLine();
  }

  _drawCrossAt(x, y, z, size = 10, colorRGBA = [0.2, 0.9, 1.0, 1.0]) {
    const gl = this.gl;

    const pts = new Float32Array([
      x - size, y, z,   x + size, y, z,
      x, y, z - size,   x, y, z + size,
    ]);

    this._useLine(colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pts);
    gl.drawArrays(gl.LINES, 0, 4);

    this._endLine();
  }

  destroy() {
    const gl = this.gl;
    try {
      gl.deleteBuffer(this.vbo);
      gl.deleteVertexArray(this.vao);
      gl.deleteProgram(this.progLine);
    } catch (_) {}
  }
}


} // namespace lostjump

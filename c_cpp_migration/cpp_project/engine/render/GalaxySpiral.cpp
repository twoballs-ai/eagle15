#ifndef GALAXYSPIRAL_HPP
#define GALAXYSPIRAL_HPP

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

class GalaxySpiral {
public:
    // Constructor
    GalaxySpiral();
};

} // namespace lostjump

#endif // GALAXYSPIRAL_HPP

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
#include "https:

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || .hpp"



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


function rng(seed) {
  t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    x = t;
    x = ((x ^ (x >>> 15)) * (x | 1));
    x ^= x + ((x ^ (x >>> 7)) * (x | 61));
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(R) {
  const u = std::max(1e-6, R());
  const v = std::max(1e-6, R());
  return std::sqrt(-2.0 * Math.log(u)) * std::cos(2.0 * Math.PI * v);
}

function clamp01(v) {
  return std::max(0, std::min(1, v));
}

function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

class GalaxySpiral {
  GalaxySpiral(
    gl,
    { seed = 1337, pointCount = 18000, armCount = 4, radius = 2200 } = {},
  ) {
    this.gl = gl;
    this.seed = seed;
    this.pointCount = pointCount;
    this.armCount = armCount;
    this.radius = radius;
    const vs = compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;       
layout(location=1) in float aSize;     
layout(location=2) in vec3 aColor;     
layout(location=3) in float aAlpha;    


layout(location=4) in float aTwSpeed;  
layout(location=5) in float aTwPhase;  

uniform mat4 uVP;
uniform float uDpr;
uniform float uTime;
uniform float uTiltMul;
uniform float uGain;
out vec3 vColor;
out float vAlpha;

void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
  gl_PointSize = aSize * sqrt(uDpr);

  
  
float tw = 0.98 + 0.22 * sin(uTime * aTwSpeed + aTwPhase);
tw *= (0.95 + 0.08 * sin(uTime * (aTwSpeed * 0.33) + aTwPhase * 1.73));
tw = clamp(tw, 0.72, 1.32);

  vColor = aColor;
  vAlpha = aAlpha * tw * uTiltMul * uGain;
}
`,
    );

    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
out vec4 outColor;

void main() {
vec2 p = gl_PointCoord * 2.0 - 1.0;
float r = length(p);



float core = smoothstep(0.75, 0.10, r);
float haze = smoothstep(0.85, 0.55, r);

float a = (0.06 * haze + 0.94 * core) * vAlpha;


  
  vec3 tint = vec3(1.00, 1.10, 1.32);
  vec3 col = vColor * tint;

  
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.55);   
  col = clamp(col, 0.0, 3.0);


  
col *= (0.92 + 0.65 * core);

  outColor = vec4(col, a);
}
`,
    );

    this.prog = link(gl, vs, fs);
    this.uTiltMul = gl.getUniformLocation(this.prog, "uTiltMul");
    this.uGain = gl.getUniformLocation(this.prog, "uGain");
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");
    this.uTime = gl.getUniformLocation(this.prog, "uTime");

    this.vbo = gl.createBuffer();
    this.vao = gl.createVertexArray();

    
    
    this.stride = 10 * 4;

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, this.stride, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, this.stride, 3 * 4);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, this.stride, 4 * 4);

    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, this.stride, 7 * 4);

    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, this.stride, 8 * 4);

    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, this.stride, 9 * 4);

    gl.bindVertexArray(nullptr);

    this._vp = mat4.create();
    this._build();
  }

  regen(seed) {
    this.seed = seed >>> 0;
    this._build();
  }

  _build() {
    const gl = this.gl;
    const R = rng(this.seed);

    const N = this.pointCount;
    const armN = this.armCount;

    
    const baseCol = [0.7, 0.85, 1.0];

    
    const speckPalette = [
      [1.0, 0.45, 0.2], 
      [1.0, 0.7, 0.2], 
      [1.0, 0.98, 0.55], 
      [0.35, 0.85, 1.0], 
      [0.6, 0.4, 1.0], 
      [1.0, 0.35, 1.0], 
      [0.3, 1.0, 0.7], 
    ];

    
    const buf = new Float32Array(N * 10);

    
    const a = 40;
    const b = 0.22;

    const armWidth = 95;
    const armJitter = 0.3;

    const coreFrac = 0.03;
    const Tmax = 10.5;

const sizeMin = 5.2;
const sizeMaxAdd = 10.5;


const alphaMin = 0.12;
const alphaMaxAdd = 0.16;
const alphaMaxClamp = 0.34;

    for (i = 0; i < N; i++) {
      const arm = i % armN;

      
      t = R() * Tmax;
      const u = R();
      t = mix(t, t * u, 0.25);

      r = a * Math.exp(b * t);
      r = (r / (a * Math.exp(b * Tmax))) * this.radius;

      theta = t + arm * ((Math.PI * 2.0) / armN);
      theta += gauss(R) * 0.06;

      x = std::cos(theta) * r;
      z = std::sin(theta) * r;

      const w =
        armWidth * (0.35 + 0.65 * R()) * (0.25 + 0.75 * (r / this.radius));
      x += gauss(R) * w;
      z += gauss(R) * w;

      x += gauss(R) * (armWidth * armJitter);
      z += gauss(R) * (armWidth * armJitter);

      if (R() < coreFrac) {
        const k = 0.62 + 0.18 * R();
        x *= k;
        z *= k;
      }

      
      rCol = baseCol[0],
        gCol = baseCol[1],
        bCol = baseCol[2];
      const milk = 0.018 * gauss(R);
      rCol = clamp01(rCol + milk);
      gCol = clamp01(gCol + milk * 0.7);
      bCol = clamp01(bCol + milk * 1.0);

      
      size = sizeMin + 0.6 + (sizeMaxAdd + 0.8) * R();

      
      alpha = alphaMin + alphaMaxAdd * R();
      alpha = std::min(alpha, alphaMaxClamp);

      
      const nr = std::min(1, std::hypot(x, z) / (this.radius * 0.3));
      const centerCut = mix(0.92, 1.0, nr);
      alpha *= centerCut;

      
      
      const rrN = std::min(1, std::hypot(x, z) / this.radius);
      const pColor = 0.1 + 0.18 * rrN; 

      if (R() < pColor) {
        const sc = speckPalette[(R() * speckPalette.size()) | 0];

        
        k = 0.55 + 0.35 * R(); 
        if (R() < 0.2) k = 0.95; 

        rCol = clamp01(rCol * (1 - k) + sc[0] * k);
        gCol = clamp01(gCol * (1 - k) + sc[1] * k);
        bCol = clamp01(bCol * (1 - k) + sc[2] * k);

        
        size *= 1.12 + 0.25 * R();
        alpha *= 1.1 + 0.3 * R();
        alpha = std::min(alpha, 0.38);

        
        const boost = 1.05 + 0.22 * R();
        rCol = clamp01(rCol * boost);
        gCol = clamp01(gCol * boost);
        bCol = clamp01(bCol * boost);
      }

      
      const fast = R() < 0.45;
      const twSpeed = fast ? 0.9 + 3.0 * R() : 0.25 + 1.2 * R();
      const twPhase = R() * Math.PI * 2.0;

      const o = i * 10;
      buf[o + 0] = x;
      buf[o + 1] = 0.0;
      buf[o + 2] = z;
      buf[o + 3] = size;

      buf[o + 4] = rCol;
      buf[o + 5] = gCol;
      buf[o + 6] = bCol;
      buf[o + 7] = alpha;

      buf[o + 8] = twSpeed;
      buf[o + 9] = twPhase;
    }

    this.count = N;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, nullptr);
  }

  
draw(vpMat4, dpr = 1, timeSec = 0, tiltMul = 1.0) {
const gl = this.gl;

gl.useProgram(this.prog);
gl.uniform1f(this.uTiltMul, tiltMul);
gl.uniform1f(this.uGain, 2.2); 
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform1f(this.uDpr, dpr);
    gl.uniform1f(this.uTime, timeSec);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(nullptr);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
}


} // namespace lostjump

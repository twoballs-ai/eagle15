// engine/renderer3d.js
import { mat4, vec3 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import { loadGLBModel } from "../assets/glbLoader.js";
import { ModelRenderer } from "./renderer/modelRenderer.js";

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

    // ===== Disc program (billboard quad; fragment cuts circle) =====
    const vsDisc = compile(gl, gl.VERTEX_SHADER, `#version 300 es
      precision highp float;

      layout(location=0) in vec2 aPos; // [-1..1] quad

      uniform mat4 uVP;
      uniform vec3 uCenter;
      uniform float uRadius;
      uniform vec3 uRight;
      uniform vec3 uUp;

      out vec2 vLocal;

      void main() {
        vLocal = aPos;
        vec3 world = uCenter + uRight * (aPos.x * uRadius) + uUp * (aPos.y * uRadius);
        gl_Position = uVP * vec4(world, 1.0);
      }
    `);

    const fsDisc = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;

      in vec2 vLocal;
      uniform vec4 uColor;
      uniform float uSoft;
      out vec4 outColor;

      void main() {
        float d = length(vLocal); // 0..~1.414
        float alpha = 1.0 - smoothstep(1.0 - uSoft, 1.0, d);
        if (alpha <= 0.0) discard;

        // легкий радиальный градиент
        float glow = 1.0 - smoothstep(0.0, 1.0, d);
        vec3 col = uColor.rgb * (0.85 + 0.25 * glow);

        outColor = vec4(col, uColor.a * alpha);
      }
    `);

    this.progDisc = link(gl, vsDisc, fsDisc);
    this.uDisc = {
      vp: gl.getUniformLocation(this.progDisc, "uVP"),
      center: gl.getUniformLocation(this.progDisc, "uCenter"),
      radius: gl.getUniformLocation(this.progDisc, "uRadius"),
      right: gl.getUniformLocation(this.progDisc, "uRight"),
      up: gl.getUniformLocation(this.progDisc, "uUp"),
      color: gl.getUniformLocation(this.progDisc, "uColor"),
      soft: gl.getUniformLocation(this.progDisc, "uSoft"),
    };

    this.vaoDisc = gl.createVertexArray();
    gl.bindVertexArray(this.vaoDisc);

    this.vboDisc = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboDisc);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  +1, -1,  +1, +1,
        -1, -1,  +1, +1,  -1, +1,
      ]),
      gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

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

    // temp
    this._orbit = new Float32Array(3 * 256);

    // cached per begin()
    this._vp = mat4.create();
    this._right = vec3.create();
    this._up = vec3.create();
    this._forward = vec3.create();
    this.models = new ModelRenderer(gl);
    this._modelCache = new Map();
    this._m = mat4.create();
  }

  begin(view, camera) {
    const gl = this.gl;
    const aspect = view.w / view.h;

    // VP = P * V
    const proj = mat4.create();
    mat4.perspective(proj, camera.fovRad, aspect, camera.near, camera.far);

    const viewM = mat4.create();
    mat4.lookAt(viewM, camera.eye, camera.target, camera.up);

    mat4.multiply(this._vp, proj, viewM);

    // camera basis for billboards
    // forward = normalize(target - eye)
    vec3.subtract(this._forward, camera.target, camera.eye);
    vec3.normalize(this._forward, this._forward);

    // right = normalize(cross(forward, up))
    vec3.cross(this._right, this._forward, camera.up);
    vec3.normalize(this._right, this._right);

    // up = cross(right, forward)
    vec3.cross(this._up, this._right, this._forward);
    vec3.normalize(this._up, this._up);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  drawDisc(centerXYZ, radius, colorRGBA, soft = 0.06) {
    const gl = this.gl;

    gl.useProgram(this.progDisc);
    gl.bindVertexArray(this.vaoDisc);

    gl.uniformMatrix4fv(this.uDisc.vp, false, this._vp);
    gl.uniform3fv(this.uDisc.center, centerXYZ);
    gl.uniform1f(this.uDisc.radius, radius);

    gl.uniform3fv(this.uDisc.right, this._right);
    gl.uniform3fv(this.uDisc.up, this._up);

    gl.uniform4fv(this.uDisc.color, colorRGBA);
    gl.uniform1f(this.uDisc.soft, soft);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
  }
async loadGLB(url) {
  if (this._modelCache.has(url)) return this._modelCache.get(url);
  const model = await loadGLBModel(this.gl, url);
  this._modelCache.set(url, model);
  return model;
}

drawModel(model, { position=[0,0,0], scale=[1,1,1], rotationY=0 } = {}) {
  // M = T * RY * S (на gl-matrix)
  mat4.identity(this._m);
  mat4.translate(this._m, this._m, position);
  mat4.rotateY(this._m, this._m, rotationY);
  mat4.scale(this._m, this._m, scale);

  this.models.draw(model, this._vp, this._m);
}
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
      arr[o + 1] = 0;
      arr[o + 2] = z;
    }

    gl.useProgram(this.progLine);
    gl.bindVertexArray(this.vaoLine);

    gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
    gl.uniform4fv(this.uLine.color, colorRGBA);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));

    gl.drawArrays(gl.LINE_LOOP, 0, segments);

    gl.bindVertexArray(null);
  }
  // Включаем ортографию для рисования в экранных пикселях (HUD)
beginOverlay(view) {
  const gl = this.gl;

  // ortho: (0..W, 0..H) с началом в левом верхнем углу
  mat4.ortho(this._vp, 0, view.w, view.h, 0, -1, 1);

  // Для drawDisc: right/up должны соответствовать экранным осям
  this._right[0] = 1; this._right[1] = 0; this._right[2] = 0;
  this._up[0] = 0; this._up[1] = 1; this._up[2] = 0;

  // HUD поверх сцены
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
beginOverlayRect(view, x, y, w, h) {
  const gl = this.gl;

  // сохраняем текущий viewport (чтобы потом вернуть)
  this._savedViewport = gl.getParameter(gl.VIEWPORT);

  // Важно: WebGL viewport/scissor в координатах от НИЗА
  // x,y здесь ожидаются в "верх-лево" экранных пикселях
  const yBottom = view.h - (y + h);

  gl.enable(gl.SCISSOR_TEST);
  gl.viewport(x, yBottom, w, h);
  gl.scissor(x, yBottom, w, h);

  // ortho в локальных координатах миникарты: (0..w, 0..h), y вниз
  mat4.ortho(this._vp, 0, w, h, 0, -1, 1);

  // экранные оси для drawDisc
  this._right[0] = 1; this._right[1] = 0; this._right[2] = 0;
  this._up[0] = 0; this._up[1] = 1; this._up[2] = 0;

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

endOverlayRect() {
  const gl = this.gl;
  if (this._savedViewport) {
    gl.viewport(this._savedViewport[0], this._savedViewport[1], this._savedViewport[2], this._savedViewport[3]);
  }
  gl.disable(gl.SCISSOR_TEST);
}
// Рисует окружность линией в экранных координатах
drawCircle2D(cx, cy, radiusPx, segments = 64, colorRGBA = [1,1,1,0.25]) {
  const gl = this.gl;
  if (segments > 256) segments = 256;

  const arr = this._orbit; // переиспользуем буфер
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(a) * radiusPx;
    const y = cy + Math.sin(a) * radiusPx;
    const o = i * 3;
    arr[o + 0] = x;
    arr[o + 1] = y;
    arr[o + 2] = 0;
  }

  gl.useProgram(this.progLine);
  gl.bindVertexArray(this.vaoLine);

  gl.uniformMatrix4fv(this.uLine.vp, false, this._vp);
  gl.uniform4fv(this.uLine.color, colorRGBA);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLine);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, segments * 3));

  gl.drawArrays(gl.LINE_LOOP, 0, segments);

  gl.bindVertexArray(null);
}
}

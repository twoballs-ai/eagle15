import { createProgram, createWhiteTexture } from "./gl.js";
import { mat3WorldToClip } from "./math.js";

// Simple sprite batcher: one texture (white), draw colored quads.
// Later we can add real sprite textures/atlases.
export class Renderer2D {
  constructor(gl) {
    this.gl = gl;

    // Vertex format per-vertex:
    // a_pos   vec2 (world position)
    // a_uv    vec2 (0..1)
    // a_color vec4 (tint)
    this.floatsPerVertex = 2 + 2 + 4; // 8 floats
    this.vertsPerQuad = 6;            // two triangles
    this.maxQuads = 4000;             // can raise later
    this.maxFloats = this.maxQuads * this.vertsPerQuad * this.floatsPerVertex;
    this.vdata = new Float32Array(this.maxFloats);
    this.countFloats = 0;

    this.program = createProgram(gl, VS, FS);
    this.u_mat = gl.getUniformLocation(this.program, "u_mat");
    this.u_tex = gl.getUniformLocation(this.program, "u_tex");

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vdata.byteLength, gl.DYNAMIC_DRAW);

    const stride = this.floatsPerVertex * 4;
    let off = 0;

    const a_pos = gl.getAttribLocation(this.program, "a_pos");
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, off);
    off += 2 * 4;

    const a_uv = gl.getAttribLocation(this.program, "a_uv");
    gl.enableVertexAttribArray(a_uv);
    gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, stride, off);
    off += 2 * 4;

    const a_color = gl.getAttribLocation(this.program, "a_color");
    gl.enableVertexAttribArray(a_color);
    gl.vertexAttribPointer(a_color, 4, gl.FLOAT, false, stride, off);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.whiteTex = createWhiteTexture(gl);
    this.currentTex = this.whiteTex;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  begin(viewW, viewH, camX, camY, zoom) {
    this.currentTex = this.whiteTex;
    this.countFloats = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.mat = mat3WorldToClip(viewW, viewH, camX, camY, zoom);
  }

async loadTexture(url) {
  const gl = this.gl;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load texture: ${url}`);
  const blob = await res.blob();
  const img = await createImageBitmap(blob);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

useTexture(tex) {
  if (!tex) tex = this.whiteTex;
  if (this.currentTex === tex) return;
  this.flush();            // ⚠️ один батч = одна текстура
  this.currentTex = tex;
}

// Поворотный квад (центр x,y), в тех же "world coords", что и begin(camX/camY/zoom)
quadRot(x, y, w, h, rotRad, r = 1, g = 1, b = 1, a = 1) {
  const need = this.vertsPerQuad * this.floatsPerVertex;
  if (this.countFloats + need > this.vdata.length) this.flush();

  const hw = w * 0.5;
  const hh = h * 0.5;

  // локальные углы + UV
  const corners = [
    [-hw, -hh, 0, 1],
    [ hw, -hh, 1, 1],
    [ hw,  hh, 1, 0],
    [-hw,  hh, 0, 0],
  ];

  const c = Math.cos(rotRad);
  const s = Math.sin(rotRad);

  const rot = (px, py) => [px * c - py * s, px * s + py * c];

  const p0 = rot(corners[0][0], corners[0][1]);
  const p1 = rot(corners[1][0], corners[1][1]);
  const p2 = rot(corners[2][0], corners[2][1]);
  const p3 = rot(corners[3][0], corners[3][1]);

  // два треугольника
  this._v(x + p0[0], y + p0[1], corners[0][2], corners[0][3], r, g, b, a);
  this._v(x + p1[0], y + p1[1], corners[1][2], corners[1][3], r, g, b, a);
  this._v(x + p2[0], y + p2[1], corners[2][2], corners[2][3], r, g, b, a);

  this._v(x + p0[0], y + p0[1], corners[0][2], corners[0][3], r, g, b, a);
  this._v(x + p2[0], y + p2[1], corners[2][2], corners[2][3], r, g, b, a);
  this._v(x + p3[0], y + p3[1], corners[3][2], corners[3][3], r, g, b, a);
}

  // Draw a colored quad centered at (x,y) in world coords
  quad(x, y, w, h, r = 1, g = 1, b = 1, a = 1) {
    // Early flush if buffer is full
    const need = this.vertsPerQuad * this.floatsPerVertex;
    if (this.countFloats + need > this.vdata.length) this.flush();

    const hw = w * 0.5;
    const hh = h * 0.5;

    // corners
    const x0 = x - hw, y0 = y - hh;
    const x1 = x + hw, y1 = y + hh;

    // UVs (full white texture)
    const u0 = 0, v0 = 0, u1 = 1, v1 = 1;

    // Two triangles: (x0,y0)-(x1,y0)-(x1,y1) and (x0,y0)-(x1,y1)-(x0,y1)
    this._v(x0, y0, u0, v0, r, g, b, a);
    this._v(x1, y0, u1, v0, r, g, b, a);
    this._v(x1, y1, u1, v1, r, g, b, a);

    this._v(x0, y0, u0, v0, r, g, b, a);
    this._v(x1, y1, u1, v1, r, g, b, a);
    this._v(x0, y1, u0, v1, r, g, b, a);
  }

  // Simple line as thin quad
  line(x0, y0, x1, y1, thickness = 2, r=1, g=1, b=1, a=1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return;

    const nx = -dy / len;
    const ny = dx / len;
    const t = thickness * 0.5;

    const ax = x0 + nx * t, ay = y0 + ny * t;
    const bx = x0 - nx * t, by = y0 - ny * t;
    const cx = x1 - nx * t, cy = y1 - ny * t;
    const dx2 = x1 + nx * t, dy2 = y1 + ny * t;

    const need = this.vertsPerQuad * this.floatsPerVertex;
    if (this.countFloats + need > this.vdata.length) this.flush();

    // UVs don't matter on white tex
    this._v(ax, ay, 0, 0, r, g, b, a);
    this._v(dx2, dy2, 1, 0, r, g, b, a);
    this._v(cx, cy, 1, 1, r, g, b, a);

    this._v(ax, ay, 0, 0, r, g, b, a);
    this._v(cx, cy, 1, 1, r, g, b, a);
    this._v(bx, by, 0, 1, r, g, b, a);
  }

  flush() {
    const gl = this.gl;
    const vertCount = this.countFloats / this.floatsPerVertex;
    if (vertCount <= 0) return;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, this.currentTex);
    gl.uniform1i(this.u_tex, 0);
    gl.uniformMatrix3fv(this.u_mat, false, this.mat);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vdata.subarray(0, this.countFloats));

    gl.drawArrays(gl.TRIANGLES, 0, vertCount);

    gl.bindVertexArray(null);

    this.countFloats = 0;
  }

  end() {
    this.flush();
  }

  clear(r, g, b, a = 1) {
    const gl = this.gl;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  _v(x, y, u, v, r, g, b, a) {
    let i = this.countFloats;
    const d = this.vdata;
    d[i++] = x; d[i++] = y;
    d[i++] = u; d[i++] = v;
    d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
    this.countFloats = i;
  }
}

const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec4 a_color;

uniform mat3 u_mat;

out vec2 v_uv;
out vec4 v_color;

void main() {
  vec3 clip = u_mat * vec3(a_pos, 1.0);
  gl_Position = vec4(clip.xy, 0.0, 1.0);
  v_uv = a_uv;
  v_color = a_color;
}
`;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec4 v_color;
uniform sampler2D u_tex;
out vec4 outColor;
void main() {
  vec4 tex = texture(u_tex, v_uv);
  outColor = tex * v_color;
}
`;

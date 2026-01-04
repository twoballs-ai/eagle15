// engine/renderer/engineFlame.js
/* ==================== utils ==================== */
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

/* ==================== ENGINE FLAME ==================== */

export class EngineFlame {
  constructor(
    gl,
    {
      max = 1000,
      rate = 160,      // частиц/сек при throttle=1
      life = 0.35,     // сек
      speed = 120,     // world units/sec
      spread = 0.45,   // конус
      size = 10,       // px
      offset = 18,     // world units назад от центра корабля
    } = {}
  ) {
    this.gl = gl;

    this.max = max;
    this.rate = rate;
    this.life = life;
    this.speed = speed;
    this.spread = spread;
    this.size = size;
    this.offset = offset;

    this.count = 0;
    this._emitAcc = 0;

    // simulation arrays (SoA)
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max);
    this.lif = new Float32Array(max);
    this.siz = new Float32Array(max);

    // packed for GPU: [x y z age01 size pad] * count
    this.packed = new Float32Array(max * 6);

    /* ---------- shaders ---------- */
    const vs = compile(gl, gl.VERTEX_SHADER, `#version 300 es
precision highp float;

layout(location=0) in vec3 aPos;
layout(location=1) in float aAge01;
layout(location=2) in float aSize;

uniform mat4 uVP;
uniform float uDpr;

out float vAge01;

void main() {
  vAge01 = aAge01;
  gl_Position = uVP * vec4(aPos, 1.0);

  float s = aSize * mix(1.25, 0.12, aAge01);
  gl_PointSize = max(1.0, s * uDpr);
}
`);

    const fs = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;

in float vAge01;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);

  float a = smoothstep(0.5, 0.2, d);
  float fade = 1.0 - smoothstep(0.55, 1.0, vAge01);

  vec3 c0 = vec3(1.0, 0.95, 0.85);
  vec3 c1 = vec3(1.0, 0.70, 0.20);
  vec3 c2 = vec3(1.0, 0.25, 0.05);

  vec3 col = mix(c0, c1, smoothstep(0.0, 0.4, vAge01));
  col = mix(col, c2, smoothstep(0.4, 1.0, vAge01));

  float core = smoothstep(0.35, 0.0, d);
  col *= (0.55 + 1.0 * core);

  outColor = vec4(col, a * fade);
}
`);

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");

    /* ---------- VAO/VBO ---------- */
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * 6 * max, gl.DYNAMIC_DRAW);

    const stride = 6 * 4;

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 4 * 4);

    gl.bindVertexArray(null);
  }

  /* ---------- simulation ---------- */

  _spawnOne(bx, by, bz, dir, throttle) {
    if (this.count >= this.max) return;

    const i = this.count++;
    const i3 = i * 3;

    // jitter around nozzle
    this.pos[i3 + 0] = bx + (Math.random() - 0.5) * 1.2;
    this.pos[i3 + 1] = by + (Math.random() - 0.5) * 1.2;
    this.pos[i3 + 2] = bz + (Math.random() - 0.5) * 1.2;

    // direction: -dir + noise
    let vx = -dir[0] + (Math.random() - 0.5) * this.spread;
    let vy = -dir[1] + (Math.random() - 0.5) * this.spread;
    let vz = -dir[2] + (Math.random() - 0.5) * this.spread;

    const invLen = 1.0 / Math.max(0.0001, Math.hypot(vx, vy, vz));
    vx *= invLen; vy *= invLen; vz *= invLen;

    const sp =
      this.speed *
      (0.75 + Math.random() * 0.6) *
      (0.65 + throttle * 0.7);

    this.vel[i3 + 0] = vx * sp;
    this.vel[i3 + 1] = vy * sp;
    this.vel[i3 + 2] = vz * sp;

    this.age[i] = 0;
    this.lif[i] = this.life * (0.75 + Math.random() * 0.6);
    this.siz[i] = this.size * (0.75 + Math.random() * 0.6) * (0.65 + throttle * 0.7);
  }

  update(dt, shipPos, shipDir, throttle = 1.0) {
    // simulate + compact
    let i = 0;
    while (i < this.count) {
      const a = this.age[i] + dt;
      this.age[i] = a;

      if (a >= this.lif[i]) {
        const last = this.count - 1;
        if (i !== last) {
          const i3 = i * 3;
          const l3 = last * 3;

          this.pos[i3 + 0] = this.pos[l3 + 0];
          this.pos[i3 + 1] = this.pos[l3 + 1];
          this.pos[i3 + 2] = this.pos[l3 + 2];

          this.vel[i3 + 0] = this.vel[l3 + 0];
          this.vel[i3 + 1] = this.vel[l3 + 1];
          this.vel[i3 + 2] = this.vel[l3 + 2];

          this.age[i] = this.age[last];
          this.lif[i] = this.lif[last];
          this.siz[i] = this.siz[last];
        }
        this.count--;
        continue;
      }

      const i3 = i * 3;
      this.pos[i3 + 0] += this.vel[i3 + 0] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;

      i++;
    }

    // emit
    if (!shipPos || !shipDir || throttle <= 0) return;

    this._emitAcc += this.rate * throttle * dt;
    let n = this._emitAcc | 0;
    if (n <= 0) return;
    this._emitAcc -= n;

    if (n > 90) n = 90;

    const bx = shipPos[0] - shipDir[0] * this.offset;
    const by = shipPos[1] - shipDir[1] * this.offset;
    const bz = shipPos[2] - shipDir[2] * this.offset;

    for (let k = 0; k < n; k++) this._spawnOne(bx, by, bz, shipDir, throttle);
  }

  /* ---------- render ---------- */

  draw(vpMatrix, dpr = 1) {
    const gl = this.gl;
    if (this.count <= 0) return;

    // pack
    for (let i = 0; i < this.count; i++) {
      const o = i * 6;
      const i3 = i * 3;

      this.packed[o + 0] = this.pos[i3 + 0];
      this.packed[o + 1] = this.pos[i3 + 1];
      this.packed[o + 2] = this.pos[i3 + 2];
      this.packed[o + 3] = this.age[i] / Math.max(0.0001, this.lif[i]);
      this.packed[o + 4] = this.siz[i];
      this.packed[o + 5] = 0.0;
    }

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);

    gl.uniformMatrix4fv(this.uVP, false, vpMatrix);
    gl.uniform1f(this.uDpr, dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.packed.subarray(0, this.count * 6));

    // additive blending (огонь)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    // не пишем в depth, чтобы не “дырявить” сцену
    gl.depthMask(false);

    gl.drawArrays(gl.POINTS, 0, this.count);

    gl.depthMask(true);
    gl.disable(gl.BLEND);

    gl.bindVertexArray(null);
  }
}

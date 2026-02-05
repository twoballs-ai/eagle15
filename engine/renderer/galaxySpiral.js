// engine/renderer/galaxySpiral.js
// Спиральная галактика из point-sprites (blurred dots) на плоскости XZ.
// Рисуется ортокамерой сверху в GalaxyMapScene.

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

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Gaussian-ish random (cheap)
function randN(R) {
  const u = Math.max(1e-6, R());
  const v = Math.max(1e-6, R());
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Палитра “реальная”: тёплое ядро, голубоватые рукава
function mix3(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export class GalaxySpiral {
  constructor(gl, {
    seed = 1337,
    count = 18000,
    arms = 3,
    radius = 2600,
    coreRadius = 520,
    thickness = 240,
  } = {}) {
    this.gl = gl;
    this.seed = seed;
    this.count = count;
    this.arms = arms;
    this.radius = radius;
    this.coreRadius = coreRadius;
    this.thickness = thickness;

    // layout: x,y,z, size, r,g,b, a
    this.buf = new Float32Array(this.count * 8);

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
  // point sprite in [0..1]
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);

  // "blurred dot" profile:
  // мягкое ядро + хвост (примерно как гаусс)
  float core = smoothstep(1.0, 0.0, r);
  float halo = exp(-r*r*3.5);
  float a = vAlpha * max(core*0.55, halo);

  // чуть приглушаем край
  a *= smoothstep(1.0, 0.65, r);

  outColor = vec4(vColor, a);
}
`);

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf, gl.STATIC_DRAW);

    const stride = 8 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 4 * 4);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 7 * 4);

    gl.bindVertexArray(null);

    this.regen(seed);
  }

  regen(seed = this.seed) {
    this.seed = seed;
    const R = mulberry32(seed);

    const warmCore = [1.00, 0.82, 0.55];
    const coolArm  = [0.70, 0.86, 1.00];
    const faint    = [0.90, 0.95, 1.00];

    // лог-спираль: r = a * e^(b*theta)
    // arms: разнесём фазы
    const arms = Math.max(2, this.arms | 0);
    const a = 90;               // стартовый масштаб
    const b = 0.18;             // "закрутка" (больше = сильнее спираль)
    const maxTheta = 9.5;       // сколько оборотов развернуть

    let k = 0;
    for (let i = 0; i < this.count; i++) {
      // Распределение: больше точек в центре и в рукавах,
      // но достаточно шума чтобы было "реально".
      const t = Math.pow(R(), 0.62);         // bias к центру
      const inCore = t < 0.24;

      let x = 0, z = 0;

      if (inCore) {
        // Балдж (ядро): почти эллипс, плотный
        const r = Math.pow(R(), 0.35) * this.coreRadius;
        const ang = R() * Math.PI * 2;
        x = Math.cos(ang) * r * (1.0 + 0.25 * randN(R));
        z = Math.sin(ang) * r * (1.0 + 0.25 * randN(R));
      } else {
        // Рукава: выбираем рукав, theta, получаем r
        const arm = (R() * arms) | 0;
        const phase = (arm / arms) * (Math.PI * 2);

        // theta растёт, r растёт лог-спирально
        const theta = R() * maxTheta + phase;

        // базовый радиус по спирали
        let r = a * Math.exp(b * theta);

        // нормируем к желаемому radius
        // (плавно "обрезаем" чтобы не улетало)
        const rNorm = r / (a * Math.exp(b * maxTheta));
        r = rNorm * this.radius;

        // ширина рукава (возрастает к краю)
        const armWidth = lerp(35, 160, rNorm) * (1.0 + 0.25 * randN(R));
        const jitter = randN(R) * armWidth;

        // немного "пушистости" вокруг рукава
        const ang = theta + jitter / Math.max(40, r);

        x = Math.cos(ang) * r + randN(R) * (armWidth * 0.20);
        z = Math.sin(ang) * r + randN(R) * (armWidth * 0.20);

        // диск (фоновые точки между рукавами)
        if (R() < 0.22) {
          const rr = Math.pow(R(), 0.82) * this.radius;
          const aa = R() * Math.PI * 2;
          x = Math.cos(aa) * rr + randN(R) * 18;
          z = Math.sin(aa) * rr + randN(R) * 18;
        }
      }

      // Толщина (по Y): очень тонкий диск, чуть пышнее к центру
      const r2 = Math.hypot(x, z);
      const thick = lerp(this.thickness, this.thickness * 0.25, clamp(r2 / this.radius, 0, 1));
      const y = randN(R) * (thick * 0.12);

      // Цвет: центр тёплый, рукава холоднее
      const cn = clamp(r2 / this.radius, 0, 1);
      const c1 = mix3(warmCore, coolArm, Math.pow(cn, 0.55));
      const c2 = mix3(c1, faint, 0.20 * R()); // лёгкая вариативность
      const col = c2;

      // Размер и альфа: центр ярче, рукава средние, края слабые
      const baseSize = inCore ? (7 + R() * 14) : (3.2 + R() * 7.5);
      const size = baseSize * (1.0 + 0.30 * randN(R));

      let alpha = inCore ? (0.18 + R() * 0.35) : (0.06 + R() * 0.20);
      alpha *= (1.0 - 0.55 * cn); // даль слабее
      alpha = clamp(alpha, 0.02, 0.65);

      this.buf[k++] = x;
      this.buf[k++] = y;
      this.buf[k++] = z;
      this.buf[k++] = size;
      this.buf[k++] = col[0];
      this.buf[k++] = col[1];
      this.buf[k++] = col[2];
      this.buf[k++] = alpha;
    }

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  draw(vpMat4, dpr = 1) {
    const gl = this.gl;

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform1f(this.uDpr, dpr);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.enable(gl.BLEND);
    // “светящаяся” галактика
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
}

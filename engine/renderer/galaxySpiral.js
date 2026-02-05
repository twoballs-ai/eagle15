// engine/renderer/galaxySpiral.js
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

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

// детерминированный RNG
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(R) {
  const u = Math.max(1e-6, R());
  const v = Math.max(1e-6, R());
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

export class GalaxySpiral {
  constructor(
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

layout(location=0) in vec3 aPos;       // X,Y,Z
layout(location=1) in float aSize;     // px
layout(location=2) in vec3 aColor;     // rgb
layout(location=3) in float aAlpha;    // base alpha

// ✅ для морганий
layout(location=4) in float aTwSpeed;  // speed
layout(location=5) in float aTwPhase;  // phase

uniform mat4 uVP;
uniform float uDpr;
uniform float uTime;

out vec3 vColor;
out float vAlpha;

void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
  gl_PointSize = aSize * uDpr;

  // ✅ более заметное мерцание, но без “строба”
  // диапазон примерно 0.70..1.35
float tw = 0.98 + 0.22 * sin(uTime * aTwSpeed + aTwPhase);
tw *= (0.95 + 0.08 * sin(uTime * (aTwSpeed * 0.33) + aTwPhase * 1.73));
tw = clamp(tw, 0.72, 1.32);

  vColor = aColor;
  vAlpha = aAlpha * tw;
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

// ✅ резче и плотнее (меньше "тумана")
float core = smoothstep(0.92, 0.18, r);   // более плотное ядро
float haze = smoothstep(0.95, 0.65, r);   // узкий ореол (не мыло)

// сильнее ядро, слабее ореол
float a = (0.10 * haze + 0.90 * core) * vAlpha;

  // ✅ сине-свечение, но не в серый
  vec3 tint = vec3(1.00, 1.10, 1.32);
  vec3 col = vColor * tint;

  // ✅ усиление насыщенности (чтобы цвета были “сочные”)
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.55);   // 1.35..1.80
  col = clamp(col, 0.0, 3.0);


  // ✅ ярче центр, но без расползания
col *= (0.92 + 0.65 * core);

  outColor = vec4(col, a);
}
`,
    );

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uDpr = gl.getUniformLocation(this.prog, "uDpr");
    this.uTime = gl.getUniformLocation(this.prog, "uTime");

    this.vbo = gl.createBuffer();
    this.vao = gl.createVertexArray();

    // ✅ 10 floats:
    // pos3 + size1 + color3 + alpha1 + twSpeed1 + twPhase1
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

    gl.bindVertexArray(null);

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

    // единый “синий” цвет рукавов
    const baseCol = [0.7, 0.85, 1.0];

    // цветные звезды (сочные)
    const speckPalette = [
      [1.0, 0.45, 0.2], // красно-оранжевые (сочнее)
      [1.0, 0.7, 0.2], // оранжево-жёлтые
      [1.0, 0.98, 0.55], // тёплые бело-жёлтые
      [0.35, 0.85, 1.0], // голубые
      [0.6, 0.4, 1.0], // фиолетовые
      [1.0, 0.35, 1.0], // магента
      [0.3, 1.0, 0.7], // бирюза-зелёные
    ];

    // pos3 + size1 + color3 + alpha1 + twSpeed1 + twPhase1
    const buf = new Float32Array(N * 10);

    // лог-спираль
    const a = 40;
    const b = 0.22;

    const armWidth = 95;
    const armJitter = 0.3;

    const coreFrac = 0.03;
    const Tmax = 10.5;

const sizeMin = 5.4;
const sizeMaxAdd = 9.2;

    // ❗️ВАЖНО: при additive альфы 0.5..0.8 => всё выбеливает и “серит” цвета.
    // Делаем альфу небольшой, а яркость — size + шейдер.
    const alphaMin = 0.16;
    const alphaMaxAdd = 0.18;
    const alphaMaxClamp = 0.34;

    for (let i = 0; i < N; i++) {
      const arm = i % armN;

      // t почти равномерно
      let t = R() * Tmax;
      const u = R();
      t = mix(t, t * u, 0.25);

      let r = a * Math.exp(b * t);
      r = (r / (a * Math.exp(b * Tmax))) * this.radius;

      let theta = t + arm * ((Math.PI * 2.0) / armN);
      theta += gauss(R) * 0.06;

      let x = Math.cos(theta) * r;
      let z = Math.sin(theta) * r;

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

      // базовый синий + микровариативность
      let rCol = baseCol[0],
        gCol = baseCol[1],
        bCol = baseCol[2];
      const milk = 0.018 * gauss(R);
      rCol = clamp01(rCol + milk);
      gCol = clamp01(gCol + milk * 0.7);
      bCol = clamp01(bCol + milk * 1.0);

      // size
      let size = sizeMin + 0.6 + (sizeMaxAdd + 0.8) * R();

      // alpha (маленькая!)
      let alpha = alphaMin + alphaMaxAdd * R();
      alpha = Math.min(alpha, alphaMaxClamp);

      // мягкий анти-пересвет в самом центре
      const nr = Math.min(1, Math.hypot(x, z) / (this.radius * 0.3));
      const centerCut = mix(0.92, 1.0, nr);
      alpha *= centerCut;

      // ===== ЦВЕТНАЯ ПОПУЛЯЦИЯ (реально применяется ДО записи в buf) =====
      // больше цветных на внешних рукавах
      const rrN = Math.min(1, Math.hypot(x, z) / this.radius);
      const pColor = 0.1 + 0.18 * rrN; // 10%..28%

      if (R() < pColor) {
        const sc = speckPalette[(R() * speckPalette.length) | 0];

        // насыщенность: чаще заметная, иногда “вау”
        let k = 0.55 + 0.35 * R(); // 0.55..0.90
        if (R() < 0.2) k = 0.95; // редкие ультра-цветные

        rCol = clamp01(rCol * (1 - k) + sc[0] * k);
        gCol = clamp01(gCol * (1 - k) + sc[1] * k);
        bCol = clamp01(bCol * (1 - k) + sc[2] * k);

        // цветные чуть крупнее и ярче (но альфа всё ещё под контролем)
        size *= 1.12 + 0.25 * R();
        alpha *= 1.1 + 0.3 * R();
        alpha = Math.min(alpha, 0.38);

        // лёгкий “boost” цвета (аддитив любит это)
        const boost = 1.05 + 0.22 * R();
        rCol = clamp01(rCol * boost);
        gCol = clamp01(gCol * boost);
        bCol = clamp01(bCol * boost);
      }

      // ✅ моргание — много объектов + разные частоты
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
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // timeSec нужен для моргания
  draw(vpMat4, dpr = 1, timeSec = 0) {
    const gl = this.gl;

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVP, false, vpMat4);
    gl.uniform1f(this.uDpr, dpr);
    gl.uniform1f(this.uTime, timeSec);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
}

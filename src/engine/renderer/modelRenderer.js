// engine/render/modelRenderer.js
// Рендер мешей (GLB) отдельно от Renderer3D.
import { createProgram } from "../gl.js";

export class ModelRenderer {
  constructor(gl) {
    this.gl = gl;

    const vs = `#version 300 es
      precision highp float;

      layout(location=0) in vec3 aPos;
      layout(location=1) in vec3 aNrm;
      layout(location=2) in vec2 aUV;

      uniform mat4 uVP;
      uniform mat4 uM;
      uniform mat3 uNormalMatrix;

      out vec3 vN;
      out vec2 vUV;
      out vec3 vWorldPos;

      void main() {
        vec4 worldPos = uM * vec4(aPos, 1.0);
        gl_Position = uVP * worldPos;
        vN = uNormalMatrix * aNrm;
        vUV = aUV;
        vWorldPos = worldPos.xyz;
      }
    `;

   const fs = `#version 300 es
  precision highp float;

  in vec3 vN;
  in vec2 vUV;
  in vec3 vWorldPos;

  uniform vec4 uBaseColor;
  uniform sampler2D uBaseTex;
  uniform int uHasTex;

  uniform float uAmbient;   // базовый рассеянный свет (0..1+)
  uniform float uEmissive;  // самосвечение (0..N)
  uniform float uSpecular;  // интенсивность зеркального блика (0..1)

  out vec4 outColor;

  void main() {
    vec4 c = uBaseColor;
    if (uHasTex == 1) {
      c *= texture(uBaseTex, vUV);
    }

    // Дефолт для top-down: много ambient, слабый направленный свет
    vec3 n = normalize(vN);
    float diff = 0.0;
    float spec = 0.0;

    if (length(n) > 0.0001) {
      vec3 L = normalize(vec3(0.4, 0.9, 0.2));
      diff = max(dot(n, L), 0.0);

      // Specular (Blinn-Phong)
      vec3 V = normalize(vec3(0.0, 0.0, 1.0)); // камера смотрит вдоль +Z
      vec3 H = normalize(L + V);
      float NdotH = max(dot(n, H), 0.0);
      spec = pow(NdotH, 32.0) * uSpecular; // 32.0 - жёсткость блика
    }

    // итог: ambient + объём + specular + emissive
    vec3 lit = c.rgb * (uAmbient + (1.0 - uAmbient) * diff);
    vec3 emi = c.rgb * uEmissive;

    // Добавляем specular (белый блик для реализма)
    vec3 finalColor = lit + emi + vec3(spec);

    outColor = vec4(finalColor, 1.0);
  }
`;


    this.prog = createProgram(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uM = gl.getUniformLocation(this.prog, "uM");
    this.uNormalMatrix = gl.getUniformLocation(this.prog, "uNormalMatrix");
    this.uBaseColor = gl.getUniformLocation(this.prog, "uBaseColor");
    this.uBaseTex = gl.getUniformLocation(this.prog, "uBaseTex");
    this.uHasTex = gl.getUniformLocation(this.prog, "uHasTex");
    this.uAmbient = gl.getUniformLocation(this.prog, "uAmbient");
    this.uEmissive = gl.getUniformLocation(this.prog, "uEmissive");
    this.uSpecular = gl.getUniformLocation(this.prog, "uSpecular");
  }

  draw(model, vpMat, modelMat, { ambient = 0.85, emissive = 0.0, specular = 0.3 } = {}) {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.uVP, false, vpMat);
    gl.uniformMatrix4fv(this.uM, false, modelMat);

    // Вычисляем матрицу нормалей (inverse transpose of upper-left 3x3 of model matrix)
    const normalMatrix = new Float32Array([
      modelMat[0], modelMat[1], modelMat[2],
      modelMat[4], modelMat[5], modelMat[6],
      modelMat[8], modelMat[9], modelMat[10]
    ]);
    gl.uniformMatrix3fv(this.uNormalMatrix, false, normalMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.uBaseTex, 0);
    gl.uniform1f(this.uAmbient, ambient);
    gl.uniform1f(this.uEmissive, emissive);
    gl.uniform1f(this.uSpecular, specular);
    for (const prim of model.primitives) {
      gl.uniform4fv(this.uBaseColor, prim.material.baseColorFactor);
      gl.uniform1i(this.uHasTex, prim.material.baseColorTex ? 1 : 0);
      gl.bindTexture(gl.TEXTURE_2D, prim.material.baseColorTex);

      gl.bindVertexArray(prim.vao);

      if (prim.indexed) {
        const type = prim.indexType === 5125 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        gl.drawElements(gl.TRIANGLES, prim.indexCount, type, 0);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, prim.vertexCount);
      }
    }

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
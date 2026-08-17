// engine/renderer/modelRenderer.js
import { createProgram } from "../gl.js";

export class ModelRenderer {
  constructor(gl) {
    this.gl = gl;

    const vs = `#version 300 es
      precision highp float;

      layout(location=0) in vec3 aPos;
      layout(location=1) in vec3 aNrm;
      layout(location=2) in vec2 aUV;
      layout(location=4) in vec4 aTangent; // ✅ Добавлен TANGENT

      uniform mat4 uVP;
      uniform mat4 uM;
      uniform mat3 uNormalMatrix;

      out vec3 vN;
      out vec3 vT;
      out vec3 vB;
      out vec2 vUV;
      out vec3 vWorldPos;

      void main() {
        vec4 worldPos = uM * vec4(aPos, 1.0);
        gl_Position = uVP * worldPos;
        
        // Преобразуем нормали и касательные в мировое пространство
        vec3 N = normalize(uNormalMatrix * aNrm);
        vec3 T = normalize(uNormalMatrix * aTangent.xyz);
        
        // Вычисляем бинормаль (Bitangent) с учетом handedness (aTangent.w)
        vB = normalize(cross(N, T) * aTangent.w);
        vT = T;
        vN = N;
        
        vUV = aUV;
        vWorldPos = worldPos.xyz;
      }
    `;

    const fs = `#version 300 es
      precision highp float;

      in vec3 vN;
      in vec3 vT;
      in vec3 vB;
      in vec2 vUV;
      in vec3 vWorldPos;

      uniform vec4 uBaseColor;
      uniform sampler2D uBaseTex;
      uniform int uHasTex;

      uniform sampler2D uNormalTex; // ✅ Текстура нормалей
      uniform int uHasNormalTex;    // ✅ Флаг наличия
      uniform float uNormalScale;   // ✅ Сила рельефа

      uniform float uAmbient;
      uniform float uEmissive;
      uniform float uSpecular;

      out vec4 outColor;

      void main() {
        vec4 c = uBaseColor;
        if (uHasTex == 1) {
          c *= texture(uBaseTex, vUV);
        }

        vec3 n = normalize(vN);
        
        // ✅ Если есть карта нормалей, модифицируем нормаль поверхности
        if (uHasNormalTex == 1) {
            // Читаем нормаль из текстуры (диапазон 0..1) и переводим в -1..1
            vec3 normalMap = texture(uNormalTex, vUV).rgb * 2.0 - 1.0;
            
            // Применяем масштаб рельефа (упрощенно, через усиление Z)
            normalMap.z = mix(1.0, normalMap.z, uNormalScale);
            normalMap = normalize(normalMap);

            // Строим TBN матрицу для перевода нормали из касательного пространства в мировое
            mat3 TBN = mat3(normalize(vT), normalize(vB), n);
            n = normalize(TBN * normalMap);
        }

        float diff = 0.0;
        float spec = 0.0;

        if (length(n) > 0.0001) {
          // Направленный свет (Солнце)
          vec3 L = normalize(vec3(0.4, 0.9, 0.2));
          diff = max(dot(n, L), 0.0);

          // Specular (Blinn-Phong)
          vec3 V = normalize(vec3(0.0, 0.0, 1.0)); 
          vec3 H = normalize(L + V);
          float NdotH = max(dot(n, H), 0.0);
          spec = pow(NdotH, 32.0) * uSpecular;
        }

        // ✅ ВАЖНО: Уменьшаем влияние ambient при наличии нормалей, чтобы рельеф отбрасывал тени
        float effectiveAmbient = uHasNormalTex == 1 ? min(uAmbient, 0.4) : uAmbient;

        vec3 lit = c.rgb * (effectiveAmbient + (1.0 - effectiveAmbient) * diff);
        vec3 emi = c.rgb * uEmissive;

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
    
    // ✅ Новые uniform-переменные для нормалей
    this.uNormalTex = gl.getUniformLocation(this.prog, "uNormalTex");
    this.uHasNormalTex = gl.getUniformLocation(this.prog, "uHasNormalTex");
    this.uNormalScale = gl.getUniformLocation(this.prog, "uNormalScale");
    
    this.uAmbient = gl.getUniformLocation(this.prog, "uAmbient");
    this.uEmissive = gl.getUniformLocation(this.prog, "uEmissive");
    this.uSpecular = gl.getUniformLocation(this.prog, "uSpecular");
  }

  draw(model, vpMat, modelMat, { ambient = 0.85, emissive = 0.0, specular = 0.3, normalScale = 1.0 } = {}) {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.uVP, false, vpMat);
    gl.uniformMatrix4fv(this.uM, false, modelMat);

    const normalMatrix = new Float32Array([
      modelMat[0], modelMat[1], modelMat[2],
      modelMat[4], modelMat[5], modelMat[6],
      modelMat[8], modelMat[9], modelMat[10]
    ]);
    gl.uniformMatrix3fv(this.uNormalMatrix, false, normalMatrix);

    gl.uniform1f(this.uAmbient, ambient);
    gl.uniform1f(this.uEmissive, emissive);
    gl.uniform1f(this.uSpecular, specular);
    gl.uniform1f(this.uNormalScale, normalScale); // ✅ Передаем силу рельефа

    for (const prim of model.primitives) {
      gl.uniform4fv(this.uBaseColor, prim.material.baseColorFactor);
      gl.uniform1i(this.uHasTex, prim.material.baseColorTex ? 1 : 0);
      
      // ✅ Настройка карты нормалей
      gl.uniform1i(this.uHasNormalTex, prim.material.normalTex ? 1 : 0);
      if (prim.material.normalTex) {
          gl.activeTexture(gl.TEXTURE1); // Используем текстурный юнит 1 для нормалей
          gl.bindTexture(gl.TEXTURE_2D, prim.material.normalTex);
          gl.uniform1i(this.uNormalTex, 1);
      }

      // Возвращаем активный юнит к 0 для baseColor
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, prim.material.baseColorTex);
      gl.uniform1i(this.uBaseTex, 0);

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
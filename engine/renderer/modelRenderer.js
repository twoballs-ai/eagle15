// engine/render/modelRenderer.js
// Рендер мешей (GLB) отдельно от Renderer3D.

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

export class ModelRenderer {
  constructor(gl) {
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, `#version 300 es
      precision highp float;

      layout(location=0) in vec3 aPos;
      layout(location=1) in vec3 aNrm;
      layout(location=2) in vec2 aUV;

      uniform mat4 uVP;
      uniform mat4 uM;

      out vec3 vN;
      out vec2 vUV;

      void main() {
        gl_Position = uVP * uM * vec4(aPos, 1.0);
        vN = mat3(uM) * aNrm;
        vUV = aUV;
      }
    `);

    const fs = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;

      in vec3 vN;
      in vec2 vUV;

      uniform vec4 uBaseColor;
      uniform sampler2D uBaseTex;
      uniform int uHasTex;

      out vec4 outColor;

      void main() {
        vec4 c = uBaseColor;
        if (uHasTex == 1) c *= texture(uBaseTex, vUV);

        // простой свет чтобы объём читался
        vec3 n = normalize(vN);
        float lit = 1.0;
        if (length(n) > 0.0001) {
          vec3 L = normalize(vec3(0.4, 0.9, 0.2));
          lit = 0.35 + 0.65 * max(dot(n, L), 0.0);
        }
        outColor = vec4(c.rgb * lit, c.a);
      }
    `);

    this.prog = link(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uM = gl.getUniformLocation(this.prog, "uM");
    this.uBaseColor = gl.getUniformLocation(this.prog, "uBaseColor");
    this.uBaseTex = gl.getUniformLocation(this.prog, "uBaseTex");
    this.uHasTex = gl.getUniformLocation(this.prog, "uHasTex");
  }

  draw(model, vpMat, modelMat) {
    const gl = this.gl;
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.uVP, false, vpMat);
    gl.uniformMatrix4fv(this.uM, false, modelMat);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.uBaseTex, 0);

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

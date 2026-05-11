#ifndef MODELRENDERER_HPP
#define MODELRENDERER_HPP

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

class ModelRenderer {
public:
    // Constructor
    ModelRenderer();
};

} // namespace lostjump

#endif // MODELRENDERER_HPP

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
#include "gl.js.hpp"





class ModelRenderer {
  ModelRenderer(gl) {
    this.gl = gl;

    const vs = `#version 300 es
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
    `;

   const fs = `#version 300 es
  precision highp float;

  in vec3 vN;
  in vec2 vUV;

  uniform vec4 uBaseColor;
  uniform sampler2D uBaseTex;
  uniform int uHasTex;

  uniform float uAmbient;   
  uniform float uEmissive;  

  out vec4 outColor;

  void main() {
    vec4 c = uBaseColor;
    if (uHasTex == 1) c *= texture(uBaseTex, vUV);

    
    vec3 n = normalize(vN);
    float diff = 0.0;

    if (length(n) > 0.0001) {
      vec3 L = normalize(vec3(0.4, 0.9, 0.2));
      diff = max(dot(n, L), 0.0);
    }

    
    vec3 lit = c.rgb * (uAmbient + (1.0 - uAmbient) * diff);
    vec3 emi = c.rgb * uEmissive;

    outColor = vec4(lit + emi, 1.0); 
  }
`;


    this.prog = createProgram(gl, vs, fs);
    this.uVP = gl.getUniformLocation(this.prog, "uVP");
    this.uM = gl.getUniformLocation(this.prog, "uM");
    this.uBaseColor = gl.getUniformLocation(this.prog, "uBaseColor");
    this.uBaseTex = gl.getUniformLocation(this.prog, "uBaseTex");
    this.uHasTex = gl.getUniformLocation(this.prog, "uHasTex");
    this.uAmbient = gl.getUniformLocation(this.prog, "uAmbient");
this.uEmissive = gl.getUniformLocation(this.prog, "uEmissive");
  }

  draw(model, vpMat, modelMat, { ambient = 0.85, emissive = 0.0 } = {}) {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
gl.disable(gl.BLEND);
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.uVP, false, vpMat);
    gl.uniformMatrix4fv(this.uM, false, modelMat);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.uBaseTex, 0);
    gl.uniform1f(this.uAmbient, ambient);
    gl.uniform1f(this.uEmissive, emissive);
    for(const auto& prim : model.primitives) {
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

    gl.bindVertexArray(nullptr);
    gl.bindTexture(gl.TEXTURE_2D, nullptr);
  }
}


} // namespace lostjump

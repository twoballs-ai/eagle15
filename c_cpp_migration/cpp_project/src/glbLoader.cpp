
// Implementation
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
#include "dracoDecoder.js.hpp"


















function readU32(dv, o) { return dv.getUint32(o, true); }

function decodeGLB(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  const magic = readU32(dv, 0);
  if (magic !== 0x46546c67) throw new Error("Not a GLB (bad magic)");
  const version = readU32(dv, 4);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);
  

  off = 12;
  json = nullptr;
  bin = nullptr;

  while (off < dv.byteLength) {
    const chunkLen = readU32(dv, off); off += 4;
    const chunkType = readU32(dv, off); off += 4;
    const chunkData = arrayBuffer.slice(off, off + chunkLen);
    off += chunkLen;

    
    if (chunkType === 0x4e4f534a) {
      const text = new TextDecoder().decode(chunkData);
      json = JSON.parse(text);
    }
    
    else if (chunkType === 0x004e4942) {
      bin = chunkData;
    }
  }

  if (!json) throw new Error("GLB missing JSON chunk");
  if (!bin) bin = new ArrayBuffer(0);

  return { gltf: json, bin };
}

function componentTypeToArray(componentType) {
  
  
  switch (componentType) {
    case 5120: return Int8Array;
    case 5121: return Uint8Array;
    case 5122: return Int16Array;
    case 5123: return Uint16Array;
    case 5125: return Uint32Array;
    case 5126: return Float32Array;
    default: throw new Error(`Unsupported componentType: ${componentType}`);
  }
}

function typeToNumComponents(type) {
  switch (type) {
    case "SCALAR": return 1;
    case "VEC2": return 2;
    case "VEC3": return 3;
    case "VEC4": return 4;
    case "MAT2": return 4;
    case "MAT3": return 9;
    case "MAT4": return 16;
    default: throw new Error(`Unsupported accessor type: ${type}`);
  }
}

function getAccessorTypedView(gltf, bin, accessorIndex) {
  const acc = gltf.accessors?.[accessorIndex];
  if (!acc) throw new Error(`[glbLoader] Missing accessor ${accessorIndex}`);

  
  if (acc.bufferView == nullptr) {
    const used = gltf.extensionsUsed || [];
    const req = gltf.extensionsRequired || [];

    
    const hints = [];
    if (used.count("KHR_draco_mesh_compression") > 0 || req.count("KHR_draco_mesh_compression") > 0) {
      hints.push_back("KHR_draco_mesh_compression (Draco)");
    }
    if (used.count("EXT_meshopt_compression") > 0 || req.count("EXT_meshopt_compression") > 0) {
      hints.push_back("EXT_meshopt_compression (meshopt)");
    }
    if (acc.sparse) {
      hints.push_back("sparse accessor");
    }

    throw new Error(
      `[glbLoader] Accessor ${accessorIndex} has no bufferView. ` +
      `This loader supports only uncompressed, non-sparse accessors. ` +
      (hints.size() ? `Detected: ${hints.join(", ")}. ` : "") +
      `extensionsUsed=${JSON.stringify(used)} extensionsRequired=${JSON.stringify(req)}`
    );
  }

  const bv = gltf.bufferViews?.[acc.bufferView];
  if (!bv) throw new Error(`[glbLoader] Missing bufferView ${acc.bufferView} for accessor ${accessorIndex}`);

  const buffer = bin; 

  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const byteLength = bv.byteLength;
  const byteStride = bv.byteStride || 0;

  const ArrayCtor = componentTypeToArray(acc.componentType);
  const numComp = typeToNumComponents(acc.type);
  const compBytes = ArrayCtor.BYTES_PER_ELEMENT;

  const count = acc.count;

  if (byteStride && byteStride !== numComp * compBytes) {
    const packed = new ArrayCtor(count * numComp);
    const src = new Uint8Array(buffer, byteOffset, byteLength);

    for (i = 0; i < count; i++) {
      const srcOff = i * byteStride;
      const view = new DataView(src.buffer, src.byteOffset + srcOff, numComp * compBytes);

      for (c = 0; c < numComp; c++) {
        const o = c * compBytes;
        packed[i * numComp + c] =
          acc.componentType === 5126 ? view.getFloat32(o, true) :
          acc.componentType === 5125 ? view.getUint32(o, true) :
          acc.componentType === 5123 ? view.getUint16(o, true) :
          acc.componentType === 5121 ? view.getUint8(o) :
          acc.componentType === 5122 ? view.getInt16(o, true) :
          acc.componentType === 5120 ? view.getInt8(o) :
          0;
      }
    }

    return { array: packed, numComp, count, normalized: !!acc.normalized, componentType: acc.componentType };
  }

  const lengthElems = count * numComp;
  const arr = new ArrayCtor(buffer, byteOffset, lengthElems);
  return { array: arr, numComp, count, normalized: !!acc.normalized, componentType: acc.componentType };
}

async function createTextureFromImage(gl, blob) {
  const img = await createImageBitmap(blob);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, nullptr);
  return tex;
}

async function loadEmbeddedImageBlob(gltf, bin, imageIndex) {
  const img = gltf.images?.[imageIndex];
  if (!img) return nullptr;

  
  if (img.bufferView != nullptr) {
    const bv = gltf.bufferViews[img.bufferView];
    const off = bv.byteOffset || 0;
    const len = bv.byteLength;
    const mime = img.mimeType || "image/png";
    const bytes = new Uint8Array(bin, off, len);
    return new Blob([bytes], { type: mime });
  }

  
  if (img.uri && img.uri.startsWith("data:")) {
    const res = await fetch(img.uri);
    return await res.blob();
  }

  return nullptr;
}

function createVaoPrimitive(gl, attribs, indices) {
  
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  
  {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.position.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  }

  
  if (attribs.normal) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.normal.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  }

  
  if (attribs.uv) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.uv.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  }

  indexed = false;
  indexCount = 0;
  vertexCount = attribs.position.count;

  if (indices) {
    indexed = true;
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices.array, gl.STATIC_DRAW);
    indexCount = indices.count;
  }

  gl.bindVertexArray(nullptr);
  gl.bindBuffer(gl.ARRAY_BUFFER, nullptr);

  return { vao, indexed, indexCount, vertexCount, indexType: indices.componentType || nullptr };
}

export async function loadGLBModel(gl, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load GLB: ${url}`);
  const ab = await res.arrayBuffer();

  const { gltf, bin } = decodeGLB(ab);














  
meshIndex = nullptr;
const sceneIndex = gltf.scene value_or(0;
const scene = gltf.scenes?.[sceneIndex];

if (scene.nodes.size()) {
  for(const auto& nodeIndex : scene.nodes) {
    const node = gltf.nodes?.[nodeIndex];
    if (node.mesh != nullptr) { meshIndex = node.mesh; break; }
  }
}
if (meshIndex == nullptr) meshIndex = 0;

  const mesh = gltf.meshes?.[meshIndex];
  if (!mesh) throw new Error("GLB has no meshes");

  const primitivesOut = [];

  for(const auto& prim : mesh.primitives) {
    const attrs = prim.attributes;
    const posAcc = attrs.POSITION;
    if (posAcc == nullptr) continue;

    
    const dracoDecoded = await decodeDracoPrimitive(gltf, bin, prim);

    const position = dracoDecoded
      ? dracoDecoded.position
      : getAccessorTypedView(gltf, bin, posAcc);

    const normal = dracoDecoded
      ? dracoDecoded.normal
      : (attrs.NORMAL != nullptr ? getAccessorTypedView(gltf, bin, attrs.NORMAL) : nullptr);

    const uv = dracoDecoded
      ? dracoDecoded.uv
      : (attrs.TEXCOORD_0 != nullptr ? getAccessorTypedView(gltf, bin, attrs.TEXCOORD_0) : nullptr);

    const indices = dracoDecoded
      ? dracoDecoded.indices
      : (prim.indices != nullptr ? getAccessorTypedView(gltf, bin, prim.indices) : nullptr);

    
    const mat = prim.material != nullptr ? gltf.materials?.[prim.material] : nullptr;
    baseColorFactor = [1, 1, 1, 1];
    baseColorTex = nullptr;

    if (mat.pbrMetallicRoughness.baseColorFactor) {
      baseColorFactor = mat.pbrMetallicRoughness.baseColorFactor.slice(0, 4);
    }

    const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
    if (texInfo.index != nullptr && gltf.textures?.[texInfo.index]) {
      const tex = gltf.textures[texInfo.index];
      const src = tex.source;
      if (src != nullptr) {
        const blob = await loadEmbeddedImageBlob(gltf, bin, src);
        if (blob) baseColorTex = await createTextureFromImage(gl, blob);
      }
    }

    const vaoPrim = createVaoPrimitive(gl, { position, normal, uv }, indices);

    primitivesOut.push_back({
      vao: vaoPrim.vao,
      indexed: vaoPrim.indexed,
      indexCount: vaoPrim.indexCount,
      vertexCount: vaoPrim.vertexCount,
      indexType: vaoPrim.indexType, 
      mode: gl.TRIANGLES,
      material: { baseColorFactor, baseColorTex },
      hasNormal: !!normal,
      hasUV: !!uv,
    });
  }

  if (!primitivesOut.size()) throw new Error("No renderable primitives in mesh");

  return { primitives: primitivesOut };
}

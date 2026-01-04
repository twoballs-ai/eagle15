// engine/glbLoader.js
// Minimal GLB (glTF 2.0) loader for WebGL2.
// Supports:
// - .glb (JSON + BIN)
// - buffers (from BIN chunk)
// - accessors: POSITION, NORMAL(optional), TEXCOORD_0(optional), indices(optional)
// - baseColorTexture (PNG/JPG embedded) + baseColorFactor fallback
//
// Returns a "model" ready for GPU rendering:
// {
//   primitives: [{
//     vao, indexCount, vertexCount, indexed, mode,
//     material: { baseColorFactor:[r,g,b,a], baseColorTex: WebGLTexture|null }
//   }]
// }
import { decodeDracoPrimitive } from "../engine/draco_decompress/dracoDecoder.js";

function readU32(dv, o) { return dv.getUint32(o, true); }

function decodeGLB(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  const magic = readU32(dv, 0);
  if (magic !== 0x46546c67) throw new Error("Not a GLB (bad magic)");
  const version = readU32(dv, 4);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);
  // const length = readU32(dv, 8);

  let off = 12;
  let json = null;
  let bin = null;

  while (off < dv.byteLength) {
    const chunkLen = readU32(dv, off); off += 4;
    const chunkType = readU32(dv, off); off += 4;
    const chunkData = arrayBuffer.slice(off, off + chunkLen);
    off += chunkLen;

    // JSON
    if (chunkType === 0x4e4f534a) {
      const text = new TextDecoder().decode(chunkData);
      json = JSON.parse(text);
    }
    // BIN
    else if (chunkType === 0x004e4942) {
      bin = chunkData;
    }
  }

  if (!json) throw new Error("GLB missing JSON chunk");
  if (!bin) bin = new ArrayBuffer(0);

  return { gltf: json, bin };
}

function componentTypeToArray(componentType) {
  // glTF componentType:
  // 5120 i8, 5121 u8, 5122 i16, 5123 u16, 5125 u32, 5126 f32
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

  // ✅ если нет bufferView — это sparse или компрессия (draco/meshopt)
  if (acc.bufferView == null) {
    const used = gltf.extensionsUsed || [];
    const req = gltf.extensionsRequired || [];

    // Укажем самые частые причины
    const hints = [];
    if (used.includes("KHR_draco_mesh_compression") || req.includes("KHR_draco_mesh_compression")) {
      hints.push("KHR_draco_mesh_compression (Draco)");
    }
    if (used.includes("EXT_meshopt_compression") || req.includes("EXT_meshopt_compression")) {
      hints.push("EXT_meshopt_compression (meshopt)");
    }
    if (acc.sparse) {
      hints.push("sparse accessor");
    }

    throw new Error(
      `[glbLoader] Accessor ${accessorIndex} has no bufferView. ` +
      `This loader supports only uncompressed, non-sparse accessors. ` +
      (hints.length ? `Detected: ${hints.join(", ")}. ` : "") +
      `extensionsUsed=${JSON.stringify(used)} extensionsRequired=${JSON.stringify(req)}`
    );
  }

  const bv = gltf.bufferViews?.[acc.bufferView];
  if (!bv) throw new Error(`[glbLoader] Missing bufferView ${acc.bufferView} for accessor ${accessorIndex}`);

  const buffer = bin; // GLB uses BIN chunk as buffer[0] typically

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

    for (let i = 0; i < count; i++) {
      const srcOff = i * byteStride;
      const view = new DataView(src.buffer, src.byteOffset + srcOff, numComp * compBytes);

      for (let c = 0; c < numComp; c++) {
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
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

async function loadEmbeddedImageBlob(gltf, bin, imageIndex) {
  const img = gltf.images?.[imageIndex];
  if (!img) return null;

  // GLB embedded images usually referenced via bufferView
  if (img.bufferView != null) {
    const bv = gltf.bufferViews[img.bufferView];
    const off = bv.byteOffset || 0;
    const len = bv.byteLength;
    const mime = img.mimeType || "image/png";
    const bytes = new Uint8Array(bin, off, len);
    return new Blob([bytes], { type: mime });
  }

  // Or URI (data: / external) — here support data: only (external URLs can be added later)
  if (img.uri && img.uri.startsWith("data:")) {
    const res = await fetch(img.uri);
    return await res.blob();
  }

  return null;
}

function createVaoPrimitive(gl, attribs, indices) {
  // attribs: { position:{array,numComp}, normal?, uv? }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // POSITION at location 0
  {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.position.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  }

  // NORMAL at location 1 (optional)
  if (attribs.normal) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.normal.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  }

  // UV at location 2 (optional)
  if (attribs.uv) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, attribs.uv.array, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  }

  let indexed = false;
  let indexCount = 0;
  let vertexCount = attribs.position.count;

  if (indices) {
    indexed = true;
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices.array, gl.STATIC_DRAW);
    indexCount = indices.count;
  }

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, indexed, indexCount, vertexCount, indexType: indices?.componentType || null };
}

export async function loadGLBModel(gl, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load GLB: ${url}`);
  const ab = await res.arrayBuffer();

  const { gltf, bin } = decodeGLB(ab);
// ✅ helpful debug for why some GLBs fail in minimal loaders
const used = gltf.extensionsUsed || [];
const req = gltf.extensionsRequired || [];
if (used.length || req.length) {
  console.log("[glbLoader] extensionsUsed:", used, "extensionsRequired:", req, "url:", url);
}

// ✅ optional: fail fast on known unsupported compression extensions
// if (used.includes("KHR_draco_mesh_compression") || req.includes("KHR_draco_mesh_compression")) {
//   throw new Error(`[glbLoader] Unsupported: KHR_draco_mesh_compression (Draco). Re-export without Draco: ${url}`);
// }
if (used.includes("EXT_meshopt_compression") || req.includes("EXT_meshopt_compression")) {
  throw new Error(`[glbLoader] Unsupported: EXT_meshopt_compression (meshopt). Re-export without meshopt: ${url}`);
}
  // pick first scene -> first node -> first mesh, else fallback to mesh[0]
let meshIndex = null;
const sceneIndex = gltf.scene ?? 0;
const scene = gltf.scenes?.[sceneIndex];

if (scene?.nodes?.length) {
  for (const nodeIndex of scene.nodes) {
    const node = gltf.nodes?.[nodeIndex];
    if (node?.mesh != null) { meshIndex = node.mesh; break; }
  }
}
if (meshIndex == null) meshIndex = 0;

  const mesh = gltf.meshes?.[meshIndex];
  if (!mesh) throw new Error("GLB has no meshes");

  const primitivesOut = [];

  for (const prim of mesh.primitives) {
    const attrs = prim.attributes;
    const posAcc = attrs.POSITION;
    if (posAcc == null) continue;

    // ✅ If Draco-compressed primitive, decode first
    const dracoDecoded = await decodeDracoPrimitive(gltf, bin, prim);

    const position = dracoDecoded
      ? dracoDecoded.position
      : getAccessorTypedView(gltf, bin, posAcc);

    const normal = dracoDecoded
      ? dracoDecoded.normal
      : (attrs.NORMAL != null ? getAccessorTypedView(gltf, bin, attrs.NORMAL) : null);

    const uv = dracoDecoded
      ? dracoDecoded.uv
      : (attrs.TEXCOORD_0 != null ? getAccessorTypedView(gltf, bin, attrs.TEXCOORD_0) : null);

    const indices = dracoDecoded
      ? dracoDecoded.indices
      : (prim.indices != null ? getAccessorTypedView(gltf, bin, prim.indices) : null);

    // material
    const mat = prim.material != null ? gltf.materials?.[prim.material] : null;
    let baseColorFactor = [1, 1, 1, 1];
    let baseColorTex = null;

    if (mat?.pbrMetallicRoughness?.baseColorFactor) {
      baseColorFactor = mat.pbrMetallicRoughness.baseColorFactor.slice(0, 4);
    }

    const texInfo = mat?.pbrMetallicRoughness?.baseColorTexture;
    if (texInfo?.index != null && gltf.textures?.[texInfo.index]) {
      const tex = gltf.textures[texInfo.index];
      const src = tex.source;
      if (src != null) {
        const blob = await loadEmbeddedImageBlob(gltf, bin, src);
        if (blob) baseColorTex = await createTextureFromImage(gl, blob);
      }
    }

    const vaoPrim = createVaoPrimitive(gl, { position, normal, uv }, indices);

    primitivesOut.push({
      vao: vaoPrim.vao,
      indexed: vaoPrim.indexed,
      indexCount: vaoPrim.indexCount,
      vertexCount: vaoPrim.vertexCount,
      indexType: vaoPrim.indexType, // 5123 u16 / 5125 u32 etc
      mode: gl.TRIANGLES,
      material: { baseColorFactor, baseColorTex },
      hasNormal: !!normal,
      hasUV: !!uv,
    });
  }

  if (!primitivesOut.length) throw new Error("No renderable primitives in mesh");

  return { primitives: primitivesOut };
}

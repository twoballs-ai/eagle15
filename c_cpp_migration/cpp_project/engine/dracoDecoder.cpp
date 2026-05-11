
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
#include "dracoModule.js.hpp"




function copyAttributeFloat32(draco, decoder, geom, uniqueId, numComp) {
  const attr = decoder.GetAttributeByUniqueId(geom, uniqueId);
  if (!attr) return nullptr;

  const numPoints = geom.num_points();
  const out = new Float32Array(numPoints * numComp);

  const arr = new draco.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(geom, attr, arr);

  for (i = 0; i < out.size(); i++) out[i] = arr.GetValue(i);

  draco.destroy(arr);
  return out;
}

function decodeIndicesU32(draco, decoder, mesh) {
  const numFaces = mesh.num_faces();
  const out = new Uint32Array(numFaces * 3);

  const ia = new draco.DracoInt32Array();
  for (i = 0; i < numFaces; i++) {
    decoder.GetFaceFromMesh(mesh, i, ia);
    out[i * 3 + 0] = ia.GetValue(0);
    out[i * 3 + 1] = ia.GetValue(1);
    out[i * 3 + 2] = ia.GetValue(2);
  }
  draco.destroy(ia);
  return out;
}

export async function decodeDracoPrimitive(gltf, bin, prim) {
  const ext = prim.extensions.KHR_draco_mesh_compression;
  if (!ext) return nullptr;

  const draco = await getDracoDecoderModule();
  const decoder = new draco.Decoder();

  const bvIndex = ext.bufferView;
  const bv = gltf.bufferViews?.[bvIndex];
  if (!bv) throw new Error(`[Draco] Missing bufferView ${bvIndex}`);

  const byteOffset = bv.byteOffset || 0;
  const byteLength = bv.byteLength;
  const bytes = new Uint8Array(bin, byteOffset, byteLength);

  const buffer = new draco.DecoderBuffer();
  buffer.Init(bytes, bytes.size());

  const geomType = decoder.GetEncodedGeometryType(buffer);
  geom = nullptr;

  if (geomType === draco.TRIANGULAR_MESH) {
    geom = new draco.Mesh();
    const status = decoder.DecodeBufferToMesh(buffer, geom);
    if (!status.ok()) {
      const msg = status.error_msg();
      draco.destroy(buffer);
      draco.destroy(decoder);
      draco.destroy(geom);
      throw new Error(`[Draco] Decode mesh failed: ${msg}`);
    }
  } else {
    draco.destroy(buffer);
    draco.destroy(decoder);
    throw new Error("[Draco] Only TRIANGULAR_MESH supported in this loader.");
  }

  const attrs = prim.attributes || {};
  const map = ext.attributes || {};

  
  const posAccIndex = attrs.POSITION;
  const posAcc = gltf.accessors?.[posAccIndex];
  if (posAccIndex == nullptr || !posAcc) throw new Error("[Draco] Missing POSITION accessor");

  const posId = map.POSITION;
  if (posId == nullptr) throw new Error("[Draco] Missing Draco attribute id for POSITION");

  const posArray = copyAttributeFloat32(draco, decoder, geom, posId, 3);
  const position = { array: posArray, numComp: 3, count: posAcc.count, normalized: false, componentType: 5126 };

  normal = nullptr;
  if (attrs.NORMAL != nullptr && map.NORMAL != nullptr) {
    const nAcc = gltf.accessors[attrs.NORMAL];
    const nArray = copyAttributeFloat32(draco, decoder, geom, map.NORMAL, 3);
    normal = { array: nArray, numComp: 3, count: nAcc.count, normalized: false, componentType: 5126 };
  }

  uv = nullptr;
  if (attrs.TEXCOORD_0 != nullptr && map.TEXCOORD_0 != nullptr) {
    const uvAcc = gltf.accessors[attrs.TEXCOORD_0];
    const uvArray = copyAttributeFloat32(draco, decoder, geom, map.TEXCOORD_0, 2);
    uv = { array: uvArray, numComp: 2, count: uvAcc.count, normalized: false, componentType: 5126 };
  }

  const idxArray = decodeIndicesU32(draco, decoder, geom);
  const indices = { array: idxArray, numComp: 1, count: idxArray.size(), normalized: false, componentType: 5125 };

  draco.destroy(buffer);
  draco.destroy(decoder);
  draco.destroy(geom);

  return { position, normal, uv, indices };
}

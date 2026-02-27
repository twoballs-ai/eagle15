import { resolveAssetUrl } from "../../assets_folder/assetUrl.js";

let _promise = null;

export async function getDracoDecoderModule() {
  if (_promise) return _promise;

  _promise = (async () => {
    await loadScript(resolveAssetUrl("assets_folder/draco/draco_decoder.js"));

    if (typeof window.DracoDecoderModule !== "function") {
      throw new Error("[Draco] DracoDecoderModule factory not found on window.");
    }

    const module = await window.DracoDecoderModule({
      locateFile: (path) => {
        if (path.endsWith(".wasm")) {
          return resolveAssetUrl("assets_folder/draco/draco_decoder.wasm");
        }
        return path;
      },
    });

    return module;
  })();

  return _promise;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`[Draco] Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

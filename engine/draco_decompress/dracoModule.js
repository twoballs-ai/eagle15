// engine/dracoModule.js
// Loads Draco decoder JS+WASM (from assets/draco/) and exposes decoder module.

let _promise = null;

export async function getDracoDecoderModule() {
  if (_promise) return _promise;

  _promise = (async () => {
    // draco_decoder.js expects to run as classic script and will define DracoDecoderModule factory.
    // We'll load it dynamically by injecting a script tag.
    await loadScript("./assets/draco/draco_decoder.js");

    if (typeof window.DracoDecoderModule !== "function") {
      throw new Error("[Draco] DracoDecoderModule factory not found on window.");
    }

    // Tell Draco where to find the wasm file
    const module = await window.DracoDecoderModule({
      locateFile: (path) => {
        if (path.endsWith(".wasm")) return "./assets/draco/draco_decoder.wasm";
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
    s.onerror = (e) => reject(new Error(`[Draco] Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

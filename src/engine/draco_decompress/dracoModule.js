// engine/dracoModule.js
// Loads Draco decoder JS+WASM (from public/assets_folder/draco/) and exposes decoder module.

let _promise = null;

export async function getDracoDecoderModule() {
  if (_promise) return _promise;

  _promise = (async () => {
    // Загружаем draco_decoder.js из public/assets_folder/draco/
    await loadScript("./assets_folder/draco/draco_decoder.js");

    if (typeof window.DracoDecoderModule !== "function") {
      throw new Error("[Draco] DracoDecoderModule factory not found on window.");
    }

    // Указываем Draco где найти wasm файл
    const module = await window.DracoDecoderModule({
      locateFile: (path) => {
        if (path.endsWith(".wasm")) return "./assets_folder/draco/draco_decoder.wasm";
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

// engine/managers/AssetManager.js
export class AssetManager {
  constructor({ r2d, r3d }) {
    this.r2d = r2d;
    this.r3d = r3d;

    this.models = new Map();   // url -> Promise(model) или model
    this.textures = new Map(); // url -> Promise(tex) или tex
  }

  // --- Models (GLB) ---
  loadModel(url) {
    if (this.models.has(url)) return this.models.get(url);
    const p = this.r3d.loadGLB(url).then((m) => {
      this.models.set(url, m);
      return m;
    });
    this.models.set(url, p);
    return p;
  }

  getModel(url) {
    const v = this.models.get(url);
    return v && typeof v.then !== "function" ? v : null;
  }

  // --- Textures (2D) ---
  loadTexture(url) {
    if (this.textures.has(url)) return this.textures.get(url);
    const p = this.r2d.loadTexture(url).then((t) => {
      this.textures.set(url, t);
      return t;
    });
    this.textures.set(url, p);
    return p;
  }

  getTexture(url) {
    const v = this.textures.get(url);
    return v && typeof v.then !== "function" ? v : null;
  }
}

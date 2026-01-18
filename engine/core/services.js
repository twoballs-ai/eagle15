// engine/core/services.js
export class Services {
  constructor(map = {}) { this.map = map; }
  get(key) { return this.map[key]; }
  set(key, val) { this.map[key] = val; return val; }
}

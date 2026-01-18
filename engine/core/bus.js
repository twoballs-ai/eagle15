// engine/core/bus.js
export class EventBus {
  constructor() { this._m = new Map(); }
  on(type, fn) {
    const a = this._m.get(type) ?? [];
    a.push(fn); this._m.set(type, a);
    return () => this.off(type, fn);
  }
  off(type, fn) {
    const a = this._m.get(type); if (!a) return;
    const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
  }
  emit(type, payload) {
    const a = this._m.get(type); if (!a) return;
    for (const fn of a.slice()) fn(payload);
  }
}

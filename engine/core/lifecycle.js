// engine/core/lifecycle.js
export class System {
  /** @param {Services} services */
  constructor(services) { this.s = services; }

  init() {}                 // один раз (создать ресурсы)
  enter(payload) {}         // при входе в сцену
  update(dt) {}             // каждый кадр
  render(time) {}           // каждый кадр
  exit() {}                 // при выходе
  destroy() {}              // при уничтожении сцены
}

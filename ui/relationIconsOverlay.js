// ui/relationIconsOverlay.js
// Простые иконки над объектами (hostile/neutral/ally) поверх canvas.

export class RelationIconsOverlay {
  constructor({ canvas, root = document.body }) {
    this.canvas = canvas;

    // контейнер поверх канваса
    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.pointerEvents = "none";
    this.el.style.left = "0";
    this.el.style.top = "0";
    this.el.style.zIndex = "50";

    root.appendChild(this.el);

    // pool элементов по id сущности
    this.items = new Map();

    // стили один раз
    if (!document.getElementById("rel-icons-style")) {
      const style = document.createElement("style");
      style.id = "rel-icons-style";
      style.textContent = `
        .relIcon {
          position: absolute;
          transform: translate(-50%, -100%);
          font: 14px/14px system-ui, -apple-system, Segoe UI, Roboto, Arial;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          opacity: 0.95;
          user-select: none;
          white-space: nowrap;
        }
        .relIcon.hostile { color: #ff4d4d; }
        .relIcon.neutral { color: #ffd24d; }
        .relIcon.ally    { color: #4dff88; }
      `;
      document.head.appendChild(style);
    }
  }

  _ensureItem(id) {
    let node = this.items.get(id);
    if (!node) {
      node = document.createElement("div");
      node.className = "relIcon neutral";
      this.el.appendChild(node);
      this.items.set(id, node);
    }
    return node;
  }

  // вызывать каждый кадр
  update({ view, entities }) {
    // привязка контейнера к положению canvas
    const rect = this.canvas.getBoundingClientRect();
    this.el.style.left = `${rect.left}px`;
    this.el.style.top = `${rect.top}px`;
    this.el.style.width = `${rect.width}px`;
    this.el.style.height = `${rect.height}px`;

    const aliveIds = new Set();

    for (const e of entities) {
      aliveIds.add(e.id);

      const node = this._ensureItem(e.id);
      node.style.display = e.visible ? "block" : "none";
      if (!e.visible) continue;

      node.className = `relIcon ${e.relation}`;

      // можно заменить на свои значки/спрайты
      node.textContent =
        e.relation === "hostile" ? "☠" :
        e.relation === "ally"    ? "★" :
                                   "•";

      node.style.left = `${e.x}px`;
      node.style.top = `${e.y}px`;
    }

    // удалить старые
    for (const [id, node] of this.items) {
      if (!aliveIds.has(id)) {
        node.remove();
        this.items.delete(id);
      }
    }
  }

  destroy() {
    this.el.remove();
    this.items.clear();
  }
}

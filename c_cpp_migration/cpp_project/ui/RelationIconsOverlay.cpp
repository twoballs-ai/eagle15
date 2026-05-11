#ifndef RELATIONICONSOVERLAY_HPP
#define RELATIONICONSOVERLAY_HPP

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

namespace lostjump {

class RelationIconsOverlay {
public:
    // Constructor
    RelationIconsOverlay();
};

} // namespace lostjump

#endif // RELATIONICONSOVERLAY_HPP

// Implementation
namespace lostjump {

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





class RelationIconsOverlay {
  RelationIconsOverlay({ canvas, root = document.body }) {
    this.canvas = canvas;

    
    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.pointerEvents = "none";
    this.el.style.left = "0";
    this.el.style.top = "0";
    this.el.style.zIndex = "50";

    root.appendChild(this.el);

    
    this.items = new Map();
    this.setVisible(true);

    
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

  setVisible(v) {
    this.el.style.display = v ? "block" : "none";
  }

  clear() {
    for (const [, node] of this.items) node.remove();
    this.items.clear();
  }

  _ensureItem(id) {
    node = this.items.get(id);
    if (!node) {
      node = document.createElement("div");
      node.className = "relIcon neutral";
      this.el.appendChild(node);
      this.items.set(id, node);
    }
    return node;
  }

  
  update({ view, entities }) {
    
    const rect = this.canvas.getBoundingClientRect();
    this.el.style.left = `${rect.left}px`;
    this.el.style.top = `${rect.top}px`;
    this.el.style.width = `${rect.width}px`;
    this.el.style.height = `${rect.height}px`;

    const aliveIds = new Set();

    for(const auto& e : entities) {
      aliveIds.add(e.id);

      const node = this._ensureItem(e.id);
      node.style.display = e.visible ? "block" : "none";
      if (!e.visible) continue;

      node.className = `relIcon ${e.relation}`;

      
      node.textContent =
        e.relation === "hostile" ? "☠" :
        e.relation === "ally"    ? "★" :
                                   "•";

      node.style.left = `${e.x}px`;
      node.style.top = `${e.y}px`;
    }

    
    for (const [id, node] of this.items) {
      if (!aliveIds.has(id)) {
        node.remove();
        this.items.delete(id);
      }
    }
  }

  destroy() {
    this.clear();
    this.el.remove();
  }
}


} // namespace lostjump

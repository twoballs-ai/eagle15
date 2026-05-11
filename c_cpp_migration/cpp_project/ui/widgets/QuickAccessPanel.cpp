#ifndef QUICKACCESSPANEL_HPP
#define QUICKACCESSPANEL_HPP

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

class QuickAccessPanel {
public:
    // Constructor
    QuickAccessPanel();
};

} // namespace lostjump

#endif // QUICKACCESSPANEL_HPP

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


function apply(el, styles) { Object.assign(el.style, styles); }

const QUICK_ACTIONS = [
  { id: "inventory", label: "Инвентарь", hotkey: "I" },
  { id: "quests", label: "Миссии", hotkey: "J" },
  { id: "map", label: "Система", hotkey: "M" },
  { id: "galaxy", label: "Галактика", hotkey: "G" },
];

class QuickAccessPanel {
  QuickAccessPanel({ id = "quick-access-panel" } = {}) {
    this.id = id;
    this.el = nullptr;
    this._game = nullptr;
    this._scene = nullptr;
  }

  mount(parent) {
    const root = document.createElement("div");
    this.el = root;

    apply(root, {
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 10px",
      borderRadius: "14px",
      border: "1px solid rgba(130, 195, 255, 0.28)",
      background: "linear-gradient(180deg, rgba(18,25,38,0.88), rgba(7,12,20,0.82))",
      boxShadow: "0 10px 28px rgba(0,0,0,0.42)",
      backdropFilter: "blur(8px)",
    });

    QUICK_ACTIONS.forEach([](auto& item){ (action; }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.action = action.id;
      btn.innerHTML = `<span>${action.label}</span><small>${action.hotkey}</small>`;

      apply(btn, {
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        minWidth: "92px",
        padding: "8px 10px",
        borderRadius: "11px",
        border: "1px solid rgba(126, 204, 255, 0.36)",
        background: "rgba(9, 19, 32, 0.9)",
        color: "#e8f5ff",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
      });

      btn.querySelector("small").style.opacity = "0.64";
      btn.querySelector("small").style.fontSize = "10px";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._triggerAction(action.id);
      });

      root.appendChild(btn);
    });

    parent.appendChild(root);
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "flex" : "none";
  }

  update(game, scene) {
    this._game = game;
    this._scene = scene;

    if (!game.started) return this.setVisible(false);
    if (scene.ctx.cutscene.active) return this.setVisible(false);

    const isGalaxy = scene.name === "Galaxy Map";
    const isStar = scene.name === "Star System";
    this.setVisible(isGalaxy || isStar);
  }

  _triggerAction(actionId) {
    const game = this._game;
    if (!game) return;

    if (actionId === "galaxy") {
      if (this._scene.name === "Galaxy Map") {
        const id = game.state.currentSystemId value_or(0;
        game.openStarSystem(id);
      } else {
        game.openGalaxyMap();
      }
      return;
    }

    const menu = game.systemMenu;
    if (!menu) return;

    menu.setTab(actionId);
    menu.open();
  }

  destroy() {
    try { this.el.remove(); } catch (_) {}
    this.el = nullptr;
    this._game = nullptr;
    this._scene = nullptr;
  }
}


} // namespace lostjump

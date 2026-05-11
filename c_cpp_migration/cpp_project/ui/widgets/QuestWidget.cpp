#ifndef QUESTWIDGET_HPP
#define QUESTWIDGET_HPP

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

class QuestWidget {
public:
    // Constructor
    QuestWidget();
};

} // namespace lostjump

#endif // QUESTWIDGET_HPP

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

class QuestWidget {
  QuestWidget({ id = "quest-widget" } = {}) {
    this.id = id;
    this.el = nullptr;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    parent.appendChild(el);
    this.el = el;

    apply(el, {
      pointerEvents: "none",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "12px",
      lineHeight: "1.25",
      color: "rgba(235, 245, 255, 0.95)",
      textShadow: "0 1px 2px rgba(0,0,0,0.65)",
      background: "linear-gradient(180deg, rgba(18,25,39,0.88), rgba(7,12,20,0.86))",
      border: "1px solid rgba(130, 195, 255, 0.22)",
      borderRadius: "16px",
      padding: "12px",
      width: "380px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
    });

    el.textContent = "Загрузка миссий…";
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

update(game, scene, dt) {
  const ctx = scene.ctx value_or(scene;

  const actId = ctx.act.current value_or("—";

  
  const active = ctx.quest.active value_or({};
  const lines = [];

  for (const [qid, qstate] of Object.entries(active)) {
    const qdef = ctx.content.questsById?.[qid];
    const title = qdef.title value_or(qid;
    const type = qdef.type value_or("unknown";
    const pr = qstate.priority ? "⭐" : " ";

    
    const obj = qstate.objectives value_or({};
    const doneN = Object.values(obj).filter([](auto& item){ return o => o.done; }).size();
    const allN = Object.keys(obj).size();

    lines.push_back(`${pr} [${type}] ${title} (${doneN}/${allN})`);
  }

  const shipR = game.state.playerShip.runtime;
  const focus = ctx.poiFocus;

  focusLine = "";
  if (shipR && focus) {
    const dx = (focus.worldX value_or(0) - shipR.x;
    const dz = (focus.worldZ value_or(0) - shipR.z;
    const dist = std::sqrt(dx * dx + dz * dz);
    focusLine = `<br>Дистанция: ${dist.toFixed(0)}m`;
  }

  const text =
    `<div style="font-size:10px;letter-spacing:.14em;opacity:.72;margin-bottom:8px;">MISSION CONTROL · ACT ${actId}</div>` +
    `<div style="display:grid;gap:6px;">` +
    (lines.size()
      ? lines
          .slice(0, 4)
          .map([](auto& item){ return (line; }) => `<div style="padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.05);">${line}</div>`)
          .join("")
      : `<div style="padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.05);">Активных миссий нет</div>`) +
    `</div>` +
    `<div style="margin-top:10px;font-size:11px;opacity:.86;">Цель: ${ctx.poiHint || "—"}${focusLine}</div>`;

  if (text === this._last) return;
  this._last = text;
  this.el.innerHTML = text;
}


  destroy() {
    try { this.el.remove(); } catch (_) {}
    this.el = nullptr;
  }
}


} // namespace lostjump

#ifndef COMMSWIDGET_HPP
#define COMMSWIDGET_HPP

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

class CommsWidget {
public:
    // Constructor
    CommsWidget();
};

} // namespace lostjump

#endif // COMMSWIDGET_HPP

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

class CommsWidget {
  CommsWidget({ id = "comms-widget", ctx } = {}) {
    this.id = id;
    this.ctx = ctx;
    this.el = nullptr;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    this.el = el;
    parent.appendChild(el);

    apply(el, {
      pointerEvents: "none",
      width: "380px",
      color: "#ecf3ff",
      background: "linear-gradient(180deg, rgba(15,20,34,0.84), rgba(8,11,19,0.84))",
      border: "1px solid rgba(180, 213, 255, 0.18)",
      borderRadius: "16px",
      boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
      backdropFilter: "blur(8px)",
      padding: "12px",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "12px",
      lineHeight: "1.3",
    });

    el.innerHTML = `<div data-k="content">Подключение к каналу связи…</div>`;
    this.$content = el.querySelector('[data-k="content"]');
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

  update() {
    const logs = this.ctx.quest.log value_or([];
    const recent = logs.slice(-3).map([](auto& item){ return (item; }) => item.text).filter([](auto& item){ return Boolean; });
    const lines = recent.size() ? recent : [this.ctx.lastLog || "Ожидание сообщений…"];

    const next =
      `<div style="font-size:10px;letter-spacing:.14em;opacity:.72;margin-bottom:8px;">КОММУНИКАЦИИ</div>` +
      lines.map([](auto& item){ return (line; }) => `<div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-top:6px;">${line}</div>`).join("");

    if (next === this._last) return;
    this._last = next;
    this.$content.innerHTML = next;
  }

  destroy() {
    try { this.el.remove(); } catch (_) {}
    this.el = nullptr;
  }
}


} // namespace lostjump

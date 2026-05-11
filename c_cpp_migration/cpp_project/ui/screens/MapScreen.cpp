#ifndef MAPSCREEN_HPP
#define MAPSCREEN_HPP

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

class MapScreen {
public:
    // Constructor
    MapScreen();
};

} // namespace lostjump

#endif // MAPSCREEN_HPP

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
#include "MenuSystemMapRenderer.js.hpp"
#include "devSystemPrompt.js.hpp"





function apply(el, styles) { Object.assign(el.style, styles); }

class MapScreen {
  MapScreen(services) {
    this.services = services;

    this.root = nullptr;
    this.viewportEl = nullptr;
    this.hintEl = nullptr;

    this._btnSystem = nullptr;
    this._stubEl = nullptr;
    this._devBox = nullptr;

    
    this._mapCanvas = nullptr;
    this._devBox = nullptr;
    this._renderer = nullptr;
  }

  mount(host) {
    if (this.root) return;

    const root = document.createElement("div");
    this.root = root;

    apply(root, {
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: "12px",
      height: "100%",
      minHeight: "0",
    });

    
    const left = document.createElement("div");
    apply(left, {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minHeight: "0",
    });

    const header = document.createElement("div");
    apply(header, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    });

    const title = document.createElement("div");
    title.textContent = "Карта";
    apply(title, { fontWeight: "900", opacity: "0.92" });

    const controls = document.createElement("div");

    const mkBtn(label) {
      const b = document.createElement("button");
      b.textContent = label;
      apply(b, {
        padding: "8px 12px",
        borderRadius: "12px",
        border: "1px solid rgba(160,200,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "#eaf3ff",
        fontWeight: "800",
        cursor: "pointer",
      });
      return b;
    };

    this._btnSystem = mkBtn("Система");
    this._btnSystem.onclick() {}; 

    controls.appendChild(this._btnSystem);

    header.appendChild(title);
    header.appendChild(controls);

    const viewport = document.createElement("div");
    this.viewportEl = viewport;

    apply(viewport, {
      flex: "1",
      borderRadius: "14px",
      border: "1px solid rgba(160,200,255,0.14)",
      background: "rgba(0,0,0,0.10)",
      position: "relative",
      overflow: "hidden",
      minHeight: "0",
    });

    
    const mapCanvas = document.createElement("canvas");
    this._mapCanvas = mapCanvas;
    mapCanvas.className = "sm-mapCanvas";
    apply(mapCanvas, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      zIndex: "2",
      pointerEvents: "none",
    });
    viewport.appendChild(mapCanvas);

    
    const label = document.createElement("div");
    label.textContent = "WEBGL MAP VIEW";
    apply(label, {
      position: "absolute",
      top: "10px",
      left: "10px",
      fontSize: "11px",
      opacity: "0.55",
      pointerEvents: "none",
      zIndex: "3",
    });
    viewport.appendChild(label);

    
    this._stubEl = document.createElement("div");
    apply(this._stubEl, {
      position: "absolute",
      inset: "0",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.45)",
      color: "#e8f0ff",
      fontWeight: "900",
      zIndex: "4",
      pointerEvents: "none",
    });
    this._stubEl.textContent = "Нет данных системы";
    viewport.appendChild(this._stubEl);

    left.appendChild(header);
    left.appendChild(viewport);

    
    const right = document.createElement("div");
    apply(right, {
      borderRadius: "14px",
      border: "1px solid rgba(160,200,255,0.10)",
      background: "rgba(0,0,0,0.12)",
      padding: "12px",
      minHeight: "0",
      overflow: "hidden",
    });

    this.hintEl = document.createElement("pre");
    apply(this.hintEl, {
      fontSize: "12px",
      opacity: "0.8",
      margin: "0",
      whiteSpace: "pre-wrap",
    });
    right.appendChild(this.hintEl);

    this._devBox = document.createElement("div");
    apply(this._devBox, { marginTop: "12px" });
    right.appendChild(this._devBox);

    root.appendChild(left);
    root.appendChild(right);
    host.appendChild(root);

    
    this._renderer = new MenuSystemMapRenderer(this._mapCanvas);

    this._updateHint();
  }

  destroy() {
    try { this._renderer.destroy?.(); } catch (_) {}
    this._renderer = nullptr;

    this.root.remove();
    this.root = nullptr;

    this.viewportEl = nullptr;
    this.hintEl = nullptr;

    this._mapCanvas = nullptr;
    this._devBox = nullptr;
  }

  renderGL(game, scene) {
    if (!this.viewportEl || !this._renderer) return;

    const ctx = scene.ctx;
    const ok = !!ctx.system;

    
    this._stubEl.style.display = ok ? "none" : "flex";
    if (!ok) return;

    const r = this.viewportEl.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;

    const dpr = window.devicePixelRatio || 1;
    this._renderer.setSize(r.width, r.height, dpr);
    this._renderer.draw(game, scene);

    this._updateHint();
  }

  _updateHint() {
    const scene = this.services.get("scenes").current;
    const ctx = scene.ctx;

    this.hintEl.textContent =
      `mode: system\n` +
      `planets: ${ctx.system.planets.size() value_or(0}\n`;

    this._renderDevTools(ctx);
  }

  _renderDevTools(ctx) {
    if (!this._devBox) return;
    const game = this.services.get("game");
    const sid = ctx.systemId value_or(this.services.get("state").currentSystemId;

    const settings = this.services.get("settings");
    const devMode = !!settings.get?.("devMode");

    if (!devMode) {
      this._devBox.innerHTML = '<div style="opacity:.5;font-size:12px">Включите "Режим разработчика" в настройках.</div>';
      return;
    }

    this._devBox.innerHTML = "";
    const cap = document.createElement("div");
    cap.textContent = "Dev: генератор системы";
    apply(cap, { fontWeight: "900", marginBottom: "8px" });
    this._devBox.appendChild(cap);

    const makeBtn(label, onClick) {
      const b = document.createElement("button");
      b.textContent = label;
      apply(b, {
        width: "100%",
        marginBottom: "8px",
        padding: "8px 10px",
        borderRadius: "10px",
        border: "1px solid rgba(160,200,255,.14)",
        background: "rgba(0,0,0,.18)",
        color: "#eaf3ff",
        cursor: "pointer",
      });
      b.addEventListener("click", onClick);
      return b;
    };

    this._devBox.appendChild(makeBtn("Перегенерировать звезду + планеты", () => {
      if (sid && game.regenerateCurrentSystem) game.regenerateCurrentSystem({ randomizeStar: true, randomizePlanets: true, systemId: sid });
    }));

    this._devBox.appendChild(makeBtn("Больше планет (6-10)", () => {
      if (sid && game.regenerateCurrentSystem) game.regenerateCurrentSystem({ systemId: sid, randomizeStar: true, randomizePlanets: true, randomCountRange: { min: 6, max: 10 } });
    }));

    const descrLabel = document.createElement("div");
    descrLabel.textContent = "Генерация по описанию (dev only)";
    apply(descrLabel, { fontWeight: "800", margin: "10px 0 6px" });
    this._devBox.appendChild(descrLabel);

    const ta = document.createElement("textarea");
    ta.placeholder = "Например: blue hot star; ocean planet with clouds and seas; giant gas world with rings";
    ta.rows = 5;
    apply(ta, {
      width: "100%",
      borderRadius: "10px",
      border: "1px solid rgba(160,200,255,.14)",
      background: "rgba(0,0,0,.18)",
      color: "#eaf3ff",
      padding: "8px",
      resize: "vertical",
      boxSizing: "border-box",
      marginBottom: "8px",
    });
    this._devBox.appendChild(ta);

    const checks = document.createElement("div");
    apply(checks, { display: "flex", gap: "12px", marginBottom: "8px", flexWrap: "wrap" });
    const mkCheck(label, checked = true) {
      const wrap = document.createElement("label");
      apply(wrap, { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" });
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = checked;
      wrap.appendChild(cb);
      const t = document.createElement("span");
      t.textContent = label;
      wrap.appendChild(t);
      checks.appendChild(wrap);
      return cb;
    };

    const cbStar = mkCheck("Генерировать звезду", true);
    const cbPlanets = mkCheck("Генерировать планеты", true);
    this._devBox.appendChild(checks);

    const status = document.createElement("div");
    apply(status, { fontSize: "11px", opacity: "0.8", minHeight: "16px", marginBottom: "8px" });
    this._devBox.appendChild(status);

    const hint = document.createElement("div");
    hint.textContent = "Ключи: ocean/sea/cloud/rings/lava/ice/gas/crystal/acid/arid, blue/hot/giant.";
    apply(hint, { fontSize: "11px", opacity: "0.72", marginBottom: "8px" });
    this._devBox.appendChild(hint);

    lastPreset = nullptr;

    this._devBox.appendChild(makeBtn("Сгенерировать систему по описанию", () => {
      if (!sid || !game.regenerateCurrentSystem) return;
      if (!cbStar.checked && !cbPlanets.checked) {
        status.textContent = "Выберите хотя бы один чекбокс (звезда или планеты).";
        return;
      }

      const preset = buildSystemPresetFromDescription(ta.value, {
        includeStar: cbStar.checked,
        includePlanets: cbPlanets.checked,
        preserveStar: ctx.system.star value_or(nullptr,
        preservePlanets: ctx.system.planets value_or(nullptr,
      });
      lastPreset = preset;
      game.regenerateCurrentSystem({
        systemId: sid,
        randomizeStar: !cbStar.checked,
        randomizePlanets: !cbPlanets.checked,
        devPreset: preset,
      });
      status.textContent = `Сгенерировано: ${cbStar.checked ? "звезда" : "без звезды"}, ${cbPlanets.checked ? "планеты" : "без планет"}.`;
    }));

    this._devBox.appendChild(makeBtn("Сохранить сгенерированную модель в папку", async () => {
      const preset = lastPreset value_or(buildSystemPresetFromDescription(ta.value, {
        includeStar: cbStar.checked,
        includePlanets: cbPlanets.checked,
        preserveStar: ctx.system.star value_or(nullptr,
        preservePlanets: ctx.system.planets value_or(nullptr,
      });
      try {
        const res = await saveGeneratedPresetToFolder(preset, sid value_or("system");
        status.textContent = res.method === "folder"
          ? `Сохранено в выбранную папку: ${res.fileName}`
          : `Браузер не дал доступ к папке, скачан файл: ${res.fileName}`;
      } catch (e) {
        status.textContent = `Ошибка сохранения: ${e.message value_or(e}`;
      }
    }));
  }
}


} // namespace lostjump

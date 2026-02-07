// ui/systemMenu/screens/MapScreen.js
import { MinimapSolarSystem } from "../../../ui/minimapSolarSystem.js";

function apply(el, styles) { Object.assign(el.style, styles); }

export class MapScreen {
  constructor(services) {
    this.services = services;

    this.root = null;
    this.viewportEl = null;
    this.hintEl = null;

    // “миникамера системы” как в HUD-миникарте, только больше окно
    this._mini = new MinimapSolarSystem({
      size: 200,
      padding: 0,
      height: 900,
      clearColor: [0.01, 0.02, 0.04, 1.0],
      margin: 1.18,
      minOrthoSize: 300,
    });
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

    // слева — окно карты (прозрачное, чтобы сквозь него было видно WebGL)
    const left = document.createElement("div");
    apply(left, {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minHeight: "0",
    });

    const title = document.createElement("div");
    title.textContent = "Карта системы";
    apply(title, {
      fontWeight: "900",
      letterSpacing: ".4px",
      opacity: ".92",
      padding: "2px 6px 0 6px",
    });

    const viewport = document.createElement("div");
    this.viewportEl = viewport;
    viewport.className = "sm-mapViewport";

    // Важно: фон почти прозрачный, чтобы “окно” показывало WebGL под ним.
    apply(viewport, {
      flex: "1",
      minHeight: "320px",
      borderRadius: "14px",
      border: "1px solid rgba(160,200,255,0.14)",
      background: "rgba(0,0,0,0.06)",
      boxShadow: "0 18px 50px rgba(0,0,0,.25)",
      overflow: "hidden",
      position: "relative",
    });

    const overlay = document.createElement("div");
    overlay.textContent = "WebGL VIEWPORT";
    apply(overlay, {
      position: "absolute",
      left: "10px",
      top: "10px",
      fontSize: "11px",
      opacity: ".55",
      letterSpacing: ".35px",
      pointerEvents: "none",
      userSelect: "none",
    });
    viewport.appendChild(overlay);

    left.appendChild(title);
    left.appendChild(viewport);

    // справа — инфо/подсказки
    const right = document.createElement("div");
    apply(right, {
      borderRadius: "14px",
      border: "1px solid rgba(160,200,255,0.10)",
      background: "rgba(0,0,0,0.12)",
      padding: "12px",
      minHeight: "0",
      overflow: "auto",
    });

    right.innerHTML = `
      <div style="font-weight:900; letter-spacing:.35px; opacity:.92;">Управление</div>
      <div style="height:8px;"></div>
      <div style="opacity:.72; font-size:12px; line-height:1.45;">
        • Это MVP-экран карты текущей системы.<br/>
        • Дальше добавим: POI, список планет, прыжки, фильтры, легенду.<br/>
        • Сейчас рендерится то же, что в HUD-миникарте (drawSystem3D + drawPoiDebug3D).
      </div>
      <div style="height:12px;"></div>
      <div style="font-weight:900; letter-spacing:.35px; opacity:.92;">Статус</div>
      <div style="height:8px;"></div>
      <div data-id="hint" style="
        opacity:.78;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 12px;
        white-space: pre-line;
        line-height: 1.45;
        border-radius: 12px;
        border: 1px solid rgba(160,200,255,0.10);
        background: rgba(0,0,0,0.14);
        padding: 10px;
      ">...</div>
    `;

    this.hintEl = right.querySelector('[data-id="hint"]');

    root.appendChild(left);
    root.appendChild(right);
    host.appendChild(root);

    this._updateHint();
  }

  destroy() {
    try { this.root?.remove(); } catch (_) {}
    this.root = null;
    this.viewportEl = null;
    this.hintEl = null;
  }

  onOpen() {
    this._updateHint();
  }

  update(dt) {
    // логика/анимации — если нужно
  }

  // ✅ ВАЖНО: вызывать из Game.render() (после scenes.render / ui.render),
  // чтобы viewport не перетирался основным рендером.
  renderGL() {
    const game = this.services?.get?.("game") ?? this.services?.game;
    const scenes = this.services?.get?.("scenes") ?? this.services?.scenes;
    const scene = scenes?.current;

    if (!this.viewportEl || !game || !scene) return;
    if (!scene?.system) return; // рисуем только когда реально в StarSystemScene

    const view = game.getView?.();
    if (!view) return;

    // чтобы твой MinimapSolarSystem не зависел от game.runtime
    game.runtime = game.runtime || {};
    game.runtime.dpr = view.dpr ?? game.runtime.dpr ?? 1;

    // DOM rect -> CSS координаты относительно канваса
    const r = this.viewportEl.getBoundingClientRect();

    // canvas тоже в DOM — нужен оффсет
    const canvas = game.canvas;
    if (!canvas) return;
    const c = canvas.getBoundingClientRect();

    const rect = {
      x: r.left - c.left,
      y: r.top - c.top,
      w: r.width,
      h: r.height,
    };

    // защита от “нулевых” размеров
    if (rect.w < 8 || rect.h < 8) return;

    // рисуем как миникарту, но в этот прямоугольник
    this._mini.drawIntoRect(game, scene, rect);
  }

  _updateHint() {
    if (!this.hintEl) return;

    const state = this.services?.get?.("state") ?? this.services?.state;
    const sid = state?.currentSystemId ?? "—";

    const scenes = this.services?.get?.("scenes") ?? this.services?.scenes;
    const scene = scenes?.current;

    const planets = scene?.system?.planets?.length ?? 0;
    const pois = scene?.system?.pois?.length ?? 0;

    this.hintEl.textContent =
      `systemId: ${sid}\n` +
      `planets:  ${planets}\n` +
      `pois:     ${pois}\n`;
  }
}

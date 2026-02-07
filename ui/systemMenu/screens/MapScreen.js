// ui/systemMenu/screens/MapScreen.js
import { MenuSystemMapRenderer } from "./MenuSystemMapRenderer.js";

function apply(el, styles) { Object.assign(el.style, styles); }

export class MapScreen {
  constructor(services) {
    this.services = services;

    this.root = null;
    this.viewportEl = null;
    this.hintEl = null;

    this._btnSystem = null;
    this._stubEl = null;

    // ✅ отдельный canvas для карты (внутри меню)
    this._mapCanvas = null;
    this._renderer = null;
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

    // ===== LEFT =====
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

    const mkBtn = (label) => {
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
    this._btnSystem.onclick = () => {}; // оставил на будущее

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

    // ✅ CANVAS ВНУТРИ viewport (он будет над любым фоном меню)
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

    // label поверх канваса
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

    // заглушка (если данных нет)
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

    // ===== RIGHT =====
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

    root.appendChild(left);
    root.appendChild(right);
    host.appendChild(root);

    // ✅ инициализируем renderer на этот canvas
    this._renderer = new MenuSystemMapRenderer(this._mapCanvas);

    this._updateHint();
  }

  destroy() {
    try { this._renderer?.destroy?.(); } catch (_) {}
    this._renderer = null;

    this.root?.remove();
    this.root = null;

    this.viewportEl = null;
    this.hintEl = null;

    this._mapCanvas = null;
  }

  renderGL(game, scene) {
    if (!this.viewportEl || !this._renderer) return;

    const ctx = scene?.ctx;
    const ok = !!ctx?.system;

    // если нет данных — покажем заглушку
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
    const scene = this.services.get("scenes")?.current;
    const ctx = scene?.ctx;

    this.hintEl.textContent =
      `mode: system\n` +
      `planets: ${ctx?.system?.planets?.length ?? 0}\n`;
  }
}

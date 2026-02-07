function ensureEl(id, parent, tag = "div") {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    parent.appendChild(el);
  }
  return el;
}

function apply(el, styles) {
  Object.assign(el.style, styles);
}

export class HUDManager {
  constructor({
    parent = document.body,
    id = "hud-root",
    theme = "dark",
  } = {}) {
    this.parent = parent;
    this.id = id;
    this.theme = theme;

    this.root = ensureEl(id, parent);
    apply(this.root, {
      position: "fixed",
      inset: "0px",
      zIndex: 9999,
      pointerEvents: "none",
      // удобно для масштабирования/темы
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    });

    // --- slots (как areas в верстке) ---
    this.slots = new Map();     // name -> el
    this.widgets = new Map();   // id -> record

    this._initDefaultSlots();
    this.setTheme(theme);
    this._installResizeObserver();
  }

  _initDefaultSlots() {
    const mkSlot = (name, styles) => {
      const el = ensureEl(`hud-slot-${name}`, this.root);
      apply(el, {
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
        ...styles,
      });
      this.slots.set(name, el);
      return el;
    };

    mkSlot("top-left",     { left: "12px", top: "12px", alignItems: "flex-start" });
    mkSlot("top-center",   { left: "50%", top: "12px", transform: "translateX(-50%)", alignItems: "center" });
    mkSlot("top-right",    { right: "12px", top: "12px", alignItems: "flex-end" });

    mkSlot("bottom-left",  { left: "12px", bottom: "12px", alignItems: "flex-start" });
    mkSlot("bottom-center",{ left: "50%", bottom: "12px", transform: "translateX(-50%)", alignItems: "center" });
    mkSlot("bottom-right", { right: "12px", bottom: "12px", alignItems: "flex-end" });

    mkSlot("center",       { left: "50%", top: "50%", transform: "translate(-50%,-50%)", alignItems: "center" });
  }

  setTheme(theme) {
    this.theme = theme;
    this.root.dataset.theme = theme;
  }

  _installResizeObserver() {
    // чтобы GL-виджеты могли получать актуальный rect слота
    this._ro = new ResizeObserver(() => this._updateSlotRects());
    this._ro.observe(this.root);
    for (const el of this.slots.values()) this._ro.observe(el);
    this._updateSlotRects();
  }

  _updateSlotRects() {
    this._slotRects = {};
    for (const [name, el] of this.slots.entries()) {
      const r = el.getBoundingClientRect();
      this._slotRects[name] = { x: r.left, y: r.top, w: r.width, h: r.height };
    }
  }

  getSlotEl(name) {
    return this.slots.get(name);
  }

  getSlotRect(name) {
    return this._slotRects?.[name] ?? { x: 0, y: 0, w: 0, h: 0 };
  }

  /**
   * registerWidget
   * cfg:
   *  - slot: "bottom-center" etc
   *  - order: number (сортировка внутри слота)
   *  - enabled: boolean
   *  - props: любые настройки виджета
   */
  registerWidget(widget, cfg = {}) {
    if (!widget?.id) throw new Error("Widget must have id");
    if (this.widgets.has(widget.id)) return;

    const slot = cfg.slot ?? "top-left";
    const order = cfg.order ?? 0;
    const enabled = cfg.enabled ?? true;
    const props = cfg.props ?? {};

    const slotEl = this.getSlotEl(slot);
    if (!slotEl) throw new Error(`Unknown slot: ${slot}`);

    // wrapper чтобы можно было управлять order/visibility независимо
    const wrap = document.createElement("div");
    apply(wrap, {
      pointerEvents: "none",
      display: "block",
      order: String(order),
    });
    slotEl.appendChild(wrap);

    widget.mount?.(wrap, props);

    const rec = { widget, wrap, slot, order, enabled, props };
    this.widgets.set(widget.id, rec);

    widget.setVisible?.(enabled);
    if (!enabled) wrap.style.display = "none";

    return rec;
  }

  enable(id, v = true) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    rec.enabled = !!v;
    rec.wrap.style.display = rec.enabled ? "" : "none";
    rec.widget.setVisible?.(rec.enabled);
  }

  toggle(id) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    this.enable(id, !rec.enabled);
  }

  unregisterWidget(id) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    try { rec.widget.destroy?.(); } catch (_) {}
    try { rec.wrap?.remove(); } catch (_) {}
    this.widgets.delete(id);
  }

// (опционально) если хочешь: bulk by prefix/owner
  unregisterWhere(pred) {
    for (const [id, rec] of [...this.widgets.entries()]) {
      if (pred(rec, id)) this.unregisterWidget(id);
    }
  }
  move(id, slot, order = undefined) {
    const rec = this.widgets.get(id);
    if (!rec) return;

    const slotEl = this.getSlotEl(slot);
    if (!slotEl) throw new Error(`Unknown slot: ${slot}`);

    rec.wrap.remove();
    slotEl.appendChild(rec.wrap);
    rec.slot = slot;

    if (order != null) {
      rec.order = order;
      rec.wrap.style.order = String(order);
    }

    this._updateSlotRects();
    rec.widget.onLayout?.(this.getSlotRect(rec.slot));
  }

  configure(id, patch = {}) {
    const rec = this.widgets.get(id);
    if (!rec) return;
    rec.props = { ...rec.props, ...patch };
    rec.widget.configure?.(rec.props);
  }

  update(game, scene, dt) {
    for (const rec of this.widgets.values()) {
      if (!rec.enabled) continue;
      rec.widget.update?.(game, scene, dt);
    }
  }

render(game, scene) {
  const surface = game.surface;
  const { canvasCssRect } = surface.value;

  for (const rec of this.widgets.values()) {
    if (!rec.enabled) continue;

    const r = rec.wrap.getBoundingClientRect();

    const rect = {
      x: r.left - canvasCssRect.x,
      y: r.top  - canvasCssRect.y,
      w: r.width,
      h: r.height,
    };

    rec.widget.render?.(game, scene, rect);
  }
}
destroy() {
    for (const rec of this.widgets.values()) {
      rec.widget.destroy?.();
      rec.wrap?.remove();
    }
    this.widgets.clear();
    this.slots.clear();
    try { this._ro?.disconnect(); } catch (_) {}
    try { this.root?.remove(); } catch (_) {}
  }
}

function apply(el, styles) {
  Object.assign(el.style, styles);
}

export class MobileControlsWidget {
  constructor({ id = "mobile-controls", ctx } = {}) {
    this.id = id;
    this.ctx = ctx;
    this.root = null;
    this.actions = null;
    this._pressed = new Set();
  }

  mount(parent) {
    this.root = document.createElement("div");
    apply(this.root, {
      pointerEvents: "auto",
      display: "none",
      gap: "10px",
      alignItems: "center",
      transform: "scale(var(--mobile-ui-scale, 1))",
      transformOrigin: "bottom right",
      touchAction: "none",
      userSelect: "none",
    });

    const row = document.createElement("div");
    apply(row, { display: "flex", gap: "10px", alignItems: "center" });

    const move = document.createElement("div");
    apply(move, { display: "grid", gridTemplateColumns: "52px 52px 52px", gridTemplateRows: "52px 52px 52px", gap: "6px" });

    const mkButton = (label, action, col, rowIdx) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.dataset.action = action;
      apply(b, {
        width: "52px",
        height: "52px",
        borderRadius: "14px",
        border: "1px solid rgba(160,200,255,.4)",
        background: "rgba(9,20,35,.75)",
        color: "#dff5ff",
        fontWeight: "700",
        fontSize: "22px",
        gridColumn: String(col),
        gridRow: String(rowIdx),
      });
      const down = (e) => {
        e.preventDefault();
        this._pressed.add(action);
      };
      const up = (e) => {
        e.preventDefault();
        this._pressed.delete(action);
      };
      b.addEventListener("pointerdown", down);
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("pointerleave", up);
      move.appendChild(b);
    };

    mkButton("↑", "moveForward", 2, 1);
    mkButton("←", "moveLeft", 1, 2);
    mkButton("→", "moveRight", 3, 2);
    mkButton("↓", "moveBack", 2, 3);

    const fire = document.createElement("button");
    fire.textContent = "FIRE";
    apply(fire, {
      width: "92px",
      height: "92px",
      borderRadius: "999px",
      border: "1px solid rgba(255,160,160,.6)",
      background: "rgba(70,10,10,.74)",
      color: "#ffd8d8",
      fontWeight: "800",
      letterSpacing: "0.4px",
    });

    const setFire = (v, e) => {
      e?.preventDefault?.();
      if (v) this._pressed.add("fire");
      else this._pressed.delete("fire");
    };
    fire.addEventListener("pointerdown", (e) => setFire(true, e));
    fire.addEventListener("pointerup", (e) => setFire(false, e));
    fire.addEventListener("pointercancel", (e) => setFire(false, e));
    fire.addEventListener("pointerleave", (e) => setFire(false, e));

    row.appendChild(move);
    row.appendChild(fire);
    this.root.appendChild(row);
    parent.appendChild(this.root);
  }

  update(game) {
    this.actions ??= game?.services?.get?.("actions");
    const settings = game?.services?.get?.("settings")?.getAll?.();
    const isTouch = window.matchMedia?.("(pointer: coarse)")?.matches;
    const enabled = !!settings?.mobileControls && isTouch;

    if (this.root) this.root.style.display = enabled ? "flex" : "none";

    if (!this.actions) return;

    if (!enabled) {
      for (const a of this._pressed) this.actions.setVirtualAction(a, false);
      return;
    }

    for (const action of ["moveForward", "moveBack", "moveLeft", "moveRight", "fire"]) {
      this.actions.setVirtualAction(action, this._pressed.has(action));
    }
  }

  destroy() {
    if (this.actions) {
      for (const action of ["moveForward", "moveBack", "moveLeft", "moveRight", "fire"]) {
        this.actions.setVirtualAction(action, false);
      }
    }
    this.root?.remove();
    this.root = null;
    this._pressed.clear();
  }
}

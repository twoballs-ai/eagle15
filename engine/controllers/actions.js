// engine/actions.js
// Converts low-level input (key codes, mouse buttons) into semantic actions.
// Only this file + Input deal with press logic.

export class Actions {
  constructor(input, bindings = null) {
    this.input = input;

    // Default bindings
    this.bindings = bindings ?? {
      cancel:   { keys: ["Escape"] },
      interact: { keys: ["KeyE"] },
      reset:    { keys: ["KeyR"] },

      clickPrimary: { mouse: ["left"] },
      clickAlt:     { mouse: ["right"] },
    };
  }

  // pressed this frame
  pressed(action) {
    const b = this.bindings[action];
    if (!b) return false;

    if (b.keys) {
      for (const code of b.keys) {
        if (this.input.isKeyPressed(code)) return true;
      }
    }
    if (b.mouse) {
      for (const btn of b.mouse) {
        if (this.input.isMousePressed(btn)) return true;
      }
    }
    return false;
  }

  // held down
  down(action) {
    const b = this.bindings[action];
    if (!b) return false;

    if (b.keys) {
      for (const code of b.keys) {
        if (this.input.isKeyDown(code)) return true;
      }
    }
    if (b.mouse) {
      for (const btn of b.mouse) {
        if (this.input.isMouseDown(btn)) return true;
      }
    }
    return false;
  }

  // ---- consume helpers (prevents double-handling) ----
  consume(action) {
    const b = this.bindings[action];
    if (!b) return;

    if (b.keys) {
      for (const code of b.keys) this.input.consumeKeyPressed(code);
    }
    if (b.mouse) {
      for (const btn of b.mouse) this.input.consumeMousePressed(btn);
    }
  }

  // Convenience: if action was pressed, consume and return true.
  take(action) {
    if (!this.pressed(action)) return false;
    this.consume(action);
    return true;
  }

  // ---- UI helpers (still no DOM listeners anywhere else) ----
  lastPointerTarget() {
    // You must have added this method in Input
    return this.input.getLastPointerDownTarget?.() ?? null;
  }

  // true if primary click happened and the click target is NOT inside element
  clickedOutside(domEl) {
    if (!domEl) return false;
    if (!this.pressed("clickPrimary")) return false;

    const t = this.lastPointerTarget();
    if (!t) return true; // clicked somewhere unknown -> treat as outside

    return !domEl.contains(t);
  }

  // true if primary click happened and it WAS inside element
  clickedInside(domEl) {
    if (!domEl) return false;
    if (!this.pressed("clickPrimary")) return false;

    const t = this.lastPointerTarget();
    if (!t) return false;

    return domEl.contains(t);
  }
}

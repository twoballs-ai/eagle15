// engine/controllers/input.js
// Unified input for keyboard + pointer(mouse/touch/pen).
// - keyboard uses e.code (e.g. "Escape", "KeyE")
// - pointer coords are in DEVICE PIXELS (match canvas.width/height) when pointer is over canvas
// - has "pressed this frame" flags (edge trigger)
// - wheel is accumulated per-frame
// - includes safety reset on window blur/visibility change
// - includes "consume" helpers to prevent double-handling
// - records last pointerdown target so UI can do "click outside" WITHOUT its own event listeners

export class Input {
  constructor({ canvas, getView }) {
    this.canvas = canvas;
    this.getView = getView;

    // ---- Keyboard ----
    this.keysDown = new Set();
    this.keysPressed = new Set(); // pressed this frame (edge)

    // ---- Pointer coords in device pixels (only meaningful relative to canvas) ----
    this.mouseX = 0;
    this.mouseY = 0;

    // ---- Mouse buttons ----
    this.mouseDown = { left: false, middle: false, right: false };
    this.mousePressed = { left: false, middle: false, right: false }; // pressed this frame (edge)

    // ---- Wheel ----
    this.wheelY = 0; // accumulated this frame

    // ---- UI helpers ----
    this._lastPointerDownTarget = null; // last DOM element clicked (for click-outside logic)
    this._lastPointerDownWasOnCanvas = false;

    // ---- Bind handlers ----
    this._onKeyDown = (e) => {
      if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code);
      this.keysDown.add(e.code);
    };

    this._onKeyUp = (e) => {
      this.keysDown.delete(e.code);
    };

    // Pointer move is only needed on canvas to keep coordinates consistent with render
    this._onPointerMove = (e) => {
const rect = this.canvas.getBoundingClientRect();
const dpr = this.getView?.()?.dpr ?? window.devicePixelRatio ?? 1;
this.mouseX = (e.clientX - rect.left) * dpr;
this.mouseY = (e.clientY - rect.top) * dpr;
    };

    // We capture pointerdown on WINDOW so we can react to clicks anywhere (menus, UI, outside canvas).
    // This allows UI components to be passive (no addEventListener inside them).
    this._onPointerDownWindow = (e) => {
      // remember target for UI "click outside"
      this._lastPointerDownTarget = e.target ?? null;

      // determine if click is on canvas (or inside it)
      const onCanvas = e.target === this.canvas || this.canvas.contains(e.target);
      this._lastPointerDownWasOnCanvas = !!onCanvas;
console.log("pointerdown btn", e.button, "set pressed");
      // If pointerdown is on canvas, update coords right here (in case there was no prior move)
      if (onCanvas) {
const rect = this.canvas.getBoundingClientRect();
const dpr = this.getView?.()?.dpr ?? window.devicePixelRatio ?? 1;
this.mouseX = (e.clientX - rect.left) * dpr;
this.mouseY = (e.clientY - rect.top) * dpr;
      }

      // Mouse button mapping (pointer events still expose .button for mouse)
      // For touch/pen .button can be -1; we treat it like left click for UI/game.
      const btn =
        e.button === 1 ? "middle" :
        e.button === 2 ? "right"  :
        "left";

      this._pressMouse(btn);
    };

    this._onPointerUpWindow = (e) => {
      const btn =
        e.button === 1 ? "middle" :
        e.button === 2 ? "right"  :
        "left";

      this.mouseDown[btn] = false;
    };

    this._onWheel = (e) => {
      this.wheelY += e.deltaY;
      e.preventDefault(); // prevent page scroll when wheel over canvas
    };

    this._onContextMenu = (e) => {
      e.preventDefault(); // disable browser context menu on canvas
    };

    this._onBlur = () => this.resetAll();

    this._onVisibilityChange = () => {
      if (document.hidden) this.resetAll();
    };

    // ---- Attach ----
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // pointer coords only need tracking over canvas
    canvas.addEventListener("pointermove", this._onPointerMove);

    // global pointerdown/up (capture down so UI doesn't have to)
    window.addEventListener("pointerdown", this._onPointerDownWindow, true);
    
    window.addEventListener("pointerup", this._onPointerUpWindow, true);

    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this._onContextMenu);

    window.addEventListener("blur", this._onBlur);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  }

  // ---- Internal helpers ----
  _pressMouse(buttonName) {
    if (!this.mouseDown[buttonName]) {
      this.mousePressed[buttonName] = true;
    }
    this.mouseDown[buttonName] = true;
  }

  // ---- Frame boundary ----
  beginFrame() {
    this.keysPressed.clear();
    this.mousePressed.left = false;
    this.mousePressed.middle = false;
    this.mousePressed.right = false;
    this.wheelY = 0;

    // UI click-outside uses this; it must be "this frame only"
    this._lastPointerDownTarget = null;
    this._lastPointerDownWasOnCanvas = false;
  }

  // ---- Reset (for blur/visibility) ----
  resetAll() {
    this.keysDown.clear();
    this.keysPressed.clear();

    this.mouseDown.left = this.mouseDown.middle = this.mouseDown.right = false;
    this.mousePressed.left = this.mousePressed.middle = this.mousePressed.right = false;

    this.wheelY = 0;

    this._lastPointerDownTarget = null;
    this._lastPointerDownWasOnCanvas = false;
  }

  // ---- Keyboard API ----
  isKeyDown(code) {
    return this.keysDown.has(code);
  }

  isKeyPressed(code) {
    return this.keysPressed.has(code);
  }

  consumeKeyPressed(code) {
    this.keysPressed.delete(code);
  }

  // ---- Mouse API ----
  isMouseDown(button /* 'left'|'middle'|'right' */) {
    return !!this.mouseDown[button];
  }

  isMousePressed(button) {
    return !!this.mousePressed[button];
  }

  consumeMousePressed(button) {
    this.mousePressed[button] = false;
  }

  // ---- Wheel API ----
  getWheelY() {
    return this.wheelY;
  }

  consumeWheel() {
    this.wheelY = 0;
  }

  // ---- Coords (device pixels, relative to canvas) ----
  getMouse() {
    return { x: this.mouseX, y: this.mouseY };
  }

  // ---- UI helpers ----
  // DOM target of last pointerdown (this frame). Useful for "click outside" logic.
  getLastPointerDownTarget() {
    return this._lastPointerDownTarget;
  }

  // True if last pointerdown happened on canvas (or inside it).
  wasLastPointerDownOnCanvas() {
    return this._lastPointerDownWasOnCanvas;
  }

  // ---- Cleanup ----
  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    this.canvas.removeEventListener("pointermove", this._onPointerMove);

    window.removeEventListener("pointerdown", this._onPointerDownWindow, true);
    window.removeEventListener("pointerup", this._onPointerUpWindow, true);

    this.canvas.removeEventListener("wheel", this._onWheel);
    this.canvas.removeEventListener("contextmenu", this._onContextMenu);

    window.removeEventListener("blur", this._onBlur);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
  }
}

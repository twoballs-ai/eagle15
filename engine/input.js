// engine/input.js
// Unified input for keyboard + mouse.
// - mouse coords are in DEVICE PIXELS (match canvas.width/height)
// - has "pressed this frame" flags
// - wheel is accumulated per-frame (you decide how to use it)

export class Input {
  constructor({ canvas, getView }) {
    this.canvas = canvas;
    this.getView = getView;

    this.keysDown = new Set();
    this.keysPressed = new Set(); // pressed this frame

    // Mouse in device pixels
    this.mouseX = 0;
    this.mouseY = 0;

    this.mouseDown = { left: false, middle: false, right: false };
    this.mousePressed = { left: false, middle: false, right: false }; // pressed this frame

    this.wheelY = 0; // accumulated this frame

    // Bind handlers
    this._onKeyDown = (e) => {
      if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code);
      this.keysDown.add(e.code);
    };
    this._onKeyUp = (e) => {
      this.keysDown.delete(e.code);
    };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const { dpr } = this.getView();
      this.mouseX = (e.clientX - rect.left) * dpr;
      this.mouseY = (e.clientY - rect.top) * dpr;
    };

    this._onMouseDown = (e) => {
      // 0 left, 1 middle, 2 right
      if (e.button === 0) this._pressMouse("left");
      else if (e.button === 1) this._pressMouse("middle");
      else if (e.button === 2) this._pressMouse("right");
    };

    this._onMouseUp = (e) => {
      if (e.button === 0) this.mouseDown.left = false;
      else if (e.button === 1) this.mouseDown.middle = false;
      else if (e.button === 2) this.mouseDown.right = false;
    };

    this._onWheel = (e) => {
      this.wheelY += e.deltaY;
      // prevent page scroll
      e.preventDefault();
    };

    this._onContextMenu = (e) => {
      // disable browser menu on canvas
      e.preventDefault();
    };

    // Attach
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    canvas.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);

    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this._onContextMenu);
  }

  _pressMouse(buttonName) {
    if (!this.mouseDown[buttonName]) {
      this.mousePressed[buttonName] = true;
    }
    this.mouseDown[buttonName] = true;
  }

  beginFrame() {
    // clear "pressed this frame" flags
    this.keysPressed.clear();
    this.mousePressed.left = false;
    this.mousePressed.middle = false;
    this.mousePressed.right = false;
    this.wheelY = 0;
  }

  // Keyboard helpers
  isKeyDown(code) {
    return this.keysDown.has(code);
  }
  isKeyPressed(code) {
    return this.keysPressed.has(code);
  }

  // Mouse helpers
  isMouseDown(button /* 'left'|'middle'|'right' */) {
    return !!this.mouseDown[button];
  }
  isMousePressed(button) {
    return !!this.mousePressed[button];
  }

  // coords
  getMouse() {
    return { x: this.mouseX, y: this.mouseY };
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    this.canvas.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mouseup", this._onMouseUp);

    this.canvas.removeEventListener("wheel", this._onWheel);
    this.canvas.removeEventListener("contextmenu", this._onContextMenu);
  }
}
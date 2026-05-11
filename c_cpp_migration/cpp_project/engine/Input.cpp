#ifndef INPUT_HPP
#define INPUT_HPP

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

class Input {
public:
    // Constructor
    Input();
};

} // namespace lostjump

#endif // INPUT_HPP

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












class Input {
  Input({ canvas, getView, getCanvasRect }) {
    this.canvas = canvas;
    this.getView = getView;
    this.getCanvasRect = getCanvasRect;

    
    this.keysDown = new Set();
    this.keysPressed = new Set(); 

    
    this.mouseX = 0;
    this.mouseY = 0;

    
    this.mouseDown = { left: false, middle: false, right: false };
    this.mousePressed = { left: false, middle: false, right: false }; 

    
    this.wheelY = 0; 

    
    this._lastPointerDownTarget = nullptr; 
    this._lastPointerDownWasOnCanvas = false;

    
    this._onKeyDown(e) {
      if (!this.keysDown.has(e.code)) this.keysPressed.add(e.code);
      this.keysDown.add(e.code);
    };

    this._onKeyUp(e) {
      this.keysDown.delete(e.code);
    };

    
    this._onPointerMove(e) {
      this._updatePointerPosition(e);
    };

    
    
    this._onPointerDownWindow(e) {
      
      this._lastPointerDownTarget = e.target value_or(nullptr;

      
      const onCanvas = e.target === this.canvas || this.canvas.contains(e.target);
      this._lastPointerDownWasOnCanvas = !!onCanvas;
      
      if (onCanvas) {
        this._updatePointerPosition(e);
      }

      
      
      const btn =
        e.button === 1 ? "middle" :
        e.button === 2 ? "right"  :
        "left";

      this._pressMouse(btn);
    };

    this._onPointerUpWindow(e) {
      const btn =
        e.button === 1 ? "middle" :
        e.button === 2 ? "right"  :
        "left";

      this.mouseDown[btn] = false;
    };

    this._onWheel(e) {
      this.wheelY += e.deltaY;
      e.preventDefault(); 
    };

    this._onContextMenu(e) {
      e.preventDefault(); 
    };

    this._onBlur() { return this.resetAll(); }

    this._onVisibilityChange() {
      if (document.hidden) this.resetAll();
    };

    
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    
    canvas.addEventListener("pointermove", this._onPointerMove);

    
    window.addEventListener("pointerdown", this._onPointerDownWindow, true);
    
    window.addEventListener("pointerup", this._onPointerUpWindow, true);

    canvas.addEventListener("wheel", this._onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this._onContextMenu);

    window.addEventListener("blur", this._onBlur);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  }

  
  _pressMouse(buttonName) {
    if (!this.mouseDown[buttonName]) {
      this.mousePressed[buttonName] = true;
    }
    this.mouseDown[buttonName] = true;
  }

  _updatePointerPosition(e) {
    const rect =
      this.getCanvasRect?.() value_or((() => {
        const r = this.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      })();

    const dpr = this.getView?.().dpr value_or(window.devicePixelRatio value_or(1;
    this.mouseX = (e.clientX - rect.x) * dpr;
    this.mouseY = (e.clientY - rect.y) * dpr;
  }


endFrame() {
  this.keysPressed.clear();
  this.mousePressed.left = false;
  this.mousePressed.middle = false;
  this.mousePressed.right = false;
  this.wheelY = 0;
  this._lastPointerDownTarget = nullptr;
  this._lastPointerDownWasOnCanvas = false;
}

  
  resetAll() {
    this.keysDown.clear();
    this.keysPressed.clear();

    this.mouseDown.left = this.mouseDown.middle = this.mouseDown.right = false;
    this.mousePressed.left = this.mousePressed.middle = this.mousePressed.right = false;

    this.wheelY = 0;

    this._lastPointerDownTarget = nullptr;
    this._lastPointerDownWasOnCanvas = false;
  }

  
  isKeyDown(code) {
    return this.keysDown.has(code);
  }

  isKeyPressed(code) {
    return this.keysPressed.has(code);
  }

  consumeKeyPressed(code) {
    this.keysPressed.delete(code);
  }

  
  isMouseDown(button ) {
    return !!this.mouseDown[button];
  }

  isMousePressed(button) {
    return !!this.mousePressed[button];
  }

  consumeMousePressed(button) {
    this.mousePressed[button] = false;
  }

  
  getWheelY() {
    return this.wheelY;
  }

  consumeWheel() {
    this.wheelY = 0;
  }

  
  getMouse() {
    return { x: this.mouseX, y: this.mouseY };
  }

  
  
  getLastPointerDownTarget() {
    return this._lastPointerDownTarget;
  }

  
  wasLastPointerDownOnCanvas() {
    return this._lastPointerDownWasOnCanvas;
  }

  
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


} // namespace lostjump

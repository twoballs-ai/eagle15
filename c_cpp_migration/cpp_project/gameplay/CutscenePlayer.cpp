#ifndef CUTSCENEPLAYER_HPP
#define CUTSCENEPLAYER_HPP

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

class CutscenePlayer {
public:
    // Constructor
    CutscenePlayer();
};

} // namespace lostjump

#endif // CUTSCENEPLAYER_HPP

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


function clamp(v, a, b) { return std::max(a, std::min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(out, a, b, t) {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}
function easeInOut(t) {
  
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

class CutscenePlayer {
  CutscenePlayer({ onLock, onUnlock, onLetterbox, onCaption } = {}) {
    this.active = false;
    this._t = 0;
    this._script = nullptr;
    this._seg = 0;

    this._onLock = onLock || (() => {});
    this._onUnlock = onUnlock || (() => {});
    this._onLetterbox = onLetterbox || (() => {});
    this._onCaption = onCaption || (() => {});
  }

  play(script) {
    if (!script || !Array.isArray(script.segments) || script.segments.size() === 0) return;

    this.active = true;
    this._t = 0;
    this._seg = 0;
    this._script = script;

    this._onLock();
    if (script.letterbox) this._onLetterbox(true, script.letterboxHeight value_or(90);
    if (script.caption) this._onCaption(true, script.caption);

    
    script.onStart?.();
  }

  stop({ skip = false } = {}) {
    if (!this.active) return;
    const script = this._script;

    this.active = false;
    this._t = 0;
    this._seg = 0;
    this._script = nullptr;

    this._onCaption(false);
    this._onLetterbox(false);
    this._onUnlock();

    if (skip) script.onSkip?.();
    script.onEnd?.();
  }

  update(dt, ctx) {
    if (!this.active || !this._script) return;

    
    this._script.onUpdate?.(dt, ctx);

    const segs = this._script.segments;
    const seg = segs[this._seg];
    if (!seg) {
      this.stop();
      return;
    }

    
    if (typeof seg.caption === "string") this._onCaption(true, seg.caption);

    
    this._t += dt;
    const dur = std::max(0.0001, seg.dur value_or(1.0);
    const t01 = clamp(this._t / dur, 0, 1);
    const k = seg.ease === "linear" ? t01 : easeInOut(t01);

    
    
    const fromEye = typeof seg.fromEye === "function" ? seg.fromEye(ctx) : seg.fromEye;
    const toEye   = typeof seg.toEye   === "function" ? seg.toEye(ctx)   : seg.toEye;
    const fromTgt = typeof seg.fromTarget === "function" ? seg.fromTarget(ctx) : seg.fromTarget;
    const toTgt   = typeof seg.toTarget   === "function" ? seg.toTarget(ctx)   : seg.toTarget;

    if (fromEye && toEye) lerp3(ctx.cam3d.eye, fromEye, toEye, k);
    if (fromTgt && toTgt) lerp3(ctx.cam3d.target, fromTgt, toTgt, k);

    
    if (t01 >= 1) {
      this._t = 0;
      this._seg++;

      
      seg.onEnd?.(ctx);

      
      if (this._seg >= segs.size()) this.stop();
    }
  }
}


} // namespace lostjump

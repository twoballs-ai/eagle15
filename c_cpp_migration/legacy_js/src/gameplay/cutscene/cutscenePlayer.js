function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(out, a, b, t) {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}
function easeInOut(t) {
  // smoothstep
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

export class CutscenePlayer {
  constructor({ onLock, onUnlock, onLetterbox, onCaption } = {}) {
    this.active = false;
    this._t = 0;
    this._script = null;
    this._seg = 0;

    this._onLock = onLock || (() => {});
    this._onUnlock = onUnlock || (() => {});
    this._onLetterbox = onLetterbox || (() => {});
    this._onCaption = onCaption || (() => {});
  }

  play(script) {
    if (!script || !Array.isArray(script.segments) || script.segments.length === 0) return;

    this.active = true;
    this._t = 0;
    this._seg = 0;
    this._script = script;

    this._onLock();
    if (script.letterbox) this._onLetterbox(true, script.letterboxHeight ?? 90);
    if (script.caption) this._onCaption(true, script.caption);

    // optional hook
    script.onStart?.();
  }

  stop({ skip = false } = {}) {
    if (!this.active) return;
    const script = this._script;

    this.active = false;
    this._t = 0;
    this._seg = 0;
    this._script = null;

    this._onCaption(false);
    this._onLetterbox(false);
    this._onUnlock();

    if (skip) script?.onSkip?.();
    script?.onEnd?.();
  }

  update(dt, ctx) {
    if (!this.active || !this._script) return;

    // allow per-script updates
    this._script.onUpdate?.(dt, ctx);

    const segs = this._script.segments;
    const seg = segs[this._seg];
    if (!seg) {
      this.stop();
      return;
    }

    // caption updates (if segment defines)
    if (typeof seg.caption === "string") this._onCaption(true, seg.caption);

    // segment time
    this._t += dt;
    const dur = Math.max(0.0001, seg.dur ?? 1.0);
    const t01 = clamp(this._t / dur, 0, 1);
    const k = seg.ease === "linear" ? t01 : easeInOut(t01);

    // camera interpolation
    // seg.from / seg.to can be arrays or functions(ctx)=>array
    const fromEye = typeof seg.fromEye === "function" ? seg.fromEye(ctx) : seg.fromEye;
    const toEye   = typeof seg.toEye   === "function" ? seg.toEye(ctx)   : seg.toEye;
    const fromTgt = typeof seg.fromTarget === "function" ? seg.fromTarget(ctx) : seg.fromTarget;
    const toTgt   = typeof seg.toTarget   === "function" ? seg.toTarget(ctx)   : seg.toTarget;

    if (fromEye && toEye) lerp3(ctx.cam3d.eye, fromEye, toEye, k);
    if (fromTgt && toTgt) lerp3(ctx.cam3d.target, fromTgt, toTgt, k);

    // finish segment
    if (t01 >= 1) {
      this._t = 0;
      this._seg++;

      // segment hook
      seg.onEnd?.(ctx);

      // end of script
      if (this._seg >= segs.length) this.stop();
    }
  }
}

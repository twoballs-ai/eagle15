export class CutsceneCaption {
  constructor({ parent = document.body } = {}) {
    this.el = document.createElement("div");
    this.el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 110px;
      transform: translateX(-50%);
      max-width: min(920px, calc(100vw - 40px));
      padding: 12px 16px;
      border-radius: 10px;
      background: rgba(0,0,0,0.55);
      color: rgba(255,255,255,0.92);
      font: 600 16px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial;
      letter-spacing: 0.2px;
      z-index: 9999;
      opacity: 0;
      transition: opacity 180ms ease, transform 180ms ease;
      pointer-events: none;
    `;
    parent.appendChild(this.el);
  }

  show(text) {
    this.el.textContent = text ?? "";
    this.el.style.opacity = "1";
    this.el.style.transform = "translateX(-50%) translateY(0px)";
  }

  hide() {
    this.el.style.opacity = "0";
    this.el.style.transform = "translateX(-50%) translateY(6px)";
  }

  destroy() {
    this.el.remove();
  }
}

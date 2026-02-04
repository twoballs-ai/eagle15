export class LetterboxOverlay {
  constructor({ parent = document.body } = {}) {
    this.el = document.createElement("div");
    this.el.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transition: opacity 200ms ease;
    `;

    this.top = document.createElement("div");
    this.bot = document.createElement("div");

    const barCss = `
      position: absolute;
      left: 0;
      right: 0;
      height: var(--h, 0px);
      background: rgba(0,0,0,0.92);
      transition: height 260ms ease;
    `;

    this.top.style.cssText = barCss + `top: 0;`;
    this.bot.style.cssText = barCss + `bottom: 0;`;

    this.el.appendChild(this.top);
    this.el.appendChild(this.bot);
    parent.appendChild(this.el);
  }

  show(heightPx = 90) {
    this.el.style.opacity = "1";
    this.top.style.setProperty("--h", `${heightPx}px`);
    this.bot.style.setProperty("--h", `${heightPx}px`);
  }

  hide() {
    this.top.style.setProperty("--h", `0px`);
    this.bot.style.setProperty("--h", `0px`);
    // чуть позже гасим opacity, чтобы полосы успели уехать
    setTimeout(() => (this.el.style.opacity = "0"), 260);
  }

  destroy() {
    this.el.remove();
  }
}

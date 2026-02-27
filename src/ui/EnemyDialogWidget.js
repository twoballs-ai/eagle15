export class EnemyDialogWidget {
  constructor() {
    this.root = document.createElement("div");
    this.root.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(520px, calc(100vw - 24px));
      background: linear-gradient(180deg, rgba(17,22,31,0.96), rgba(9,12,18,0.96));
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      box-shadow: 0 18px 48px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      color: #eef3ff;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      padding: 14px;
      z-index: 1000000;
      display: none;
    `;

    this.root.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive: false });
    document.body.appendChild(this.root);
    this.currentShip = null;
  }

  open({ ship, title, text, actions = [] }) {
    this.currentShip = ship ?? null;

    const safeActions = actions.slice(0, 4);
    const buttons = safeActions
      .map((a, idx) => `<button data-idx="${idx}" style="
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.04);
        color: #eef3ff;
        border-radius: 10px;
        font-size: 14px;
        padding: 9px 12px;
        cursor: pointer;
      ">${a.label ?? "Действие"}</button>`)
      .join("");

    this.root.innerHTML = `
      <div style="font-weight:700;font-size:14px;letter-spacing:0.02em;opacity:0.95; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:8px;">
        ${title ?? ship?.name ?? "Связь"}
      </div>
      <div style="font-size:14px;line-height:1.4;opacity:0.96; margin-bottom:12px;">
        ${text ?? "Получен запрос на взаимодействие."}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${buttons}</div>
    `;

    this.root.style.display = "block";

    this.root.querySelectorAll("button[data-idx]").forEach((btn) => {
      btn.onmouseenter = () => (btn.style.background = "rgba(255,255,255,0.12)");
      btn.onmouseleave = () => (btn.style.background = "rgba(255,255,255,0.04)");
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-idx"));
        this.close();
        safeActions[idx]?.onClick?.();
      };
    });
  }

  close() {
    this.root.style.display = "none";
    this.currentShip = null;
  }
}

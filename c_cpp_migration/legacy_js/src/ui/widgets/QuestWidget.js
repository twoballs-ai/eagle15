function apply(el, styles) { Object.assign(el.style, styles); }

export class QuestWidget {
  constructor({ id = "quest-widget" } = {}) {
    this.id = id;
    this.el = null;
    this._last = "";
  }

  mount(parent) {
    const el = document.createElement("div");
    parent.appendChild(el);
    this.el = el;

    apply(el, {
      pointerEvents: "none",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "12px",
      lineHeight: "1.25",
      color: "rgba(235, 245, 255, 0.95)",
      textShadow: "0 1px 2px rgba(0,0,0,0.65)",
      background: "linear-gradient(180deg, rgba(18,25,39,0.88), rgba(7,12,20,0.86))",
      border: "1px solid rgba(130, 195, 255, 0.22)",
      borderRadius: "16px",
      padding: "12px",
      width: "380px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
    });

    el.textContent = "Загрузка миссий…";
  }

  setVisible(v) {
    if (!this.el) return;
    this.el.style.display = v ? "" : "none";
  }

update(game, scene, dt) {
  const ctx = scene?.ctx ?? scene;

  const actId = ctx.act?.current ?? "—";

  // active quests overview
  const active = ctx.quest?.active ?? {};
  const lines = [];

  for (const [qid, qstate] of Object.entries(active)) {
    const qdef = ctx.content?.questsById?.[qid];
    const title = qdef?.title ?? qid;
    const type = qdef?.type ?? "unknown";
    const pr = qstate?.priority ? "⭐" : " ";

    // кратко: сколько objectives done
    const obj = qstate?.objectives ?? {};
    const doneN = Object.values(obj).filter(o => o?.done).length;
    const allN = Object.keys(obj).length;

    lines.push(`${pr} [${type}] ${title} (${doneN}/${allN})`);
  }

  const shipR = game.state.playerShip?.runtime;
  const focus = ctx.poiFocus;

  let focusLine = "";
  if (shipR && focus) {
    const dx = (focus.worldX ?? 0) - shipR.x;
    const dz = (focus.worldZ ?? 0) - shipR.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    focusLine = `<br>Дистанция: ${dist.toFixed(0)}m`;
  }

  const text =
    `<div style="font-size:10px;letter-spacing:.14em;opacity:.72;margin-bottom:8px;">MISSION CONTROL · ACT ${actId}</div>` +
    `<div style="display:grid;gap:6px;">` +
    (lines.length
      ? lines
          .slice(0, 4)
          .map((line) => `<div style="padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.05);">${line}</div>`)
          .join("")
      : `<div style="padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.05);">Активных миссий нет</div>`) +
    `</div>` +
    `<div style="margin-top:10px;font-size:11px;opacity:.86;">Цель: ${ctx.poiHint || "—"}${focusLine}</div>`;

  if (text === this._last) return;
  this._last = text;
  this.el.innerHTML = text;
}


  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

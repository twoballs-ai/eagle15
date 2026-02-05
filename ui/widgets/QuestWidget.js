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
      whiteSpace: "pre-line",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "13px",
      lineHeight: "1.25",
      color: "rgba(235, 245, 255, 0.95)",
      textShadow: "0 1px 2px rgba(0,0,0,0.65)",
      background: "rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "10px 12px",
      maxWidth: "420px",
    });

    el.textContent = "HUDManager OK ✅";
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
    focusLine = `\nДистанция: ${dist.toFixed(0)}m`;
  }

  const text =
    `АКТ: ${actId}\n` +
    `\n` +
    `АКТИВНЫЕ КВЕСТЫ:\n` +
    (lines.length ? lines.join("\n") : "—") +
    `\n\n` +
    `Рядом: ${ctx.poiHint || "—"}` +
    focusLine +
    `\n\n` +
    `Событие: ${ctx.lastLog || "—"}`;

  if (text === this._last) return;
  this._last = text;
  this.el.textContent = text;
}


  destroy() {
    try { this.el?.remove(); } catch (_) {}
    this.el = null;
  }
}

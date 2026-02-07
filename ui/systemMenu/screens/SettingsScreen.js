// engine/ui/systemMenu/screens/SettingsScreen.js
export class SettingsScreen {
  constructor(services) {
    this.services = services;

    this.settings = {
      music: true,
      sfx: true,
      invertMouse: false,
      quality: 2, // 0 low, 1 mid, 2 high
    };

    this._loaded = false;
  }

  onOpen() {
    if (this._loaded) return;
    this._loaded = true;

    try {
      const raw = localStorage.getItem("ga_settings");
      if (raw) this.settings = { ...this.settings, ...JSON.parse(raw) };
    } catch (_) {}
  }

  _save() {
    try {
      localStorage.setItem("ga_settings", JSON.stringify(this.settings));
    } catch (_) {}
  }

  _toggle(key) {
    this.settings[key] = !this.settings[key];
    this._save();
  }

  render(ui, rect, dt, mouse) {
    ui.text(rect.x + 18, rect.y + 18, "Настройки (MVP)", { size: 16, color: "rgba(255,255,255,0.9)" });

    const panel = { x: rect.x + 18, y: rect.y + 52, w: rect.w - 36, h: rect.h - 70 };
    ui.rect(panel.x, panel.y, panel.w, panel.h, {
      fill: "rgba(0,0,0,0.22)",
      stroke: "rgba(255,255,255,0.08)",
      radius: 12,
    });

    let y = panel.y + 16;

    const drawCheck = (label, key) => {
      const row = { x: panel.x + 16, y, w: 460, h: 40 };
      const hover = ui.hitRect(row.x, row.y, row.w, row.h, mouse.x, mouse.y);

      ui.rect(row.x, row.y, row.w, row.h, {
        fill: hover ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        stroke: "rgba(255,255,255,0.06)",
        radius: 10,
      });

      const box = { x: row.x + 12, y: row.y + 10, w: 20, h: 20 };
      ui.rect(box.x, box.y, box.w, box.h, { fill: "rgba(0,0,0,0.25)", stroke: "rgba(255,255,255,0.16)", radius: 6 });
      if (this.settings[key]) ui.text(box.x + 6, box.y + 2, "✓", { size: 16, color: "rgba(255,255,255,0.9)" });

      ui.text(row.x + 44, row.y + 12, label, { size: 14, color: "rgba(255,255,255,0.82)" });

      if (mouse.justDown && hover) this._toggle(key);

      y += 48;
    };

    drawCheck("Музыка", "music");
    drawCheck("Звуки", "sfx");
    drawCheck("Инверсия мыши", "invertMouse");

    // качество (простой переключатель)
    ui.text(panel.x + 16, y + 10, "Качество", { size: 14, color: "rgba(255,255,255,0.82)" });

    const buttons = [
      { id: 0, label: "Low" },
      { id: 1, label: "Mid" },
      { id: 2, label: "High" },
    ];
    let bx = panel.x + 120;
    const by = y;
    for (const b of buttons) {
      const r = { x: bx, y: by, w: 90, h: 36 };
      const hover = ui.hitRect(r.x, r.y, r.w, r.h, mouse.x, mouse.y);
      const active = this.settings.quality === b.id;

      ui.rect(r.x, r.y, r.w, r.h, {
        fill: active ? "rgba(255,255,255,0.14)" : (hover ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)"),
        stroke: "rgba(255,255,255,0.08)",
        radius: 10,
      });
      ui.text(r.x + 18, r.y + 10, b.label, { size: 13, color: "rgba(255,255,255,0.80)" });

      if (mouse.justDown && hover) {
        this.settings.quality = b.id;
        this._save();
      }

      bx += 100;
    }
  }
}

export class HudScope {
  constructor(hud) {
    this.hud = hud;
    this.ids = [];
  }

  register(widget, cfg) {
    this.hud.registerWidget(widget, cfg);
    this.ids.push(widget.id);
    return widget;
  }

  dispose() {
    for (const id of this.ids) this.hud.unregisterWidget(id);
    this.ids.length = 0;
  }
}

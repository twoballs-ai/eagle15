import { clamp, screenToWorld } from "../engine/math.js";

export class GalaxyMapScene {
  constructor(game) {
    this.game = game;
    this.name = "Galaxy Map";
  }

  enter() {
    // можно сбрасывать UI при входе
    this.game.state.ui.menuOpen = false;
    this.game.state.selectedSystemId = null;
    this.game.menu.close();
  }

  update(dt) {
    const { state, getView, galaxy, menu, input } = this.game;
    const view = getView();
    const cam = state.camera;

    // Mouse in DEVICE pixels
    const { x: sx, y: sy } = input.getMouse();
    const wpos = screenToWorld(sx, sy, view.w, view.h, cam.x, cam.y, cam.zoom);

    // Zoom to cursor (wheel)
    if (input.wheelY !== 0 && !menu.isOpen) {
      const zOld = cam.zoom;
      const zNew = clamp(zOld * (input.wheelY < 0 ? 1.1 : 0.9), 0.35, 3.0);

      const before = screenToWorld(sx, sy, view.w, view.h, cam.x, cam.y, zOld);
      cam.zoom = zNew;
      const after = screenToWorld(sx, sy, view.w, view.h, cam.x, cam.y, zNew);

      cam.x += (before.x - after.x);
      cam.y += (before.y - after.y);
    }

    // Camera movement WASD (only when menu not open)
    if (!menu.isOpen) {
      const speed = 520 / cam.zoom;
      let mx = 0, my = 0;

      if (input.isKeyDown("KeyA")) mx -= 1;
      if (input.isKeyDown("KeyD")) mx += 1;
      if (input.isKeyDown("KeyW")) my -= 1;
      if (input.isKeyDown("KeyS")) my += 1;

      if (mx || my) {
        const l = Math.hypot(mx, my);
        mx /= l; my /= l;
        cam.x += mx * speed * dt;
        cam.y += my * speed * dt;
      }
    }

    // ПКМ → открыть контекстное меню над системой
    if (input.isMousePressed("right")) {
      const sys = galaxy.pickSystem(wpos.x, wpos.y, 22);

      if (sys) {
        state.selectedSystemId = sys.id;
        state.ui.menuOpen = true;

        // menu.open ожидает CSS pixels, а input хранит device pixels
        const cssX = sx / view.dpr;
        const cssY = sy / view.dpr;

        menu.open({
          x: cssX,
          y: cssY,
          title: `${sys.name}`,
          items: [
            {
              label: "Перейти в систему",
              onClick: () => this.game.openStarSystem(sys.id),
            },
            { label: "Отмена", onClick: () => {} },
          ],
        });
      } else {
        menu.close();
      }
    }

    // ЛКМ по пустоте — закрываем меню
    if (input.isMousePressed("left")) {
      menu.close();
    }
  }

  render() {
    const { r2d, getView, state, galaxy } = this.game;
    const view = getView();
    const cam = state.camera;

    r2d.clear(0.04, 0.05, 0.08, 1);
    r2d.begin(view.w, view.h, cam.x, cam.y, cam.zoom);

    drawStarfield(r2d, view, cam);

    // Links
    for (const l of galaxy.links) {
      const a = galaxy.systems[l.a];
      const b = galaxy.systems[l.b];
      r2d.line(a.x, a.y, b.x, b.y, 2, 0.2, 0.35, 0.6, 0.35);
    }

    // Systems
    for (const s of galaxy.systems) {
      const isSelected = s.id === state.selectedSystemId;

      if (isSelected) r2d.quad(s.x, s.y, s.size * 2.4, s.size * 2.4, 1.0, 0.75, 0.2, 0.95);
      else r2d.quad(s.x, s.y, s.size * 2.0, s.size * 2.0, 0.65, 0.75, 1.0, 0.85);

      r2d.quad(s.x, s.y, s.size * 0.9, s.size * 0.9, 1, 1, 1, 0.9);
    }

    r2d.end();
  }
}

function drawStarfield(r2d, view, cam) {
  const z = cam.zoom;
  const step = 120;

  const left = cam.x - view.w * 0.6 / z;
  const right = cam.x + view.w * 0.6 / z;
  const top = cam.y - view.h * 0.6 / z;
  const bottom = cam.y + view.h * 0.6 / z;

  const x0 = Math.floor(left / step) * step;
  const y0 = Math.floor(top / step) * step;

  for (let y = y0; y <= bottom; y += step) {
    for (let x = x0; x <= right; x += step) {
      const h = hash2(x, y);
      for (let i = 0; i < 3; i++) {
        const sx = x + ((h(i * 17 + 1) * 2 - 1) * step * 0.45);
        const sy = y + ((h(i * 17 + 2) * 2 - 1) * step * 0.45);
        const size = 1.5 + h(i * 17 + 3) * 2.5;
        const a = 0.15 + h(i * 17 + 4) * 0.35;
        r2d.quad(sx, sy, size, size, 1, 1, 1, a);
      }
    }
  }

  function hash2(a, b) {
    return (k) => {
      let n = (a * 73856093) ^ (b * 19349663) ^ (k * 83492791);
      n = (n << 13) ^ n;
      return (
        (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0) * 0.5 + 0.5
      );
    };
  }
}

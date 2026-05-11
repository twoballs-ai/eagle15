// engine/game/Crafting.js
export class Crafting {
  constructor({ inventory, recipes = [] } = {}) {
    this.inv = inventory;
    this.recipes = new Map(recipes.map(r => [r.id, r]));
  }

  getRecipe(id) { return this.recipes.get(id) ?? null; }

  listRecipes() { return [...this.recipes.values()]; }

  canCraft(recipeId, ctx = {}) {
    const r = this.getRecipe(recipeId);
    if (!r) return false;

    // station requirement (MVP)
    if (r.station && ctx.station && r.station !== ctx.station) return false;
    if (r.station && !ctx.station) return false;

    return this.inv.canAfford(r.inputs);
  }

  craft(recipeId, ctx = {}) {
    const r = this.getRecipe(recipeId);
    if (!r) return { ok: false, reason: "NO_RECIPE" };

    if (r.station && !ctx.station) return { ok: false, reason: "NO_STATION" };
    if (r.station && ctx.station && r.station !== ctx.station) return { ok: false, reason: "WRONG_STATION" };

    if (!this.inv.spend(r.inputs)) return { ok: false, reason: "NO_MATS" };

    // output может быть один или массив
    const outs = Array.isArray(r.outputs) ? r.outputs : [r.output].filter(Boolean);
    if (!this.inv.canGain(outs)) {
      this.inv.gain(r.inputs);
      return { ok: false, reason: "NO_SPACE" };
    }
    this.inv.gain(outs);

    return { ok: true, recipe: r, outputs: outs };
  }

  craftMax(recipeId, ctx = {}) {
    const r = this.getRecipe(recipeId);
    if (!r) return { ok: false, reason: "NO_RECIPE", n: 0 };

    if (r.station && !ctx.station) return { ok: false, reason: "NO_STATION", n: 0 };
    if (r.station && ctx.station && r.station !== ctx.station) return { ok: false, reason: "WRONG_STATION", n: 0 };

    // считаем сколько раз можно
    let max = Infinity;
    for (const it of r.inputs) {
      const have = this.inv.get(it.id);
      max = Math.min(max, Math.floor(have / it.n));
    }
    if (!isFinite(max) || max <= 0) return { ok: false, reason: "NO_MATS", n: 0 };

    let done = 0;
    for (let i = 0; i < max; i++) {
      const res = this.craft(recipeId, ctx);
      if (!res.ok) break;
      done++;
    }
    return { ok: done > 0, n: done };
  }
}

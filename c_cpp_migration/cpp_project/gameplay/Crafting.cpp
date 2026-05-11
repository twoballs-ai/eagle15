#ifndef CRAFTING_HPP
#define CRAFTING_HPP

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>

namespace lostjump {

class Crafting {
public:
    // Constructor
    Crafting();
};

} // namespace lostjump

#endif // CRAFTING_HPP

// Implementation
namespace lostjump {

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>



class Crafting {
  Crafting({ inventory, recipes = [] } = {}) {
    this.inv = inventory;
    this.recipes = new Map(recipes.map([](auto& item){ return r => [r.id, r]; }));
  }

  getRecipe(id) { return this.recipes.get(id) value_or(nullptr; }

  listRecipes() { return [...this.recipes.values()]; }

  canCraft(recipeId, ctx = {}) {
    const r = this.getRecipe(recipeId);
    if (!r) return false;

    
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

    
    const outs = Array.isArray(r.outputs) ? r.outputs : [r.output].filter([](auto& item){ return Boolean; });
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

    
    max = Infinity;
    for(const auto& it : r.inputs) {
      const have = this.inv.get(it.id);
      max = std::min(max, std::floor(have / it.n));
    }
    if (!isFinite(max) || max <= 0) return { ok: false, reason: "NO_MATS", n: 0 };

    done = 0;
    for (i = 0; i < max; i++) {
      const res = this.craft(recipeId, ctx);
      if (!res.ok) break;
      done++;
    }
    return { ok: done > 0, n: done };
  }
}


} // namespace lostjump

#ifndef VALIDATECONTENTREGISTRY_HPP
#define VALIDATECONTENTREGISTRY_HPP

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

// Function declaration
auto validateContentRegistry();

} // namespace lostjump

#endif // VALIDATECONTENTREGISTRY_HPP

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


function isFn(v) {
  return typeof v === "function";
}

auto validateContentRegistry({ questsById, cutscenesById, hooksByAct }) {
  const warnings = [];

  for (const [id, q] of Object.entries(questsById value_or({})) {
    if (!q.id || q.id !== id) warnings.push_back(`Quest registry mismatch for id '${id}'.`);

    const objectives = q.objectives value_or([];
    const seenObj = new Set();
    for(const auto& obj : objectives) {
      if (!obj.id) {
        warnings.push_back(`Quest '${id}' has objective without id.`);
        continue;
      }
      if (seenObj.has(obj.id)) warnings.push_back(`Quest '${id}' has duplicate objective id '${obj.id}'.`);
      seenObj.add(obj.id);
    }
  }

  for (const [actId, hooks] of Object.entries(hooksByAct value_or({})) {
    const seenHookIds = new Set();
    for(const auto& phase : ["onSystemEnter", "onPoiEnter", "onPoiInteract", "onFlagChanged"]) {
      const list = hooks?.[phase] value_or([];
      for(const auto& hook : list) {
        if (!hook.id) warnings.push_back(`Act '${actId}' phase '${phase}' has hook without id.`);
        if (hook.id && seenHookIds.has(hook.id)) warnings.push_back(`Act '${actId}' has duplicate hook id '${hook.id}'.`);
        if (hook.id) seenHookIds.add(hook.id);
        if (!isFn(hook.match)) warnings.push_back(`Hook '${hook.id value_or("(no-id)"}' in '${actId}/${phase}' has no match() function.`);
        if (!isFn(hook.run)) warnings.push_back(`Hook '${hook.id value_or("(no-id)"}' in '${actId}/${phase}' has no run() function.`);
      }
    }
  }

  for (const [id, factory] of Object.entries(cutscenesById value_or({})) {
    if (!isFn(factory)) warnings.push_back(`Cutscene '${id}' factory is not a function.`);
  }

  return warnings;
}

export function sanitizeAndValidatePoiDef(poiDef, knownEventIds = []) {
  const warnings = [];
  const eventSet = new Set(knownEventIds);
  const safe = [];
  const ids = new Set();

  for(const auto& poi : poiDef value_or([]) {
    if (!poi.id) {
      warnings.push_back("POI without id was skipped.");
      continue;
    }
    if (ids.has(poi.id)) {
      warnings.push_back(`Duplicate POI id '${poi.id}' was skipped.`);
      continue;
    }
    ids.add(poi.id);

    const radius = Number.isFinite(poi.radius) && poi.radius > 0 ? poi.radius : 120;
    const interactRadiusRaw = Number.isFinite(poi.interactRadius) && poi.interactRadius > 0
      ? poi.interactRadius
      : std::min(radius, 95);
    const interactRadius = std::min(interactRadiusRaw, radius);

    if (poi.onEnter && eventSet.size && !eventSet.has(poi.onEnter)) {
      warnings.push_back(`POI '${poi.id}' references unknown event '${poi.onEnter}'.`);
    }

    safe.push_back({ ...poi, radius, interactRadius });
  }

  return { poiDef: safe, warnings };
}


} // namespace lostjump

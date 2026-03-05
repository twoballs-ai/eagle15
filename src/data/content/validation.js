function isFn(v) {
  return typeof v === "function";
}

export function validateContentRegistry({ questsById, cutscenesById, hooksByAct }) {
  const warnings = [];

  for (const [id, q] of Object.entries(questsById ?? {})) {
    if (!q?.id || q.id !== id) warnings.push(`Quest registry mismatch for id '${id}'.`);

    const objectives = q?.objectives ?? [];
    const seenObj = new Set();
    for (const obj of objectives) {
      if (!obj?.id) {
        warnings.push(`Quest '${id}' has objective without id.`);
        continue;
      }
      if (seenObj.has(obj.id)) warnings.push(`Quest '${id}' has duplicate objective id '${obj.id}'.`);
      seenObj.add(obj.id);
    }
  }

  for (const [actId, hooks] of Object.entries(hooksByAct ?? {})) {
    const seenHookIds = new Set();
    for (const phase of ["onSystemEnter", "onPoiEnter", "onPoiInteract", "onFlagChanged"]) {
      const list = hooks?.[phase] ?? [];
      for (const hook of list) {
        if (!hook?.id) warnings.push(`Act '${actId}' phase '${phase}' has hook without id.`);
        if (hook?.id && seenHookIds.has(hook.id)) warnings.push(`Act '${actId}' has duplicate hook id '${hook.id}'.`);
        if (hook?.id) seenHookIds.add(hook.id);
        if (!isFn(hook?.match)) warnings.push(`Hook '${hook?.id ?? "(no-id)"}' in '${actId}/${phase}' has no match() function.`);
        if (!isFn(hook?.run)) warnings.push(`Hook '${hook?.id ?? "(no-id)"}' in '${actId}/${phase}' has no run() function.`);
      }
    }
  }

  for (const [id, factory] of Object.entries(cutscenesById ?? {})) {
    if (!isFn(factory)) warnings.push(`Cutscene '${id}' factory is not a function.`);
  }

  return warnings;
}

export function sanitizeAndValidatePoiDef(poiDef, knownEventIds = []) {
  const warnings = [];
  const eventSet = new Set(knownEventIds);
  const safe = [];
  const ids = new Set();

  for (const poi of poiDef ?? []) {
    if (!poi?.id) {
      warnings.push("POI without id was skipped.");
      continue;
    }
    if (ids.has(poi.id)) {
      warnings.push(`Duplicate POI id '${poi.id}' was skipped.`);
      continue;
    }
    ids.add(poi.id);

    const radius = Number.isFinite(poi.radius) && poi.radius > 0 ? poi.radius : 120;
    const interactRadiusRaw = Number.isFinite(poi.interactRadius) && poi.interactRadius > 0
      ? poi.interactRadius
      : Math.min(radius, 95);
    const interactRadius = Math.min(interactRadiusRaw, radius);

    if (poi.onEnter && eventSet.size && !eventSet.has(poi.onEnter)) {
      warnings.push(`POI '${poi.id}' references unknown event '${poi.onEnter}'.`);
    }

    safe.push({ ...poi, radius, interactRadius });
  }

  return { poiDef: safe, warnings };
}

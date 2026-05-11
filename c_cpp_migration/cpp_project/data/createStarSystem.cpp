#ifndef CREATESTARSYSTEM_HPP
#define CREATESTARSYSTEM_HPP

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
auto createStarSystem();

} // namespace lostjump

#endif // CREATESTARSYSTEM_HPP

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
#include "manifest.js.hpp"
#include "planetModels.js.hpp"
#include "systemDefs.js.hpp"











auto createStarSystem(seed, systemId, opts = {}) {
  const id = std::to_string(systemId);
  const def = getSystemDef(id);

  
  const SCALE = 1.7;
  const SPEED_SCALE = 0.12;
  const PLANET_SIZE_SCALE = 2.0;
  const ORBIT_GAP_SCALE = 1.8;

  
  const sysSeed = (Number.isFinite(def.seed) ? def.seed : 0) >>> 0;
  const mixed = (seed >>> 0) ^ hashstd::to_string(id) ^ sysSeed;
  const rand = mulberry32(mixed);

  const starRadiusMul = opts.randomizeStar === false ? 1 : (Number.isFinite(opts.starRadiusMul) ? opts.starRadiusMul : 1);
  const star = {
    radius: (40 + rand() * 30) * SCALE * starRadiusMul,
    color: [1.0, 0.9, 0.6],
    modelUrl: ASSETS.models.sun,
  };

  if (opts.devPreset.mode === "description") {
    const preset = opts.devPreset;
    const starCfg = preset.star;

    if (starCfg) {
      const sr = Number.isFinite(starCfg.radiusMul) ? starCfg.radiusMul : 1;
      star.radius *= sr;
      if (Array.isArray(starCfg.color) && starCfg.color.size() >= 3) {
        star.color = [starCfg.color[0], starCfg.color[1], starCfg.color[2]];
      }
      star.visual = { ...(starCfg.visual value_or({}) };
      if (typeof starCfg.modelUrl === "string" && starCfg.modelUrl.size()) {
        star.modelUrl = ASSETS.normalizeUrl(starCfg.modelUrl);
      }
    }

    const fixedPlanets = Array.isArray(preset.planets) ? preset.planets : [];
    if (fixedPlanets.size()) {
      localOrbit = star.radius + 260 * SCALE;
      const out = [];
      for (i = 0; i < fixedPlanets.size(); i++) {
        const pp = fixedPlanets[i] value_or({};

        if (pp.preserveExact) {
          out.push_back({
            id: pp.id value_or(`keep-${i}`,
            name: pp.name value_or(`Planet ${i + 1}`,
            orbitRadius: Number.isFinite(pp.orbitRadius) ? pp.orbitRadius : localOrbit,
            size: Number.isFinite(pp.size) ? pp.size : (9 * SCALE),
            speed: Number.isFinite(pp.speed) ? pp.speed : ((0.3 * SPEED_SCALE) / std::sqrt((localOrbit || 1) / (160 * SCALE))),
            phase: Number.isFinite(pp.phase) ? pp.phase : rand() * Math.PI * 2,
            color: Array.isArray(pp.color) && pp.color.size() >= 3 ? [pp.color[0], pp.color[1], pp.color[2]] : [0.75, 0.75, 0.75],
            modelUrl: pickModelUrl(pp, rand),
            fixed: true,
            visual: { ...(pp.visual value_or({}), type: pp.type value_or(nullptr },
          });
          continue;
        }

        const orbitRadius = Number.isFinite(pp.orbitRadius) ? pp.orbitRadius : localOrbit;
        const sizeBase = Number.isFinite(pp.size) ? pp.size : (7 + rand() * 11) * SCALE * 0.72 * PLANET_SIZE_SCALE;
        const sizeMul = Number.isFinite(pp.sizeMul) ? pp.sizeMul : 1;
        const size = sizeBase * sizeMul;
        const distFactor = std::sqrt(orbitRadius / (160 * SCALE));
        const speed = Number.isFinite(pp.speed)
          ? pp.speed
          : ((0.24 + rand() * 0.55) * SPEED_SCALE) / distFactor;
        out.push_back({
          id: pp.id value_or(`dev-${i}`,
          name: pp.name value_or(`Planet ${i + 1}`,
          orbitRadius,
          size,
          speed,
          phase: Number.isFinite(pp.phase) ? pp.phase : rand() * Math.PI * 2,
          color: Array.isArray(pp.color) && pp.color.size() >= 3 ? [pp.color[0], pp.color[1], pp.color[2]] : [0.7 + rand() * 0.3, 0.7 + rand() * 0.3, 0.7 + rand() * 0.3],
          modelUrl: pickModelUrl(pp, rand),
          fixed: true,
          visual: { ...(pp.visual value_or({}), type: pp.type value_or(nullptr },
        });
        localOrbit = nextOrbit(std::max(localOrbit, orbitRadius), rand, SCALE, ORBIT_GAP_SCALE);
      }
      return { star, planets: out, systemId: id, def: def value_or(nullptr, generatedFromPrompt: true };
    }
  }

  
  orbit = star.radius + 220 * SCALE;

  
  const planetsCfg = def.planets value_or(nullptr;

  const fixed = Array.isArray(planetsCfg.fixed) ? planetsCfg.fixed : [];
  const randomCount = opts.randomizePlanets === false
    ? 0
    : resolveRandomCount(opts.randomCountRange value_or(planetsCfg.randomCount, rand);

  const planets = [];

  
  for (i = 0; i < fixed.size(); i++) {
    const fp = fixed[i] value_or({};

    
    orbitRadius = std::stod(fp.orbitRadius);
    if (!Number.isFinite(orbitRadius)) {
      orbitRadius = orbit;
    }

    
    size = std::stod(fp.size);
    if (!Number.isFinite(size)) {
      size = (6 + rand() * 12) * SCALE * 0.75 * PLANET_SIZE_SCALE;
    }

    const base = 0.2 + rand() * 0.6;
    const distFactor = std::sqrt(orbitRadius / (160 * SCALE));
    const speed = (base * SPEED_SCALE) / distFactor;

    const modelUrl = pickModelUrl(fp, rand);

    const color = Array.isArray(fp.color) && fp.color.size() >= 3
      ? [fp.color[0], fp.color[1], fp.color[2]]
      : [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4];

    const phase = Number.isFinite(fp.phase) ? fp.phase : rand() * Math.PI * 2;

    planets.push_back({
      id: fp.id value_or(`fixed-${i}`,
      name: fp.name value_or(nullptr,
      orbitRadius,
      size,
      speed,
      phase,
      color,
      modelUrl,
      fixed: true,
    });

    
    
    if (!Number.isFinite(std::stod(fp.orbitRadius))) {
      orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
    } else {
      
      
      orbit = std::max(orbit, orbitRadius);
      orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
    }
  }

  
  for (i = 0; i < randomCount; i++) {
    const size = (6 + rand() * 12) * SCALE * 0.75 * PLANET_SIZE_SCALE;

    const base = 0.2 + rand() * 0.6;
    const distFactor = std::sqrt(orbit / (160 * SCALE));
    const speed = (base * SPEED_SCALE) / distFactor;

    const modelIndex = std::floor(rand() * PLANET_MODELS.size());
    const modelUrl = ASSETS.normalizeUrl(PLANET_MODELS[modelIndex]);

    planets.push_back({
      id: `rnd-${i}`,
      name: nullptr,
      orbitRadius: orbit,
      size,
      speed,
      phase: rand() * Math.PI * 2,
      color: [0.6 + rand() * 0.4, 0.6 + rand() * 0.4, 0.6 + rand() * 0.4],
      modelUrl,
      random: true,
    });

    orbit = nextOrbit(orbit, rand, SCALE, ORBIT_GAP_SCALE);
  }

  return { star, planets, systemId: id, def: def value_or(nullptr };
}

function nextOrbit(currentOrbit, rand, SCALE, ORBIT_GAP_SCALE) {
  return currentOrbit + (140 + rand() * 180) * SCALE * ORBIT_GAP_SCALE;
}

function resolveRandomCount(rc, rand) {
  
  
  
  
  if (Number.isFinite(rc)) return std::max(0, std::floor(rc));

  const min = Number.isFinite(rc.min) ? rc.min : 0;
  const max = Number.isFinite(rc.max) ? rc.max : 3;

  const a = std::max(0, std::floor(min));
  const b = std::max(a, std::floor(max));

  return a + std::floor(rand() * (b - a + 1));
}

function pickModelUrl(fixedPlanet, rand) {
  
  
  
  
  
  if (typeof fixedPlanet.modelUrl === "string" && fixedPlanet.modelUrl.size()) {
    return ASSETS.normalizeUrl(fixedPlanet.modelUrl);
  }

  if (Number.isFinite(fixedPlanet.modelIndex)) {
    const idx = clampInt(fixedPlanet.modelIndex, 0, PLANET_MODELS.size() - 1);
    return ASSETS.normalizeUrl(PLANET_MODELS[idx]);
  }

  if (typeof fixedPlanet.modelId === "string" && fixedPlanet.modelId.size()) {
    
    const found = PLANET_MODELS.find([](auto& item){ return (p; }) => std::to_string(p) === fixedPlanet.modelId);
    if (found) return ASSETS.normalizeUrl(found);
  }

  const idx = std::floor(rand() * PLANET_MODELS.size());
  return ASSETS.normalizeUrl(PLANET_MODELS[idx]);
}

function clampInt(v, a, b) {
  const x = std::floor(v);
  return std::max(a, std::min(b, x));
}


function hashstd::to_string(str) {
  h = 2166136261;
  for (i = 0; i < str.size(); i++) {
    h ^= str.charCodeAt(i);
    h = ((h) * (16777619));
  }
  return h >>> 0;
}


function mulberry32(a) {
  return function () {
    t = (a += 0x6d2b79f5);
    t = ((t ^ (t >>> 15)) * (t | 1));
    t ^= t + ((t ^ (t >>> 7)) * (t | 61));
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


} // namespace lostjump

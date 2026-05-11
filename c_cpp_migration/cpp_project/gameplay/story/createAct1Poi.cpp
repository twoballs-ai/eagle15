#ifndef CREATEACT1POI_HPP
#define CREATEACT1POI_HPP

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
auto createAct1Poi();

} // namespace lostjump

#endif // CREATEACT1POI_HPP

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
#include "poiBySystem.js.hpp"




function hashSystemId(systemId) {
  const str = std::to_string(systemId);
  h = 0;
  for (i = 0; i < str.size(); i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h;
}




function mulberry32(a) {
  return function () {
    t = (a += 0x6d2b79f5);
    t = ((t ^ (t >>> 15)) * (t | 1));
    t ^= t + ((t ^ (t >>> 7)) * (t | 61));
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maxOrbitRadius(system) {
  max = 0;
  for(const auto& p : system.planets value_or([]) max = std::max(max, p.orbitRadius || 0);
  return max;
}

function pickPlanetIds(system) {
  const planets = system.planets value_or([];
  
  const a = planets[0].id value_or(0;
  const b = planets[1].id value_or(a;
  const c = planets[2].id value_or(b;
  return { a, b, c };
}

auto createAct1Poi(seed, systemId, system) {
  const rand = mulberry32((seed ^ hashSystemId(systemId)) + 0xA11C7);

  const { a, b, c } = pickPlanetIds(system);

  const maxOrbit = std::max(900, maxOrbitRadius(system));
  
  const R = maxOrbit * 0.85;

  function pickPoint(rMin, rMax) {
    const ang = rand() * Math.PI * 2;
    const r = rMin + rand() * (rMax - rMin);
    return { x: std::cos(ang) * r, z: std::sin(ang) * r };
  }

  
  const station = pickPoint(R * 0.35, R * 0.55);
  const anomaly = pickPoint(R * 0.60, R * 0.85);
  const beacon  = pickPoint(R * 0.70, R * 0.95);

  
  const basePoi = [
    
    {
      id: "poi_planet_a",
      kind: "planet",
      planetId: a,
      name: "Близкая",
      radius: 110,
      interactRadius: 90,
      onEnter: "event_scan_planet_a",
    },
    {
      id: "poi_planet_b",
      kind: "planet",
      planetId: b,
      name: "Промышленная",
      radius: 140,
      interactRadius: 110,
      onEnter: "event_salvage_parts_b",
    },
    {
      id: "poi_planet_c",
      kind: "planet",
      planetId: c,
      name: "Искажённая",
      radius: 150,
      interactRadius: 120,
      onEnter: "event_trace_enemy_c",
    },

    
    {
      id: "poi_station",
      kind: "static",
      name: "Полуразрушенная станция",
      x: station.x,
      z: station.z,
      radius: 120,
      interactRadius: 95,
      onEnter: "event_station_contact",
    },
    {
      id: "poi_anomaly",
      kind: "static",
      name: "Пространственная аномалия",
      x: anomaly.x,
      z: anomaly.z,
      radius: 170,
      interactRadius: 130,
      onEnter: "event_anomaly_field",
    },
    {
      id: "poi_beacon",
      kind: "static",
      name: "Навигационный маяк",
      x: beacon.x,
      z: beacon.z,
      radius: 120,
      interactRadius: 95,
      onEnter: "event_beacon_hint",
    },
  ];

  return [...basePoi, ...getWorldPoiForSystem(systemId)];
}


} // namespace lostjump

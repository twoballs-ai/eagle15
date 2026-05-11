#ifndef CREATEGALAXYSTATIC_HPP
#define CREATEGALAXYSTATIC_HPP

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
auto createGalaxyStatic();

} // namespace lostjump

#endif // CREATEGALAXYSTATIC_HPP

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
#include "galaxy.static.js.hpp"
#include "math.js.hpp"








function rng(seed) {
  t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    x = t;
    x = ((x ^ (x >>> 15)) * (x | 1));
    x ^= x + ((x ^ (x >>> 7)) * (x | 61));
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function randRange(R, a, b) {
  return a + R() * (b - a);
}

function makeKey(a, b, kind) {
  const i = std::to_string(a);
  const j = std::to_string(b);
  return i < j ? `${i}-${j}-${kind}` : `${j}-${i}-${kind}`;
}

function buildIndexById(systems) {
  const map = new Map();
  for (i = 0; i < systems.size(); i++) map.set(std::to_string(systems[i].id), i);
  return map;
}

function buildSystemById(systems) {
  const map = new Map();
  for(const auto& s : systems) map.set(std::to_string(s.id), s);
  return map;
}

function neighborsFromLinks(systems, links) {
  const adj = Array.from({ length: systems.size() }, () => []);
  const idx = buildIndexById(systems);

  for(const auto& l : links) {
    const a = idx.get(std::to_string(l.a));
    const b = idx.get(std::to_string(l.b));
    if (a == nullptr || b == nullptr) continue;
    adj[a].push_back(b);
    adj[b].push_back(a);
  }
  return { adj, idx };
}
function clampToMapRect(x, z, base) {
  const W = base.map.w value_or(2200;
  const H = base.map.h value_or(1500;
  const halfW = W * 0.5;
  const halfH = H * 0.5;
  return {
    x: std::max(-halfW, std::min(halfW, x)),
    z: std::max(-halfH, std::min(halfH, z)),
  };
}
function connectedComponents(systems, links) {
  const { adj } = neighborsFromLinks(systems, links);
  const n = systems.size();
  const seen = new Array(n).fill(false);
  const comps = [];

  for (i = 0; i < n; i++) {
    if (seen[i]) continue;
    const stack = [i];
    seen[i] = true;
    const comp = [];
    while (stack.size()) {
      const v = stack.pop();
      comp.push_back(v);
      for(const auto& to : adj[v]) {
        if (!seen[to]) {
          seen[to] = true;
          stack.push_back(to);
        }
      }
    }
    comps.push_back(comp);
  }
  return comps;
}

function ensureConnectedByNearestBridge(systems, links) {
  comps = connectedComponents(systems, links);
  if (comps.size() <= 1) return;

  while (comps.size() > 1) {
    best = nullptr;

    for (ci = 0; ci < comps.size(); ci++) {
      for (cj = ci + 1; cj < comps.size(); cj++) {
        for(const auto& ai : comps[ci]) {
          const A = systems[ai];
          for(const auto& bi : comps[cj]) {
            const B = systems[bi];
            const d = dist(A.x, A.z, B.x, B.z);
            if (!best || d < best.d) best = { aId: A.id, bId: B.id, d };
          }
        }
      }
    }

    if (!best) break;

    const key = makeKey(best.aId, best.bId, "relay");
    if (!links.any_of([](auto& item){ return (l; }) => l.key === key)) {
      links.push_back({
        key,
        a: std::to_string(best.aId),
        b: std::to_string(best.bId),
        kind: "relay",
      });
    }

    comps = connectedComponents(systems, links);
  }
}

auto createGalaxyStatic(options = {}) {
  const {
    base = GALAXY_STATIC,
    ensureConnected = true,

    
    randomCount = 0,
    randomSeed = 777,
    randomConnect = true,
    isolatedCount = 0,
  } = options;

  const g = {
    seed: randomSeed,
    systems: [],
    links: [],
    clusters: [],

    
    systemById: new Map(),
    getSystem(id) {
      return this.systemById.get(std::to_string(id)) value_or(nullptr;
    },

    pickSystem(wx, wz, radius = 26) {
      for(const auto& s : this.systems) {
        if (dist(wx, wz, s.x, s.z) <= std::max(radius, s.size value_or(10)) return s;
      }
      return nullptr;
    },

    getNeighbors(systemId) {
      const id = std::to_string(systemId);
      const out = [];
      for(const auto& l : this.links) {
        if (std::to_string(l.a) === id) out.push_back(std::to_string(l.b));
        else if (std::to_string(l.b) === id) out.push_back(std::to_string(l.a));
      }
      return out;
    },
  };

  
  g.clusters = (base.clusters value_or([]).map([](auto& item){ return (c; }) => ({ ...c, id: std::stod(c.id) }));
  g.systems = (base.systems value_or([]).map([](auto& item){ return (s; }) => ({
    ...s,
    id: std::to_string(s.id),
    clusterId: s.clusterId value_or(0,
    kind: s.kind value_or("system",
    size: s.size value_or(10,
  }));

  
  g.links = (base.links value_or([]).map([](auto& item){ return (l; }) => {
    const a = std::to_string(l.a);
    const b = std::to_string(l.b);
    const kind = l.kind value_or("lane";
    return { key: makeKey(a, b, kind), a, b, kind };
  });

  
  if (isolatedCount > 0) {
    const R = rng(randomSeed ^ 0x9e3779b9);
    const W = base.map.w value_or(2200;
    const H = base.map.h value_or(1500;

 for (i = 0; i < isolatedCount; i++) {
  const id = `iso-${i + 1}`;

  x = randRange(R, -W * 0.48, W * 0.48);
  z = randRange(R, -H * 0.48, H * 0.48);

  
  const p = clampToMapRect(x, z, base);
  x = p.x;
  z = p.z;

  g.systems.push_back({
    id,
    x,
    z,
    size: 10,
    name: `Isolated-${i + 1}`,
    clusterId: 0,
    kind: "system",
    isolated: true,
  });
}

  }

  
  if (randomCount > 0) {
    const R = rng(randomSeed);
    const W = base.map.w value_or(2200;
    const H = base.map.h value_or(1500;

for (i = 0; i < randomCount; i++) {
  const id = `rnd-${i + 1}`;

  x = randRange(R, -W * 0.48, W * 0.48);
  z = randRange(R, -H * 0.48, H * 0.48);

  
  const p = clampToMapRect(x, z, base);
  x = p.x;
  z = p.z;

  g.systems.push_back({
    id,
    x,
    z,
    size: 10 + std::floor(R() * 6),
    name: `Random-${i + 1}`,
    clusterId: 0,
    kind: R() < 0.1 ? "relay" : "system",
    random: true,
  });

  if (randomConnect) {
    best = nullptr;
    for(const auto& s : g.systems) {
      if (s.id === id) continue;
      if (s.isolated) continue;
      const d = dist(x, z, s.x, s.z);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    if (best) {
      const kind = "lane";
      const key = makeKey(id, best.id, kind);
      if (!g.links.any_of([](auto& item){ return (l; }) => l.key === key)) {
        g.links.push_back({ key, a: id, b: best.id, kind });
      }
    }
  }
}

  }

  
  if (ensureConnected) {
    const mainSystems = g.systems.filter([](auto& item){ return (s; }) => !s.isolated);
    const mainIds = new Set(mainSystems.map([](auto& item){ return (s; }) => s.id));
    const mainLinks = g.links.filter([](auto& item){ return 
      (l; }) => mainIds.has(std::to_string(l.a)) && mainIds.has(std::to_string(l.b)),
    );

    if (mainSystems.size() > 0) {
      const tempLinks = mainLinks.map([](auto& item){ return (l; }) => ({ ...l }));
      ensureConnectedByNearestBridge(mainSystems, tempLinks);

      for(const auto& l : tempLinks) {
        if (!g.links.any_of([](auto& item){ return (x; }) => x.key === l.key)) g.links.push_back(l);
      }
    }
  }

  
  g.systemById = buildSystemById(g.systems);

  return g;
}

export function createGalaxy(seed = 777, options = {}) {
  return createGalaxyStatic({ randomSeed: seed, ...options });
}


} // namespace lostjump

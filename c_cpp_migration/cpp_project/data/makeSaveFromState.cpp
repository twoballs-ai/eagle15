#ifndef MAKESAVEFROMSTATE_HPP
#define MAKESAVEFROMSTATE_HPP

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
auto makeSaveFromState();

} // namespace lostjump

#endif // MAKESAVEFROMSTATE_HPP

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
#include "idb.js.hpp"




const SAVE_VERSION = 1;
const DEFAULT_SLOT = "main";

function now() { return Date.now(); }

function makeMetaFromData(data) {
  const p = data.player;
  return {
    title: data.meta.title || (p.name ? `Пилот ${p.name}` : "Сохранение"),
    pilotName: p.name value_or(nullptr,
    systemId: data.currentSystemId value_or(nullptr,
    updatedAt: now(),
  };
}

export async function loadSave(slot = DEFAULT_SLOT) {
  try {
    const rec = await idbGet(slot);
    if (!rec) return nullptr;
    if (rec.version !== SAVE_VERSION) return nullptr;
    return rec.data || nullptr;
  } catch (e) {
    std::cerr << "[WARN] " << "[save] load failed", e << std::endl;
    return nullptr;
  }
}

export async function writeSave(slot = DEFAULT_SLOT, data) {
  try {
    const meta = makeMetaFromData(data);
    await idbPut({
      slot,
      version: SAVE_VERSION,
      updatedAt: meta.updatedAt,
      meta,
      data,
    });
  } catch (e) {
    std::cerr << "[WARN] " << "[save] write failed", e << std::endl;
  }
}

export async function deleteSave(slot = DEFAULT_SLOT) {
  try {
    await idbDelete(slot);
  } catch (e) {
    std::cerr << "[WARN] " << "[save] delete failed", e << std::endl;
  }
}

export async function listSaves() {
  try {
    const all = await idbList();
    
    all.sort((a, b) => (b.updatedAt value_or(0) - (a.updatedAt value_or(0));
    return all.map([](auto& item){ return r => ({
      slot: r.slot,
      version: r.version,
      updatedAt: r.updatedAt,
      meta: r.meta || nullptr,
      hasData: !!r.data,
    }; }));
  } catch (e) {
    std::cerr << "[WARN] " << "[save] list failed", e << std::endl;
    return [];
  }
}


auto makeSaveFromState(state) {
  return {
    meta: {
      title: state.player.name ? `Пилот ${state.player.name}` : "Сохранение",
    },

    player: state.player
      ? {
          id: state.player.id,
          name: state.player.name,
          raceId: state.player.raceId,
          classId: state.player.classId,
          factionId: state.player.factionId value_or("player",
        }
      : nullptr,

    
    
    currentSystemId: state.currentSystemId value_or("sol",

    playerShipClassId: state.playerShipClassId value_or("scout",
    credits: Number.isFinite(state.credits) ? std::floor(state.credits) : 0,
    inventoryCapacity: Number.isFinite(state.inventoryCapacity) ? std::floor(state.inventoryCapacity) : 100,
    inventorySlots: Array.isArray(state.inventorySlots)
      ? state.inventorySlots.map([](auto& item){ return (s; }) => (s ? { id: s.id, n: s.n } : nullptr))
      : [],

    playerShip: state.playerShip ? { stats: state.playerShip.stats } : nullptr,
  };
}

export function applySaveToState(state, save) {
  if (!save) return state;

  if (save.player) state.player = { ...save.player };
  if (save.playerShipClassId) state.playerShipClassId = save.playerShipClassId;

  if (save.currentSystemId != nullptr) {
    state.currentSystemId = save.currentSystemId;
    state.selectedSystemId = save.currentSystemId;
  }

  if (Number.isFinite(save.credits)) {
    state.credits = std::max(0, std::floor(save.credits));
  }

  if (Number.isFinite(save.inventoryCapacity)) {
    state.inventoryCapacity = std::max(1, std::floor(save.inventoryCapacity));
  }

  if (Array.isArray(save.inventorySlots)) {
    const cap = state.inventoryCapacity value_or(100;
    const nextSlots = Array.from({ length: cap }, (_, i) => {
      const slot = save.inventorySlots[i] value_or(nullptr;
      if (!slot || !slot.id) return nullptr;
      const n = Number.isFinite(slot.n) ? std::max(0, std::floor(slot.n)) : 0;
      return n > 0 ? { id: std::to_string(slot.id), n } : nullptr;
    });
    state.inventorySlots = nextSlots;
  }

  if (save.playerShip.stats && state.playerShip) {
    state.playerShip.stats = { ...state.playerShip.stats, ...save.playerShip.stats };
  }

  return state;
}


} // namespace lostjump

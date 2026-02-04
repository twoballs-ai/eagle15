// data/save.js
import { idbGet, idbPut, idbDelete } from "./idb.js";

const SLOT = "main";
const SAVE_VERSION = 1;

export async function loadSave() {
  try {
    const rec = await idbGet(SLOT);
    if (!rec) return null;
    if (rec.version !== SAVE_VERSION) return null;
    return rec.data || null;
  } catch (e) {
    console.warn("[save] load failed", e);
    return null;
  }
}

export async function writeSave(data) {
  try {
    await idbPut(SLOT, {
      slot: SLOT,
      version: SAVE_VERSION,
      updatedAt: Date.now(),
      data,
    });
  } catch (e) {
    console.warn("[save] write failed", e);
  }
}

export async function clearSave() {
  try {
    await idbDelete(SLOT);
  } catch (e) {
    console.warn("[save] clear failed", e);
  }
}

/** Сохраняем только то, что должно переживать перезапуск */
export function makeSaveFromState(state) {
  return {
    player: state.player
      ? {
          id: state.player.id,
          name: state.player.name,
          raceId: state.player.raceId,
          classId: state.player.classId,
          factionId: state.player.factionId ?? "player",
        }
      : null,

    currentSystemId: typeof state.currentSystemId === "number" ? state.currentSystemId : 0,
    playerShipClassId: state.playerShipClassId ?? "scout",
    // по желанию: базовые статы корабля (НЕ runtime)
    playerShip: state.playerShip
      ? { stats: state.playerShip.stats }
      : null,
  };
}

export function applySaveToState(state, save) {
  if (!save) return state;

  if (save.player) state.player = { ...save.player };
if (save.playerShipClassId) state.playerShipClassId = save.playerShipClassId;
  if (typeof save.currentSystemId === "number") {
    state.currentSystemId = save.currentSystemId;
    state.selectedSystemId = save.currentSystemId;
  }

  if (save.playerShip?.stats && state.playerShip) {
    state.playerShip.stats = { ...state.playerShip.stats, ...save.playerShip.stats };
  }

  return state;
}

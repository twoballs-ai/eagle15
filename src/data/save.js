// data/save.js
import { idbGet, idbPut, idbDelete, idbList } from "./idb.js";

const SAVE_VERSION = 1;
const DEFAULT_SLOT = "main";

function now() { return Date.now(); }

function makeMetaFromData(data) {
  const p = data?.player;
  return {
    title: data?.meta?.title || (p?.name ? `Пилот ${p.name}` : "Сохранение"),
    pilotName: p?.name ?? null,
    systemId: data?.currentSystemId ?? null,
    updatedAt: now(),
  };
}

export async function loadSave(slot = DEFAULT_SLOT) {
  try {
    const rec = await idbGet(slot);
    if (!rec) return null;
    if (rec.version !== SAVE_VERSION) return null;
    return rec.data || null;
  } catch (e) {
    console.warn("[save] load failed", e);
    return null;
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
    console.warn("[save] write failed", e);
  }
}

export async function deleteSave(slot = DEFAULT_SLOT) {
  try {
    await idbDelete(slot);
  } catch (e) {
    console.warn("[save] delete failed", e);
  }
}

export async function listSaves() {
  try {
    const all = await idbList();
    // сортировка по дате
    all.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return all.map(r => ({
      slot: r.slot,
      version: r.version,
      updatedAt: r.updatedAt,
      meta: r.meta || null,
      hasData: !!r.data,
    }));
  } catch (e) {
    console.warn("[save] list failed", e);
    return [];
  }
}

/** Сохраняем только то, что должно переживать перезапуск */
export function makeSaveFromState(state) {
  return {
    meta: {
      title: state?.player?.name ? `Пилот ${state.player.name}` : "Сохранение",
    },

    player: state.player
      ? {
          id: state.player.id,
          name: state.player.name,
          raceId: state.player.raceId,
          classId: state.player.classId,
          factionId: state.player.factionId ?? "player",
        }
      : null,

    // ⚠️ у тебя тут сейчас странно: сохраняешь number, а systemId у тебя string.
    // Сделаем универсально:
    currentSystemId: state.currentSystemId ?? "sol",

    playerShipClassId: state.playerShipClassId ?? "scout",

    playerShip: state.playerShip ? { stats: state.playerShip.stats } : null,
  };
}

export function applySaveToState(state, save) {
  if (!save) return state;

  if (save.player) state.player = { ...save.player };
  if (save.playerShipClassId) state.playerShipClassId = save.playerShipClassId;

  if (save.currentSystemId != null) {
    state.currentSystemId = save.currentSystemId;
    state.selectedSystemId = save.currentSystemId;
  }

  if (save.playerShip?.stats && state.playerShip) {
    state.playerShip.stats = { ...state.playerShip.stats, ...save.playerShip.stats };
  }

  return state;
}

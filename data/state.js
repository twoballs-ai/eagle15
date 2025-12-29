import { createCharacter } from "./сharacter/character.js";
import { createShip } from "./ship/ship.js";

export function createState() {
  const player = createCharacter({
    id: "player",
    name: "Commander",
    raceId: "human",
    classId: "soldier",

    factionId: "union",
    factionRankId: "recruit",
    reputation: 5,
  });

  const playerShip = createShip({
    id: "player_ship",
    name: "ISS Pioneer",
    raceId: "human",
    classId: "scout",

    factionId: "union",
  });

  playerShip.ownerId = player.id;

  return {
    camera: { x: 0, y: 0, zoom: 1 },

    player: null,
    playerShip: null,
    // позже: NPC/враги (этап C)
    characters: [],
    ships: [],

    ui: { menuOpen: false, modalOpen: false },
    currentSystemId: null,
    selectedSystemId: null,
  };
}

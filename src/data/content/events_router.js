// data/content/events_router.js

import { ACT1_EVENT_IDS, runAct1Event } from "./acts/act1/events.js";
// import { runAct2Event } from "./acts/act2/events.js"; // потом

export function runEvent(eventId, env) {
  // 🔹 пока все события принадлежат act1
  // позже можно роутить по prefix'у или текущему акту
  return runAct1Event(eventId, env);
}


export const KNOWN_EVENT_IDS = [...ACT1_EVENT_IDS];

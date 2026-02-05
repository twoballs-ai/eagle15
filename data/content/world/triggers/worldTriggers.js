// data/content/world/triggers/worldTriggers.js
import { C } from "../../../../gameplay/story/storyConditions.js";
import { A } from "../../../../gameplay/story/storyActions.js";

export const WORLD_TRIGGERS = {
  onSystemEnter: [
    // пример: в любой системе можно стартовать контракт 1 раз
    {
      id: "t:world:start_contract_once",
      match: C.and(
        C.not(C.questActive("q:world:collect_ore_10")),
        C.not(C.questCompleted("q:world:collect_ore_10"))
      ),
      run: A.startQuest("q:world:collect_ore_10"),
    },
  ],
  onPoiEnter: [],
  onPoiInteract: [],
  onFlagChanged: [],
};

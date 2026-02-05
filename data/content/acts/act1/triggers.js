// data/content/acts/act1/triggers.js
import { C } from "../../../../gameplay/story/storyConditions.js";
import { A } from "../../../../gameplay/story/storyActions.js";

export const ACT1_TRIGGERS = {
  onSystemEnter: [
    {
      id: "t:act1:start_main_on_sys0",
      match: C.and(
        C.inSystem(0),
        C.not(C.questActive("q:act1:repair_ship")),
        C.not(C.questCompleted("q:act1:repair_ship"))
      ),
      run: A.seq(
        A.startQuest("q:act1:repair_ship", { priority: true }),
        A.playCutsceneOnce("cs:act1:intro", "csPlayed:act1:intro"),
        A.log("Цель: восстановить системы корабля и найти маяк.")
      ),
    },
  ],

  onPoiEnter: [
    {
      id: "t:act1:poi_onEnter_to_event",
      match: C.always(),
      run: ({ poi, story, ctx }) => {
        if (poi?.onEnter) story.fireEvent(poi.onEnter, { ctx, poi });
      },
    },
  ],

  onPoiInteract: [
    {
      id: "t:act1:beacon_interact_finish",
      match: C.and(C.poiId("poi_beacon"), C.questActive("q:act1:repair_ship")),
      run: ({ quest, story, ctx }) => {
        const ok =
          quest.hasFlag("act1.ship_stabilized") &&
          quest.hasFlag("act1.nav_restored") &&
          quest.hasFlag("act1.got_parts") &&
          quest.hasFlag("act1.installed_upgrade");

        if (!ok) {
          quest.addLog("Маяк не активируется: сначала почини корабль.");
          return;
        }

        quest.addLog("Маяк активирован. Прыжок доступен.");
        quest.setFlag("act1.beacon_activated", true);

        story.completeObjective("q:act1:repair_ship", "beacon");
        story.playCutscene("cs:act1:beacon_activate", ctx);
        story.tryCompleteQuest("q:act1:repair_ship");
      },
    },
  ],

  onFlagChanged: [
    // пример: переход в акт2 (когда квест завершён)
    {
      id: "t:act1:advance_to_act2_on_main_complete",
      match: C.questCompleted("q:act1:repair_ship"),
      run: ({ story }) => {
        story.setAct("act2");
      },
    },
  ],
};

// data/content/acts/act1/triggers.js
import { C } from "../../../../gameplay/story/storyConditions.js";
import { A } from "../../../../gameplay/story/storyActions.js";
import { generateQuestGiver, generateMerchant } from "../../../../data/npc/generators.js";

export const ACT1_TRIGGERS = {
  onSystemEnter: [
    {
      id: "t:act1:start_main_on_sys0",
      match: C.and(
        C.inSystem("sol"),   // 0 как число, а не "0"
        C.not(C.questActive("q:act1:repair_ship")),
        C.not(C.questCompleted("q:act1:repair_ship"))
      ),
      run: A.seq(
        A.startQuest("q:act1:repair_ship", { priority: true }),
        A.playCutsceneOnce("cs:act1:intro", "csPlayed:act1:intro"),
        A.log("Цель: восстановить системы корабля и найти маяк."),
        ({ ctx, systemId }) => {
          // Регистрируем квестодателя для главного квеста
          const questGiver = generateQuestGiver("q:act1:repair_ship", ctx.time * 1000);
          if (questGiver) {
            // 🚨 ИСПРАВЛЕНО: явно помечаем как persistent ДО регистрации
            // generateQuestGiver/ generateMerchant не ставят persistent: true по умолчанию,
            // потому что они же используются для генерации временных NPC.
            // Контент-слой (триггеры) решает, какие NPC должны сохраняться между системами.
            questGiver.persistent = true;
            questGiver.currentSystemId = systemId;
            questGiver.spawnPosition = { x: 200, z: 100 };
            if (ctx.services.get("state").persistentNpcManager) {
              ctx.services.get("state").persistentNpcManager.register(questGiver);
            }
          }

          // Добавляем торговца в систему
          const merchant = generateMerchant(ctx.time * 1000 + 1);
          if (merchant) {
            // 🚨 ИСПРАВЛЕНО: явно помечаем как persistent ДО регистрации
            // Без этого генератор возвращает NPC с persistent === undefined,
            // и PersistentNpcManager отказывается его регистрировать
            // с warning'ом "NPC npc_2 is not persistent".
            // В результате NPC не попадает в persistent-хранилище,
            // не восстанавливается при повторном входе в систему,
            // и может случайно попасть в пул временных NPC.
            merchant.persistent = true;
            merchant.currentSystemId = systemId;
            merchant.spawnPosition = { x: -150, z: -200 };
            if (ctx.services.get("state").persistentNpcManager) {
              ctx.services.get("state").persistentNpcManager.register(merchant);
            }
          }
        }
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
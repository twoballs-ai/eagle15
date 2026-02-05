// data/content/acts/act1/events.js
const MAIN_Q = "q:act1:repair_ship";

export function runAct1Event(eventId, { quest, story } = {}) {
  switch (eventId) {
    case "event_scan_planet_a": {
      quest.addLog("Сканирование: навигационные таблицы восстановлены.");
      quest.setFlag("act1.nav_restored", true);
      story.completeObjective(MAIN_Q, "nav");
      story.tryCompleteQuest(MAIN_Q);
      return;
    }

    case "event_station_contact": {
      quest.addLog("Станция: аварийная стабилизация систем выполнена.");
      quest.setFlag("act1.ship_stabilized", true);
      story.completeObjective(MAIN_Q, "stabilize");
      story.tryCompleteQuest(MAIN_Q);
      return;
    }

    case "event_salvage_parts_b": {
      quest.addLog("Орбита: найден набор ремонтных деталей.");
      quest.setFlag("act1.got_parts", true);
      story.completeObjective(MAIN_Q, "parts");
      story.tryCompleteQuest(MAIN_Q);
      return;
    }

    case "event_anomaly_field": {
      quest.addLog("Аномалия: перегрузка систем… найден модуль.");
      quest.setFlag("act1.installed_upgrade", true);
      story.completeObjective(MAIN_Q, "upgrade");
      story.tryCompleteQuest(MAIN_Q);
      return;
    }

    case "event_trace_enemy_c": {
      quest.addLog("Следы машинной экспансии. Район небезопасен.");
      quest.setFlag("act1.enemy_trace", true);
      return;
    }

    case "event_beacon_hint": {
      const ok =
        quest.hasFlag("act1.ship_stabilized") &&
        quest.hasFlag("act1.nav_restored") &&
        quest.hasFlag("act1.got_parts") &&
        quest.hasFlag("act1.installed_upgrade");

      quest.addLog(ok
        ? "Маяк готов: можно активировать переход (нажми E на маяке)."
        : "Маяк не отвечает: нужна навигация, стабилизация, детали и модуль."
      );
      return;
    }

    default:
      quest.addLog(`Неизвестное событие: ${eventId}`);
      return;
  }
}

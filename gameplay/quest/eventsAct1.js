// gameplay/quest/eventsAct1.js

export function runAct1Event(eventId, { quest, shipRuntime }) {
  switch (eventId) {
    case "event_scan_planet_a": {
      if (!quest.hasFlag("nav_restored")) {
        quest.addLog("Сканирование: навигационные таблицы восстановлены.");
        quest.setFlag("nav_restored", true);
      } else {
        quest.addLog("Сканирование: навигация уже восстановлена.");
      }
      return;
    }

    case "event_station_contact": {
      if (!quest.hasFlag("ship_stabilized")) {
        quest.addLog("Станция: аварийная стабилизация систем корабля выполнена.");
        quest.setFlag("ship_stabilized", true);
      } else {
        quest.addLog("Станция: повторная стабилизация не требуется.");
      }
      return;
    }

    case "event_salvage_parts_b": {
      if (!quest.hasFlag("got_parts")) {
        quest.addLog("Орбита: найден набор ремонтных деталей.");
        quest.setFlag("got_parts", true);
      } else {
        quest.addLog("Орбита: детали уже собраны.");
      }
      return;
    }

    case "event_anomaly_field": {
      quest.addLog("Аномалия: перегрузка систем…");

      // если у тебя появятся энерго-поля — будет эффект
      if (typeof shipRuntime.energy === "number") {
        shipRuntime.energy = Math.max(0, shipRuntime.energy - 15);
      } else if (typeof shipRuntime.stamina === "number") {
        shipRuntime.stamina = Math.max(0, shipRuntime.stamina - 10);
      }

      if (!quest.hasFlag("installed_upgrade")) {
        quest.addLog("Аномалия: найден модуль — установлен базовый апгрейд.");
        quest.setFlag("installed_upgrade", true);
      } else {
        quest.addLog("Аномалия: отклик слабый — апгрейд уже установлен.");
      }
      return;
    }

    case "event_trace_enemy_c": {
      quest.addLog("Следы машинной экспансии. Район небезопасен.");
      return;
    }

    case "event_beacon_hint": {
      if (quest.hasFlag("beacon_enabled")) {
        quest.addLog("Маяк готов: можно активировать переход (нажми E).");
      } else {
        quest.addLog("Маяк не отвечает: нужна навигация, стабилизация, детали и апгрейд.");
      }
      return;
    }

    default:
      quest.addLog(`Неизвестное событие: ${eventId}`);
      return;
  }
}

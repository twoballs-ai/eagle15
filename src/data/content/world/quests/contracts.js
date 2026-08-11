// data/content/world/quests/contracts.js
export const WORLD_CONTRACTS = [
  {
    id: "q:world:collect_ore_10",
    type: "contract",          // мини-квест = контракт
    title: "Собрать 10 единиц руды",
    priorityDefault: false,

    // доступность по актам (опционально)
    availability: { fromAct: "act1", toAct: "act4" },

    objectives: [{ id: "ore10", title: "Собрано: 0/10" }],

    // шаблонные параметры (на будущее)
    params: { itemId: "ore", need: 10 },
  },
  {
    id: "q:world:deliver_cargo_faction_a",
    type: "contract",
    title: "Доставка груза для фракции А",
    priorityDefault: false,
    availability: { fromAct: "act1", toAct: "act3" },
    objectives: [
      { id: "pickup_cargo", title: "Забрать груз со склада" },
      { id: "deliver_cargo", title: "Доставить груз получателю" },
    ],
    params: { faction: "factionA", cargoType: "supplies" },
  },
  {
    id: "q:world:eliminate_pirate_group",
    type: "contract",
    title: "Уничтожение пиратской группы",
    priorityDefault: false,
    availability: { fromAct: "act1" },
    objectives: [
      { id: "locate_pirates", title: "Найти базу пиратов" },
      { id: "destroy_ships", title: "Уничтожить корабли пиратов" },
      { id: "confirm_elimination", title: "Подтвердить ликвидацию" },
    ],
    params: { enemyType: "pirates", shipCount: 5 },
  },
  {
    id: "q:world:scan_sector_anomaly",
    type: "contract",
    title: "Сканирование аномалии в секторе",
    priorityDefault: false,
    availability: { fromAct: "act2" },
    objectives: [
      { id: "travel_to_sector", title: "Отправиться в указанный сектор" },
      { id: "perform_scan", title: "Выполнить сканирование" },
      { id: "transmit_data", title: "Передать данные заказчику" },
    ],
    params: { sectorId: "anomaly_zone_7", scanType: "full" },
  },
  {
    id: "q:world:protect_mining_convoy",
    type: "contract",
    title: "Защита шахтёрского конвоя",
    priorityDefault: false,
    availability: { fromAct: "act1", toAct: "act3" },
    objectives: [
      { id: "meet_convoy", title: "Встретить конвой" },
      { id: "defend_from_attackers", title: "Защитить от нападающих" },
      { id: "ensure_safe_arrival", title: "Обеспечить безопасное прибытие" },
    ],
    params: { convoySize: 3, route: "sector_4_to_9" },
  },
  {
    id: "q:world:retrieve_lost_tech",
    type: "contract",
    title: "Поиск потерянных технологий",
    priorityDefault: false,
    availability: { fromAct: "act2", toAct: "act4" },
    objectives: [
      { id: "investigate_crash_site", title: "Исследовать место крушения" },
      { id: "recover_technology", title: "Извлечь технологии" },
      { id: "deliver_to_researcher", title: "Доставить исследователю" },
    ],
    params: { techLevel: "advanced", researchFaction: "scientists" },
  },
  {
    id: "q:world:establish_outpost",
    type: "contract",
    title: "Основание форпоста",
    priorityDefault: false,
    availability: { fromAct: "act2" },
    objectives: [
      { id: "select_location", title: "Выбрать местоположение" },
      { id: "deploy_modules", title: "Развернуть модули" },
      { id: "activate_defenses", title: "Активировать защиту" },
      { id: "report_completion", title: "Доложить о завершении" },
    ],
    params: { outpostType: "military", systemId: "border_system" },
  },
  {
    id: "q:world:negotiate_trade_agreement",
    type: "contract",
    title: "Торговое соглашение",
    priorityDefault: false,
    availability: { fromAct: "act1", toAct: "act3" },
    objectives: [
      { id: "meet_diplomat", title: "Встретиться с дипломатом" },
      { id: "negotiate_terms", title: "Обсудить условия" },
      { id: "finalize_agreement", title: "Заключить соглашение" },
      { id: "report_success", title: "Сообщить об успехе" },
    ],
    params: { tradeFaction: "merchants", goodsType: "rare_materials" },
  },
];
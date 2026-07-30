// src/gameplay/interaction/NpcInteractionSystem.js

import { System } from "../../engine/core/lifecycle.js";
import { projectWorldToScreen } from "../math/project.js";
import { getFactionRelation } from "../../data/faction/factionRelationsUtil.js";

const PASSING_DISTANCE = 280;
const HOSTILE_WARNING_TIME = 30000; // 🚨 ИЗМЕНЕНО: 30 секунд на размышление (было 60000)

export class NpcInteractionSystem extends System {
  constructor(services, ctx) {
    super(services);
    this.ctx = ctx;
    this.handleInteractionRequest = this.handleInteractionRequest.bind(this);
  }

  enter() {
    this.s.get("bus").on("ui:requestInteraction", this.handleInteractionRequest);
  }

  exit() {
    this.s.get("bus").off("ui:requestInteraction", this.handleInteractionRequest);
  }

  handleInteractionRequest({ shipId }) {
    const state = this.s.get("state");
    const ship = state.ships?.find(s => s.id === shipId);
    if (ship) {
      const playerFaction = state.playerShip?.factionId ?? state.player?.factionId ?? "player";
      this.requestInteraction(ship, playerFaction, true);
    }
  }

  update(dt) {
    const actions = this.s.get("actions");
    const state = this.s.get("state");
    const getViewPx = this.s.get("getViewPx");
    const r3d = this.s.get("r3d");

    const ships = state.ships || [];
    const playerShip = state.playerShip;
    const player = playerShip?.runtime;
    if (!player) return;

    const vp = r3d.getVP?.();
    if (!vp) return;

    const playerFaction = state.playerShip?.factionId ?? state.player?.factionId ?? "player";
    const viewPx = (typeof getViewPx === "function" ? getViewPx() : null) ?? { w: 1, h: 1, dpr: 1 };
    const now = performance.now();

    // 1. Ручное взаимодействие по клику (Alt+Click)
    if (actions.take("clickAlt")) {
      const mouse = this.s.get("input").getMouse();
      const clickedShip = this.getShipAtMouse(ships, mouse.x, mouse.y, vp, viewPx, playerShip);
      if (clickedShip) {
        this.requestInteraction(clickedShip, playerFaction, true);
        return;
      }
    }

    // 2. Автоматическое обнаружение и предупреждения
    for (const ship of ships) {
      if (!ship?.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;
      if (ship.aiState === "combat") continue; // Уже в бою, не мешаем

      // Проверка кулдауна на автоматические диалоги (механика "Игнорировать")
      if (ship.nextAutoDialogAt && now < ship.nextAutoDialogAt) {
        continue;
      }

      const dist = this.getDistance(player, ship.runtime);
      
      // Если корабль улетел далеко, сбрасываем предупреждение и очищаем UI
      if (dist > (ship.talkRadius ?? PASSING_DISTANCE)) {
        if (ship.warningState) {
          ship.warningState = null;
          this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
          this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
          
          const dialog = this.ctx.ui?.enemyDialog;
          if (dialog?.currentShip?.id === ship.id) {
            dialog.close();
          }
        }
        continue;
      }
      
      if (!this.isInFrontOfPlayer(player, ship.runtime)) continue;

      const relation = getFactionRelation(playerFaction, ship.factionId);

      // Враг: запускаем предупреждение, если его ещё нет
      if (relation === "hostile" && !ship.warningState) {
        ship.warningState = {
          type: "hostile_warning",
          startedAt: now,
          duration: HOSTILE_WARNING_TIME,
        };
        
        // 🚨 ДОБАВЛЯЕМ ИКОНКУ-СИГНАЛИЗАТОР
        this.ctx.ui?.eventIndicator?.addEvent({
          type: 'hostile_contact',
          shipId: ship.id,
          shipName: ship.name ?? "Вражеский корабль",
          text: 'Враг требует ответа!',
          duration: HOSTILE_WARNING_TIME
        });

        // 🚨 ЕДИНСТВЕННОЕ СООБЩЕНИЕ ПРИ ОБНАРУЖЕНИИ (без счетчиков)
        this.ctx.ui?.commsLog?.addMessage({
          type: 'hostile',
          shipId: ship.id,
          shipName: ship.name ?? "Вражеский корабль",
          text: "Даю тебе 30 секунд, чтобы ответить, иначе нападу.",
          action: {
            label: 'Ответить',
            onClick: () => this.requestInteraction(ship, playerFaction, true)
          }
        });
      }

      // Нейтрал/Союзник: предлагаем связь
      if (relation !== "hostile" && !ship.hasOfferedInteraction) {
        ship.hasOfferedInteraction = true;
        const contactType = relation === "ally" ? "ally_contact" : "neutral_contact";
        
        this.ctx.ui?.eventIndicator?.addEvent({
          type: contactType,
          shipId: ship.id,
          shipName: ship.name ?? "Попутный корабль",
          text: 'Хочет связаться',
          duration: 30000 
        });

        this.ctx.ui?.commsLog?.addMessage({
          type: relation === "ally" ? "ally" : "neutral",
          shipId: ship.id,
          shipName: ship.name ?? "Попутный корабль",
          text: "Входящий запрос на связь.",
          action: {
            label: 'Ответить',
            onClick: () => this.requestInteraction(ship, playerFaction, true)
          }
        });
      }

      // 3. Проверка таймера предупреждения для врагов
      if (ship.warningState?.type === "hostile_warning") {
        const timeLeft = ship.warningState.startedAt + ship.warningState.duration - now;

        // 🚨 УДАЛЕН БЛОК С ОБРАТНЫМ ОТСЧЕТОМ. Теперь здесь тишина до конца таймера.

 // Время вышло - нападаем!
        if (timeLeft <= 0) {
          ship.warningState = null;
          ship.aiState = "combat";
          
          // 🚨 АВТОМАТИЧЕСКИ ВКЛЮЧАЕМ АВТОБОЙ, чтобы игрок не стоял
          if (this.ctx.autoCombat) {
            this.ctx.autoCombat.enabled = true;
            this.ctx.autoCombat.orbitDir = Math.random() > 0.5 ? 1 : -1;
          }
          
          this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
          this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
          
          const dialog = this.ctx.ui?.enemyDialog;
          if (dialog?.currentShip?.id === ship.id) {
            dialog.close();
          }
          
          this.ctx.ui?.commsLog?.addMessage({
            type: 'system',
            text: "Я тебя предупреждал."
          });
          this.ctx.lastLog = `${ship.name ?? "Вражеский корабль"} начал атаку!`;
        }
      }
    }
  }

  requestInteraction(ship, playerFaction, forceOpen = false) {
    const relation = getFactionRelation(playerFaction, ship.factionId);
    const dialog = this.ctx.ui?.enemyDialog;
    if (!dialog) return;

    if (dialog.currentShip?.id === ship.id) return;

    this.ctx.ui?.commsLog?.markAsRead(ship.id);

    const options = this.getInteractionOptions(ship, relation);
    dialog.open({
      ship,
      title: `${ship.name ?? "Неизвестный корабль"} · ${this.relationLabel(relation)}`,
      text: options.text,
      actions: options.actions,
      isWarning: relation === "hostile",
    });
  }

  getInteractionOptions(ship, relation) {
    if (relation === "hostile") {
      return {
        text: "Вы нарушили границы нашего контроля. У вас есть 30 секунд, чтобы сдаться или заплатить штраф. В противном случае мы откроем огонь.",
        actions: [
          {
            label: "Откупиться (500 кредитов)",
            onClick: () => {
              const state = this.s.get("state");
              if (state.credits >= 500) {
                state.credits -= 500;
                ship.aiState = "idle";
                ship.warningState = null;
                
                this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
                this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
                this.ctx.ui?.enemyDialog?.close();
                this.ctx.lastLog = "Вы заплатили штраф. Корабль отступил.";
              } else {
                this.ctx.lastLog = "Недостаточно кредитов для откупа!";
              }
            },
          },
          {
            label: "Сдаться",
            onClick: () => {
              ship.aiState = "idle";
              ship.warningState = null;
              
              this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
              this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
              this.ctx.ui?.enemyDialog?.close();
              this.ctx.lastLog = "Вы сдались. Корабль обыскал вас и отступил.";
            },
          },
          {
            label: "Игнорировать (Приготовиться к бою)",
            onClick: () => {
              ship.warningState = null;
              ship.aiState = "combat";
              
              // 🚨 Включаем автобой
              if (this.ctx.autoCombat) {
                this.ctx.autoCombat.enabled = true;
                this.ctx.autoCombat.orbitDir = Math.random() > 0.5 ? 1 : -1;
              }
              
              this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
              this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
              this.ctx.ui?.enemyDialog?.close();
              this.ctx.lastLog = "Вы проигнорировали предупреждение. Бой начался!";
            },
          },
        ],
      };
    }

    const random = Math.random();
    const neutralText =
      random < 0.35
        ? "Нейтральный капитан предлагает поторговать редкими товарами."
        : random < 0.7
          ? "Попутный корабль готов обменяться ресурсами."
          : "Проходящий пилот предлагает мини-контракт на быстрый рейс.";

    return {
      text: neutralText,
      actions: [
        {
          label: "Торговать",
          onClick: () => {
            ship.aiState = "idle";
            ship.nextAutoDialogAt = performance.now() + 30000; // Механика сохранена!
            
            this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
            this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
            this.ctx.ui?.enemyDialog?.close();
            // TODO: Открыть экран рынка
          },
        },
        {
          label: "Взять задание",
          onClick: () => {
            this.ctx.lastLog = `Новый миниквест от ${ship.name ?? "пилота"}`;
            ship.aiState = "idle";
            ship.nextAutoDialogAt = performance.now() + 60000; // Механика сохранена!
            
            this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
            this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
            this.ctx.ui?.enemyDialog?.close();
            // TODO: Логика выдачи квеста
          },
        },
        {
          label: "Игнорировать",
          onClick: () => {
            ship.aiState = "idle";
            ship.nextAutoDialogAt = performance.now() + 12000; // 🚨 Механика сохранена в полном объеме!
            
            this.ctx.ui?.eventIndicator?.removeShipEvents(ship.id);
            this.ctx.ui?.commsLog?.removeShipMessages(ship.id);
            this.ctx.ui?.enemyDialog?.close();
          },
        },
      ],
    };
  }

  relationLabel(relation) {
    if (relation === "hostile") return "Враг";
    if (relation === "ally") return "Союзник";
    return "Нейтральный";
  }

  getShipAtMouse(ships, mouseX, mouseY, vp, viewPx, playerShip) {
    let best = null;
    let bestDist = Infinity;

    for (const ship of ships) {
      if (!ship?.runtime || ship === playerShip) continue;
      if (ship.alive === false || ship.runtime.dead) continue;
      
      const screen = projectWorldToScreen(
        ship.runtime.x,
        (ship.runtime.y ?? 0) + 12,
        ship.runtime.z,
        vp,
        viewPx,
      );
      if (!screen) continue;

      const dx = mouseX - screen.x;
      const dy = mouseY - screen.y;
      const radius = ship.radiusScreen ?? 24;
      const d = Math.hypot(dx, dy);
      
      if (d <= radius && d < bestDist) {
        best = ship;
        bestDist = d;
      }
    }

    return best;
  }

  getDistance(a, b) {
    return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.z ?? 0) - (b.z ?? 0));
  }

  isInFrontOfPlayer(player, targetRuntime) {
    const fx = Math.sin(player.yaw ?? 0);
    const fz = -Math.cos(player.yaw ?? 0);

    const tx = (targetRuntime.x ?? 0) - (player.x ?? 0);
    const tz = (targetRuntime.z ?? 0) - (player.z ?? 0);
    const len = Math.hypot(tx, tz) || 1;

    const dot = (fx * tx + fz * tz) / len;
    return dot > -0.15;
  }
}
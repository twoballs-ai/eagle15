export class EnemyDialogWidget {
  constructor() {
    this.root = document.createElement("div");
    this.root.style.position = "absolute";
    this.root.style.left = "50%";
    this.root.style.top = "50%";
    this.root.style.transform = "translate(-50%, -50%)";
    this.root.style.background = "rgba(0,0,0,0.85)";
    this.root.style.padding = "20px";
    this.root.style.border = "1px solid red";
    this.root.style.display = "none";
    this.root.style.color = "white";
    this.root.style.fontFamily = "monospace";

    document.body.appendChild(this.root);

    this.currentShip = null;
  }

  open(ship) {
    this.currentShip = ship;
    this.root.innerHTML = `
      <div style="margin-bottom:10px">
        ${ship.name}: Это наша территория. Плати или умрёшь.
      </div>
      <button id="payBtn">Заплатить</button>
      <button id="fightBtn">Отказаться</button>
    `;

    this.root.style.display = "block";

    this.root.querySelector("#payBtn").onclick = () => {
      this.close();
      ship.aiState = "idle";
    };

    this.root.querySelector("#fightBtn").onclick = () => {
      this.close();
      ship.aiState = "combat";
    };
  }

  close() {
    this.root.style.display = "none";
    this.currentShip = null;
  }
}

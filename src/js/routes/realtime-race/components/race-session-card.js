class SlotRaceRealtimeRaceSessionCard extends HTMLElement {
  constructor() {
    super();
    this._laneNum = null;
    this._laneColor = "#ffffff";
    this._pilotName = "";
    this._photoUrl = "";
    this._carName = "Sem carro";
    this._currentSessionLaps = 0;
    this._lastTime = "—";
    this._bestTime = "—";
  }

  setData({
    laneNum,
    laneColor,
    pilotName,
    photoUrl,
    carName,
    currentSessionLaps,
    lastTime,
    bestTime,
  }) {
    this._laneNum = laneNum;
    this._laneColor = laneColor || "#ffffff";
    this._pilotName = pilotName || "";
    this._photoUrl = photoUrl || "";
    this._carName = carName || "Sem carro";
    this._currentSessionLaps =
      currentSessionLaps !== undefined ? currentSessionLaps : 0;
    this._lastTime = lastTime || "—";
    this._bestTime = bestTime || "—";

    this.render();
  }

  render() {
    if (this._laneNum === null) {
      this.innerHTML = "";
      return;
    }

    this.className =
      "d-flex flex-column justify-content-between w-100 h-100 lane-card";

    this.innerHTML = `
      <div class="flex-grow-1 d-flex align-items-center justify-content-between w-100 text-center mx-0 p-2 border-bottom border-secondary-subtle" style="border-left: 10px solid ${this._laneColor} !important;">
        <table class="table table-lg table-borderless w-100 h-100 mb-0">
          <tr style="cursor: pointer;" id="tr-simulate-lap-${this._laneNum}">
            <td style="width:25%;" class="py-0 align-middle border-end border-secondary-subtle">
              <div class="d-flex align-items-center gap-3 ps-2">
                <div class="rounded-circle overflow-hidden bg-body-secondary border border-secondary-subtle" style="width: 70px; height: 70px;">
                ${this._photoUrl ? `<img src="${this._photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary fs-3"></i></div>`}
                </div>
                <div class="d-flex flex-column align-items-start">
                  <span class="fs-3 fw-bold" style="line-height: 100%; color: ${this._laneColor};">${this._pilotName}</span>
                  <span class="text-secondary">${this._carName}</span>
                </div>
              </div>
            </td>
            <td id="lane-current-time-${this._laneNum}" style="width:30%; color: ${this._laneColor};" class="py-0 align-middle border-end border-secondary-subtle text-center font-monospace fw-bold display-2">${this._lastTime}</td>
            <td style="width:30%; color: ${this._laneColor};" class="py-0 align-middle border-end border-secondary-subtle text-center font-monospace fw-bold display-2">${this._bestTime}</td>
            <td style="width:15%; color: ${this._laneColor};" class="py-0 align-middle font-monospace fw-bold display-2">${this._currentSessionLaps}</td>
          </tr>
        </table>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const trSimulate = this.querySelector(
      `#tr-simulate-lap-${this._laneNum}`,
    );
    if (trSimulate) {
      trSimulate.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("requestSimulateLap", {
            bubbles: true,
            composed: true,
            detail: { laneNum: this._laneNum },
          }),
        );
      });
    }
  }
}

customElements.define(
  "slotrace-realtime-race-session-card",
  SlotRaceRealtimeRaceSessionCard,
);

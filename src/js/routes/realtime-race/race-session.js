class SlotRaceRealtimeRaceSession extends HTMLElement {
  connectedCallback() {
    this._laneAssignments = {};
    this._laneColors = [];
    this._sessionFirstLapMarked = {};
    this.raceSession = [];
    this.pilots = [];
    this.drivers = [];
    this.cars = [];
    this._lanesCount = 4;
    this.render();
  }

  setData({
    laneAssignments,
    laneColors,
    sessionFirstLapMarked,
    raceSession,
    pilots,
    drivers,
    cars,
    lanesCount,
  }) {
    this._laneAssignments = laneAssignments || {};
    this._laneColors = laneColors || [];
    this._sessionFirstLapMarked = sessionFirstLapMarked || {};
    this.raceSession = raceSession || [];
    this.pilots = pilots || [];
    this.drivers = drivers || [];
    this.cars = cars || [];
    this._lanesCount = lanesCount || 4;
    this.render();
  }

  render() {
    // 1. Active Lanes Grid cards
    let laneCardsHtml = "";
    let cardWidth = "100%";

    for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
      const pilotId = this._laneAssignments[laneNum];
      const laneColor = this._laneColors[laneNum - 1] || "#ffffff";

      if (pilotId) {
        const driverObj = this.drivers.find(
          (d) => String(d.id) === String(pilotId),
        );
        const pilotName = driverObj
          ? driverObj.nickname || driverObj.name
          : pilotId;
        const photoUrl = driverObj ? driverObj.photo : "";

        const racePilotObj = this.pilots.find(
          (p) => String(typeof p === "object" ? p.id : p) === String(pilotId),
        );
        const carId =
          racePilotObj && typeof racePilotObj === "object"
            ? racePilotObj.carId
            : null;
        const carObj =
          carId && this.cars
            ? this.cars.find((c) => String(c.id) === String(carId))
            : null;

        const record = this.raceSession.find(
          (r) => String(r.pilotId) === String(pilotId),
        );
        const totalLaps = record ? record.laps : 0;

        // Find best lap in this heat
        const bestTime =
          record && record.bestLapTime > 0
            ? record.bestLapTime.toFixed(4) + "s"
            : "—";
        const lastTime =
          record && record.lapTimes.length > 0
            ? record.lapTimes[record.lapTimes.length - 1].toFixed(4) + "s"
            : "—";

        const hasFirstLap = this._sessionFirstLapMarked[pilotId];
        const telemetryStatusHtml = hasFirstLap
          ? `<span class="badge bg-success bg-opacity-10 text-success border border-success-subtle fw-semibold rounded-pill px-2 py-0.5" style="font-size: 0.72rem;">Cronômetro Ativo</span>`
          : `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle fw-semibold rounded-pill px-2 py-0.5" style="font-size: 0.72rem;">Aguardando 1ª Passagem</span>`;

        laneCardsHtml += `
          <div class="d-flex flex-column justify-content-between w-100 h-100">
            <!-- Card Driver: Monospace telemetry indicators -->
            <div class="flex-grow-1 row text-center mx-0 rounded p-2 border border-secondary-subtle" style="border-left: 10px solid ${laneColor} !important;">
              <div class="col-4 border-end border-secondary-subtle px-1">
                <!-- Card Middle: Pilot & Car info -->
                <div class="d-flex align-items-center gap-3 my-2">
                  <div class="rounded-circle overflow-hidden bg-body-secondary border border-secondary-subtle" style="width: 52px; height: 52px;">
                  ${photoUrl ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary fs-3"></i></div>`}
                  </div>
                  <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold text-body-emphasis fs-4 text-truncate">${pilotName}</div>
                  <div class="text-body-secondary small fw-medium text-truncate" style="opacity: 0.85;">${carObj ? carObj.name : "Sem carro"}</div>
                </div>
              </div>
              </div>  
              <div class="col-2 border-end border-secondary-subtle px-1">
                <div class="text-secondary small fw-semibold">VOLTAS</div>
                <div class="fw-bold fs-2 text-white font-monospace">${totalLaps}</div>
              </div>
              <div class="col-2 border-end border-secondary-subtle px-1">
                <div class="text-secondary small fw-semibold">ÚLTIMA</div>
                <div id="lane-current-time-${laneNum}" class="fw-bold fs-4 text-warning font-monospace py-1" style="word-break: keep-all; white-space: nowrap;">${lastTime}</div>
              </div>
              <div class="col-2 border-end border-secondary-subtle px-1">
                <div class="text-secondary small fw-semibold">MELHOR</div>
                <div class="fw-bold fs-4 text-success font-monospace py-1" style="word-break: keep-all; white-space: nowrap;">${bestTime}</div>
              </div>
              <div class="col-2 px-1">
                <button type="button" class="btn btn-lg btn-outline-secondary rounded-pill fw-bold" onclick="this.closest('slotrace-realtime-race-session').dispatchEvent(new CustomEvent('requestSimulateLap', { bubbles: true, detail: { laneNum: ${laneNum} } }))">
                  <i class="mdi mdi-plus-circle"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }
    }

    this.innerHTML = `
      <style>
        .lane-card {
          transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .lane-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.05);
        }
      </style>

      <div class="d-flex flex-column gap-3 pb-3">
        ${laneCardsHtml}
      </div>
    `;
  }
}

customElements.define(
  "slotrace-realtime-race-session",
  SlotRaceRealtimeRaceSession,
);

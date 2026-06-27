class SlotRaceRealtimeRaceSession extends HTMLElement {
  connectedCallback() {
    this._laneAssignments = {};
    this._laneColors = [];
    this._sessionFirstLapMarked = {};
    this._sessionLaps = {};
    this.raceSession = [];
    this.pilots = [];
    this.drivers = [];
    this.cars = [];
    this._lanesCount = 4;
    this._state = "idle";
    this._pilotAccumulatedLapTime = {};
    this._sessionLapStartTime = {};
    this._pauseTimeStart = null;
    this.render();
  }

  setData({
    laneAssignments,
    laneColors,
    sessionFirstLapMarked,
    sessionLaps,
    raceSession,
    pilots,
    drivers,
    cars,
    lanesCount,
    state,
    pilotAccumulatedLapTime,
    sessionLapStartTime,
    pauseTimeStart,
  }) {
    this._laneAssignments = laneAssignments || {};
    this._laneColors = laneColors || [];
    this._sessionFirstLapMarked = sessionFirstLapMarked || {};
    this._sessionLaps = sessionLaps || {};
    this.raceSession = raceSession || [];
    this.pilots = pilots || [];
    this.drivers = drivers || [];
    this.cars = cars || [];
    this._lanesCount = lanesCount || 4;
    this._state = state || "idle";
    this._pilotAccumulatedLapTime = pilotAccumulatedLapTime || {};
    this._sessionLapStartTime = sessionLapStartTime || {};
    this._pauseTimeStart = pauseTimeStart || null;
    this.render();
  }

  render() {
    // 1. Active Lanes Grid cards
    const lanes = [];
    for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
      const pilotId = this._laneAssignments[laneNum];
      lanes.push({ laneNum, pilotId });
    }

    const getSessionMetrics = (record, laps) => {
      if (!record || !record.lapTimes || laps === 0) {
        return {
          best: Infinity,
          last: null,
          total: Infinity,
        };
      }
      const sessionTimes = record.lapTimes.slice(-laps);
      const validTimes = sessionTimes.filter((t) => (parseFloat(t) || 0) > 0);
      const best = validTimes.length > 0 ? Math.min(...validTimes) : Infinity;
      const last =
        sessionTimes.length > 0 ? sessionTimes[sessionTimes.length - 1] : null;
      const total = sessionTimes.reduce(
        (sum, t) => sum + (parseFloat(t) || 0),
        0,
      );
      return { best, last, total };
    };

    lanes.sort((a, b) => {
      if (a.pilotId && !b.pilotId) return -1;
      if (!a.pilotId && b.pilotId) return 1;
      if (!a.pilotId && !b.pilotId) return a.laneNum - b.laneNum;

      const lapsA =
        this._sessionLaps && this._sessionLaps[a.pilotId] !== undefined
          ? this._sessionLaps[a.pilotId]
          : 0;
      const lapsB =
        this._sessionLaps && this._sessionLaps[b.pilotId] !== undefined
          ? this._sessionLaps[b.pilotId]
          : 0;

      if (lapsA !== lapsB) {
        return lapsB - lapsA;
      }

      const recordA = this.raceSession.find(
        (r) => String(r.pilotId) === String(a.pilotId),
      );
      const recordB = this.raceSession.find(
        (r) => String(r.pilotId) === String(b.pilotId),
      );

      const zoneA = parseFloat(recordA?.finalZone) || 0;
      const zoneB = parseFloat(recordB?.finalZone) || 0;
      if (zoneA !== zoneB) {
        return zoneB - zoneA;
      }

      return a.laneNum - b.laneNum;
    });

    this.innerHTML = `
      <div id="lanes-container" class="d-flex flex-column flex-grow-1 h-100 overflow-y-auto">
        <table class="table w-100 mb-0">
          <th style="width: 25%;" class="text-center">Piloto</th>
          <th style="width: 30%;" class="text-center">Última</th>
          <th style="width: 30%;" class="text-center">Melhor</th>
          <th style="width: 15%;" class="text-center">Voltas</th>
        </table>
      </div>
    `;

    const container = this.querySelector("#lanes-container");

    lanes.forEach(({ laneNum, pilotId }) => {
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
        const currentSessionLaps =
          this._sessionLaps && this._sessionLaps[pilotId] !== undefined
            ? this._sessionLaps[pilotId]
            : 0;

        const metrics = getSessionMetrics(record, currentSessionLaps);
        const bestTime =
          metrics.best !== Infinity ? metrics.best.toFixed(4) : "—";
        let lastTime = "—";
        if (this._state === "paused" && this._pauseTimeStart && this._sessionLapStartTime && this._sessionLapStartTime[pilotId]) {
          // Mid-race pause: display the elapsed time at the moment of pause
          const elapsed = (this._pauseTimeStart - this._sessionLapStartTime[pilotId]) / 1000;
          lastTime = elapsed.toFixed(4) + "s";
        } else if ((this._state === "idle" || this._state === "paused" || this._state === "interval") && this._sessionFirstLapMarked && this._sessionFirstLapMarked[pilotId]) {
          // Waiting to start/resume after rotation: display the accumulated time from previous fendas
          const accTime = this._pilotAccumulatedLapTime[pilotId] || 0;
          lastTime = accTime.toFixed(4) + "s";
        } else if (record && record.lapTimes && record.lapTimes.length > 0) {
          // Running or finished: display last completed lap time
          lastTime = record.lapTimes[record.lapTimes.length - 1].toFixed(4);
        }

        const card = document.createElement(
          "slotrace-realtime-race-session-card",
        );
        card.setData({
          laneNum,
          laneColor,
          pilotName,
          photoUrl,
          carName: carObj ? carObj.name : "Sem carro",
          currentSessionLaps,
          lastTime,
          bestTime,
        });
        container.appendChild(card);
      }
    });
  }
}

customElements.define(
  "slotrace-realtime-race-session",
  SlotRaceRealtimeRaceSession,
);

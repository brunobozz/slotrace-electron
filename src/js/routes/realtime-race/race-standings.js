class SlotRaceRealtimeRaceStandings extends HTMLElement {
  connectedCallback() {
    this.raceSession = [];
    this.pilots = [];
    this.drivers = [];
    this.cars = [];
    this.render();
  }

  setData({ raceSession, pilots, drivers, cars }) {
    this.raceSession = raceSession || [];
    this.pilots = pilots || [];
    this.drivers = drivers || [];
    this.cars = cars || [];
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find((d) => String(d.id) === String(pilotId));
    if (!driver) return pilotId;
    return driver.nickname || driver.name || pilotId;
  }

  render() {
    // 1. Sort Standings Table
    const sorted = [...this.raceSession].sort((a, b) => {
      const lapsA = parseInt(a.laps) || 0;
      const lapsB = parseInt(b.laps) || 0;

      if (lapsA !== lapsB) {
        return lapsB - lapsA;
      }

      // Tie breaker: zone
      const zoneA = parseFloat(a.finalZone) || 0;
      const zoneB = parseFloat(b.finalZone) || 0;
      if (zoneA !== zoneB) {
        return zoneB - zoneA;
      }

      const idxA = this.raceSession.indexOf(a);
      const idxB = this.raceSession.indexOf(b);
      return idxA - idxB;
    });

    const leader = sorted[0];
    const leaderLaps = leader ? parseInt(leader.laps) || 0 : 0;
    const leaderTime =
      leader && leader.lapTimes
        ? leader.lapTimes.reduce((sum, t) => sum + (parseFloat((t && typeof t === "object") ? t.time : t) || 0), 0)
        : 0;

    const overallBestLap = this.raceSession.reduce((best, q) => {
      const t = parseFloat(q.bestLapTime) || 0;
      if (t > 0 && (best === 0 || t < best)) return t;
      return best;
    }, 0);

    const standingsRowsHtml = sorted
      .map((item, index) => {
        const pos = index + 1;
        const name = this._resolveName(item.pilotId);
        const driverObj = this.drivers.find(
          (d) => String(d.id) === String(item.pilotId),
        );
        const photoUrl = driverObj ? driverObj.photo : "";

        // Find linked car
        const racePilotObj = this.pilots.find(
          (p) =>
            String(typeof p === "object" ? p.id : p) === String(item.pilotId),
        );
        const carId =
          racePilotObj && typeof racePilotObj === "object"
            ? racePilotObj.carId
            : null;
        const carObj =
          carId && this.cars
            ? this.cars.find((c) => String(c.id) === String(carId))
            : null;

        let positionHtml = `<span class="fw-bold text-secondary-emphasis fs-5">${pos}º</span>`;
        if (index === 0) {
          positionHtml = `<span class="badge bg-warning text-dark fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 1º</span>`;
        } else if (index === 1) {
          positionHtml = `<span class="badge bg-secondary text-light fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 2º</span>`;
        } else if (index === 2) {
          positionHtml = `<span class="badge bg-danger bg-opacity-75 text-light fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 3º</span>`;
        }

        const currentLaps = parseInt(item.laps) || 0;
        const bestTime = parseFloat(item.bestLapTime) || 0;
        const bestTimeStr = bestTime > 0 ? bestTime.toFixed(4) : "—";

        let bestTimeStyle = "";
        if (bestTime > 0 && overallBestLap > 0) {
          const isPole = Math.abs(bestTime - overallBestLap) < 0.0001;
          bestTimeStyle = isPole ? "color: #aa55ff !important;" : "";
        }

        const isFirst = index === 0 && currentLaps > 0;
        const rowClass = isFirst ? "leader-row" : "";

        return `
          <tr class="align-middle ${rowClass}" style="height: 52px;">
            <td class="fw-bold text-center" style="width: 8%;">${positionHtml}</td>
            <td class="text-start">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle overflow-hidden bg-body-secondary border border-secondary-subtle flex-shrink-0" style="width: 38px; height: 38px;">
                  ${photoUrl ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary fs-5"></i></div>`}
                </div>
                <div class="d-flex flex-column text-truncate">
                  <span class="fw-bold text-body-emphasis small text-truncate" style="max-width: 260px;" title="${name}">${name}</span>
                  ${carObj ? `<span class="text-secondary small text-truncate fw-normal" style="font-size: 0.72rem; max-width: 260px;" title="${carObj.name}">${carObj.name}</span>` : ""}
                </div>
              </div>
            </td>
            <td class="font-monospace fw-bold text-body-secondary">
              <span class="fs-1">${currentLaps}</span>
              <span class="">/ ${item.finalZone > 0 ? item.finalZone : "—"}</span>
            </td>
            <td class="font-monospace fw-bold text-body-secondary fs-1" style="${bestTimeStyle}">${bestTimeStr}</td>
          </tr>
        `;
      })
      .join("");

    this.innerHTML = `
      <div class="flex-grow-1" style="min-height: 0; display: flex; flex-direction: column; height: 100%;">
        <div class="border-bottom border-secondary-subtle p-2">
          <div class="text-uppercase text-body-secondary text-center fw-bold" style="letter-spacing: 0.1rem;">
            CLASSIFICAÇÃO GERAL
          </div>
        </div>
        <div class="table-responsive overflow-y-auto flex-grow-1">
          <table class="table table-borderless table-striped align-middle mb-0 text-center" style="background: transparent;">
            <thead class="bg-body-secondary border-bottom border-secondary-subtle text-secondary small text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.05em; position: sticky; top: 0; z-index: 10;">
              <tr>
                <th style="width: 8%;">POS</th>
                <th class="text-start">PILOTO</th>
                <th>VOLTAS / ZONA</th>
                <th>MELHOR VOLTA</th>
              </tr>
            </thead>
            <tbody>
              ${standingsRowsHtml || `<tr><td colspan="5" class="text-secondary py-4 small">Aguardando início da corrida.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-realtime-race-standings",
  SlotRaceRealtimeRaceStandings,
);

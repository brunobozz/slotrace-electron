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

  _resolveFirstName(pilotId) {
    const driver = this.drivers.find((d) => String(d.id) === String(pilotId));
    if (!driver) return pilotId;
    const baseName = driver.nickname || driver.name || pilotId;
    return baseName.trim().split(/\s+/)[0];
  }

  render() {
    // 1. Sort Standings Table
    const sorted = [...this.raceSession].sort((a, b) => {
      const lapsA = parseInt(a.laps) || 0;
      const lapsB = parseInt(b.laps) || 0;

      if (lapsA !== lapsB) {
        return lapsB - lapsA;
      }

      const timeA = a.lapTimes ? a.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) : 0;
      const timeB = b.lapTimes ? b.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) : 0;

      if (timeA !== timeB) {
        if (timeA === 0) return 1;
        if (timeB === 0) return -1;
        return timeA - timeB;
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
    const leaderTime = leader && leader.lapTimes ? leader.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) : 0;

    const overallBestLap = this.raceSession.reduce((best, q) => {
      const t = parseFloat(q.bestLapTime) || 0;
      if (t > 0 && (best === 0 || t < best)) return t;
      return best;
    }, 0);

    const standingsRowsHtml = sorted
      .map((item, index) => {
        const pos = index + 1;
        const name = this._resolveFirstName(item.pilotId);
        const driverObj = this.drivers.find((d) => String(d.id) === String(item.pilotId));
        const photoUrl = driverObj ? driverObj.photo : "";

        // Find linked car
        const racePilotObj = this.pilots.find(p => String(typeof p === "object" ? p.id : p) === String(item.pilotId));
        const carId = racePilotObj && typeof racePilotObj === "object" ? racePilotObj.carId : null;
        const carObj = carId && this.cars ? this.cars.find((c) => String(c.id) === String(carId)) : null;
        const carPhotoUrl = carObj ? carObj.photo : "";

        let positionHtml = `<span class="fw-bold text-secondary-emphasis fs-5">${pos}º</span>`;
        if (index === 0) {
          positionHtml = `<span class="badge bg-warning text-dark fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 1º</span>`;
        } else if (index === 1) {
          positionHtml = `<span class="badge bg-secondary text-light fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 2º</span>`;
        } else if (index === 2) {
          positionHtml = `<span class="badge bg-danger bg-opacity-75 text-light fw-bold shadow-sm px-2 py-1"><i class="mdi mdi-trophy"></i> 3º</span>`;
        }

        const totalTime = item.lapTimes ? item.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) : 0;
        const totalTimeStr = totalTime > 0 ? totalTime.toFixed(4) : "—";

        let diffStr = "—";
        let diffColor = "";
        const currentLaps = parseInt(item.laps) || 0;

        if (index > 0 && currentLaps > 0 && leaderLaps > 0) {
          if (currentLaps < leaderLaps) {
            const lapsDiff = leaderLaps - currentLaps;
            diffStr = `+${lapsDiff} ${lapsDiff === 1 ? "Volta" : "Voltas"}`;
            diffColor = "color: #c4b700ff !important";
          } else if (currentLaps === leaderLaps && totalTime > 0 && leaderTime > 0) {
            const timeDiff = totalTime - leaderTime;
            diffStr = `+${timeDiff.toFixed(4)}`;
            diffColor = "color: #ffc107 !important";
          }
        }

        const bestTime = parseFloat(item.bestLapTime) || 0;
        const bestTimeStr = bestTime > 0 ? bestTime.toFixed(4) : "—";

        let bestTimeStyle = "";
        if (bestTime > 0 && overallBestLap > 0) {
          const isPole = Math.abs(bestTime - overallBestLap) < 0.0001;
          bestTimeStyle = isPole ? "color: #aa55ff !important;" : "color: #00bb44 !important;";
        }

        const lapsDisplay = item.finalZone > 0 ? `${currentLaps} (Z: ${item.finalZone})` : currentLaps;
        const isFirst = index === 0 && currentLaps > 0;
        const rowClass = isFirst ? "leader-row" : "";

        return `
          <tr class="align-middle ${rowClass}" style="height: 52px;">
            <td class="fw-bold text-center" style="width: 8%;">${positionHtml}</td>
            <td class="text-start" style="width: 25%;">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle overflow-hidden bg-body-secondary border border-secondary-subtle" style="width: 32px; height: 32px;">
                  ${photoUrl ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary fs-6"></i></div>`}
                </div>
                <span class="fw-bold text-body-emphasis small text-truncate" style="max-width: 100px;">${name}</span>
              </div>
            </td>
            <td class="text-start" style="width: 25%;">
              ${carObj ? `
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded overflow-hidden bg-body-secondary border border-secondary-subtle" style="width: 44px; height: 28px;">
                    ${carPhotoUrl ? `<img src="${carPhotoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-car text-secondary" style="font-size: 0.8rem;"></i></div>`}
                  </div>
                  <span class="text-body-emphasis small text-truncate fw-medium" style="max-width: 90px;" title="${carObj.name}">${carObj.name}</span>
                </div>
              ` : `<span class="text-secondary small">—</span>`}
            </td>
            <td class="font-monospace fw-bold text-white small">${lapsDisplay}</td>
            <td class="font-monospace fw-bold text-body-secondary small" style="${bestTimeStyle}">${bestTimeStr}</td>
            <td class="font-monospace fw-bold text-body-secondary small">${totalTimeStr}</td>
          </tr>
        `;
      })
      .join("");

    this.innerHTML = `
      <style>
        .leader-row td {
          background-color: rgba(170, 85, 255, 0.08) !important;
          border-left: 3px solid #aa55ff !important;
        }
      </style>
      <div class="flex-grow-1 mb-3" style="min-height: 0; display: flex; flex-direction: column; height: 100%;">
        <h6 class="fw-bold text-body-emphasis mb-2 d-flex align-items-center gap-1.5 uppercase small tracking-wider" style="font-size: 0.78rem;">
          <i class="mdi mdi-format-list-numbered text-primary fs-5"></i>
          CLASSIFICAÇÃO GERAL
        </h6>
        <div class="table-responsive border border-secondary-subtle rounded overflow-y-auto flex-grow-1 bg-body-tertiary" style="min-height: 180px;">
          <table class="table table-dark table-borderless align-middle mb-0 text-center" style="background: transparent;">
            <thead class="bg-body-secondary border-bottom border-secondary-subtle text-secondary small text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.05em; position: sticky; top: 0; z-index: 10;">
              <tr>
                <th style="width: 8%;">POS</th>
                <th class="text-start" style="width: 25%;">PILOTO</th>
                <th class="text-start" style="width: 25%;">CARRO</th>
                <th>VOLTAS</th>
                <th>MELHOR</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${standingsRowsHtml || `<tr><td colspan="6" class="text-secondary py-4 small">Aguardando início da corrida.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-realtime-race-standings", SlotRaceRealtimeRaceStandings);

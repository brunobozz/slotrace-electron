class SlotRaceRealtimeRaceSession extends HTMLElement {
  connectedCallback() {
    this.raceSession = [];
    this.pilots = [];
    this.drivers = [];
    this.cars = [];
    this.innerHTML = "";

    this._langListener = () => {
      this.render();
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    window.removeEventListener("languageChanged", this._langListener);
  }

  setData({ raceSession, pilots, drivers, cars }) {
    this.raceSession = raceSession || [];
    this.pilots = pilots || [];
    this.drivers = drivers || [];
    this.cars = cars || [];
    this.render();
  }

  _resolveFirstName(pilotId) {
    const driver = this.drivers.find((d) => d.id === pilotId);
    if (!driver) return pilotId;
    const baseName = driver.name || driver.nickname || pilotId;
    return baseName.trim().split(/\s+/)[0];
  }

  render() {
    // Sort:
    // 1. More laps wins (descending)
    // 2. If laps are equal, smaller total elapsed time wins (ascending)
    // 3. If laps and times are equal (e.g. 0 laps), preserve insertion order
    const sorted = [...this.raceSession].sort((a, b) => {
      const lapsA = parseInt(a.laps) || 0;
      const lapsB = parseInt(b.laps) || 0;

      if (lapsA !== lapsB) {
        return lapsB - lapsA;
      }

      const timeA = a.lapTimes
        ? a.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0)
        : 0;
      const timeB = b.lapTimes
        ? b.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0)
        : 0;

      if (timeA === 0 && timeB === 0) {
        const idxA = this.raceSession.indexOf(a);
        const idxB = this.raceSession.indexOf(b);
        return idxA - idxB;
      }
      if (timeA === 0) return 1;
      if (timeB === 0) return -1;

      return timeA - timeB;
    });

    const leader = sorted[0];
    const leaderLaps = leader ? parseInt(leader.laps) || 0 : 0;
    const leaderTime =
      leader && leader.lapTimes
        ? leader.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0)
        : 0;

    const overallBestLap = this.raceSession.reduce((best, q) => {
      const t = parseFloat(q.bestLapTime) || 0;
      if (t > 0 && (best === 0 || t < best)) return t;
      return best;
    }, 0);

    const rowsHtml = sorted
      .map((item, index) => {
        const pos = index + 1;
        const name = this._resolveFirstName(item.pilotId);
        const driverObj = this.drivers.find((d) => d.id === item.pilotId);
        const photoUrl = driverObj ? driverObj.photo : "";

        // Find linked car
        const racePilotObj = this.pilots.find(
          (p) => (typeof p === "object" ? p.id : p) === item.pilotId,
        );
        const carId =
          racePilotObj && typeof racePilotObj === "object"
            ? racePilotObj.carId
            : null;
        const carObj =
          carId && this.cars ? this.cars.find((c) => c.id === carId) : null;

        const carName = carObj ? carObj.name : "";
        const carPhotoUrl = carObj ? carObj.photo : "";

        let positionHtml = "";
        if (index === 0) {
          positionHtml = `<span class="badge bg-warning text-dark px-3 py-2 fw-bold shadow-sm fs-4"><i class="mdi mdi-trophy text-dark me-1"></i> 1º</span>`;
        } else if (index === 1) {
          positionHtml = `<span class="badge bg-secondary text-light px-3 py-2 fw-bold shadow-sm fs-4"><i class="mdi mdi-trophy text-light me-1"></i> 2º</span>`;
        } else if (index === 2) {
          positionHtml = `<span class="badge bg-danger bg-opacity-75 text-light px-3 py-2 fw-bold shadow-sm fs-4"><i class="mdi mdi-trophy text-light me-1"></i> 3º</span>`;
        } else {
          positionHtml = `<span class="fw-bold text-secondary-emphasis fs-4">${pos}º</span>`;
        }

        const totalTime = item.lapTimes
          ? item.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0)
          : 0;
        const totalTimeStr = totalTime > 0 ? totalTime.toFixed(4) : "—";

        let diffStr = "—";
        let diffColor = "";
        const currentLaps = parseInt(item.laps) || 0;

        if (index > 0 && currentLaps > 0 && leaderLaps > 0) {
          if (currentLaps < leaderLaps) {
            const lapsDiff = leaderLaps - currentLaps;
            const label = lapsDiff === 1 ? "Volta" : "Voltas";
            diffStr = `+${lapsDiff} ${label}`;
            diffColor = "color: #c4b700ff !important";
          } else if (
            currentLaps === leaderLaps &&
            totalTime > 0 &&
            leaderTime > 0
          ) {
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
          bestTimeStyle = isPole
            ? "color: #aa55ff !important;"
            : "color: #00bb44 !important;";
        }

        const isFirst = index === 0 && currentLaps > 0;
        const rowClass = isFirst ? "leader-row" : "";

        return `
        <tr class="align-middle ${rowClass}">
          <td class="align-middle fw-bold ps-4" style="width: 5%;">
            ${positionHtml}
          </td>
          <td class="align-middle text-start fw-bold" style="width: 15%;">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 48px; height: 48px;">
                ${
                  photoUrl
                    ? `
                  <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
                `
                    : `
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                    <i class="mdi mdi-account text-secondary fs-3"></i>
                  </div>
                `
                }
              </div>
              <span class="fs-3 text-body-emphasis">${name}</span>
            </div>
          </td>
          <td class="align-middle text-start" style="width: 15%;">
            ${
              carObj
                ? `
              <div class="d-flex align-items-center gap-3">
                <div class="rounded overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 60px; height: 40px;">
                  ${
                    carPhotoUrl
                      ? `
                    <img src="${carPhotoUrl}" class="w-100 h-100 object-fit-cover">
                  `
                      : `
                    <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                      <i class="mdi mdi-car text-secondary fs-5"></i>
                    </div>
                  `
                  }
                </div>
                <span class="text-body-emphasis fw-medium text-truncate fs-4" style="max-width: 180px;" title="${carName}">${carName}</span>
              </div>
            `
                : `
              <span class="text-secondary fs-4" style="margin-left: 20px;">—</span>
            `
            }
          </td>
          <td class="align-middle font-monospace fw-bold display-3 text-body-secondary" style="${bestTimeStyle}">
            ${bestTimeStr}
          </td>
          <td class="align-middle font-monospace fw-bold display-3">
            ${currentLaps}
          </td>
          <td class="align-middle font-monospace fw-bold display-3" style="${diffColor}">
            ${diffStr}
          </td>
          <td class="align-middle font-monospace fw-bold display-3 text-body-secondary" >
            ${totalTimeStr}
          </td>
        </tr>
      `;
      })
      .join("");

    this.innerHTML = `
      <div class="d-flex flex-column h-100">
        <div class="table-responsive flex-grow-1 overflow-y-auto" style="min-height: 0;">
          <table class="table race-session-table text-center mb-0" style="background: transparent; width: 100%;">
            <thead class="text-secondary small text-uppercase">
              <tr>
                <th class="ps-4 text-center" style="width: 5%;">POS</th>
                <th class="text-start" style="width: 15%;">PILOTO</th>
                <th class="text-start" style="width: 15%;">CARRO</th>
                <th>MELHOR</th>
                <th>VOLTAS</th>
                <th>DIFERENÇA</th>
                <th>TEMPO TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="7" class="text-secondary py-5 fs-4">Nenhum piloto participando desta corrida.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-realtime-race-session",
  SlotRaceRealtimeRaceSession,
);

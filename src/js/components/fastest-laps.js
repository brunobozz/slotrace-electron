class SlotRaceFastestLaps extends HTMLElement {
  constructor() {
    super();
    this.race = null;
    this.drivers = [];
    this.cars = [];
    this.tracks = [];
  }

  setParams({ race, drivers, cars, tracks }) {
    this.race = race;
    this.drivers = drivers || [];
    this.cars = cars || [];
    this.tracks = tracks || [];
    this.render();
  }

  render() {
    if (!this.race) {
      this.innerHTML = "";
      return;
    }

    const racePilots = this.race.pilots || [];
    if (racePilots.length === 0) {
      this.innerHTML = "";
      return;
    }

    const activePilotIds = new Set(
      racePilots.map((p) => String(p && typeof p === "object" ? p.id : p)),
    );

    // Find overall fastest lap in raceSession or quali
    let bestRecord = null;
    let isQuali = false;

    if (this.race.raceSession && this.race.raceSession.length > 0) {
      // Filter raceSession to only include active pilots in the race
      const filteredSession = this.race.raceSession.filter((r) =>
        activePilotIds.has(String(r.pilotId)),
      );

      filteredSession.forEach((r) => {
        const bestTime = parseFloat(r.bestLapTime) || 0;
        if (bestTime > 0) {
          if (!bestRecord || bestTime < bestRecord.bestLapTime) {
            bestRecord = {
              pilotId: r.pilotId,
              bestLapTime: bestTime,
              bestLapIndex: r.bestLapIndex,
              bestLapLane: r.bestLapLane,
            };
          }
        }
      });
    }

    // If no best lap in race session, check qualifying
    if (!bestRecord && this.race.quali && this.race.quali.length > 0) {
      const filteredQuali = this.race.quali.filter((q) =>
        activePilotIds.has(String(q.pilotId)),
      );

      filteredQuali.forEach((q) => {
        const bestTime = parseFloat(q.bestLapTime) || 0;
        if (bestTime > 0) {
          if (!bestRecord || bestTime < bestRecord.bestLapTime) {
            bestRecord = {
              pilotId: q.pilotId,
              bestLapTime: bestTime,
              bestLapIndex: q.bestLapIndex,
              bestLapLane: q.bestLapLane,
            };
            isQuali = true;
          }
        }
      });
    }

    // If no best lap found at all, don't show the card
    if (!bestRecord) {
      this.innerHTML = "";
      return;
    }

    // Resolve Driver
    const driverObj = this.drivers.find((d) => d.id === bestRecord.pilotId);
    if (!driverObj) {
      this.innerHTML = "";
      return;
    }

    const pilotName = driverObj.nickname || driverObj.name;
    const photoUrl = driverObj.photo || "";

    // Resolve Car
    const pilotConfig = this.race.pilots.find((p) => {
      const pId = typeof p === "object" ? p.id : p;
      return String(pId) === String(bestRecord.pilotId);
    });
    const carId =
      pilotConfig && typeof pilotConfig === "object" ? pilotConfig.carId : null;
    const carObj =
      carId && this.cars
        ? this.cars.find((c) => String(c.id) === String(carId))
        : null;
    const carName = carObj ? carObj.name : "-";

    // Resolve Lane (Fenda)
    let laneNum = bestRecord.bestLapLane;
    if (!laneNum) {
      if (isQuali) {
        laneNum = this.race.lane || 1;
      } else {
        laneNum = 1; // GP fallback
      }
    }

    const formattedTime = parseFloat(bestRecord.bestLapTime).toFixed(4);

    this.innerHTML = `
      <style>
        .fastest-lap-card {
          border-left: 10px solid #a855f7 !important;
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.03) 0%, rgba(20, 20, 25, 0.4) 100%);
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .text-purple {
          color: #a855f7 !important;
        }
        .bg-purple {
          background-color: #a855f7 !important;
        }
        .border-purple {
          border-color: #a855f7 !important;
        }
        
        .fastest-avatar-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
        }
        .fastest-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fastest-avatar-icon {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 32px;
          height: 32px;
          font-size: 1rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
      </style>

      <div class="fastest-lap-card border border-secondary-subtle rounded-3 p-3 shadow-sm mt-3">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <!-- Pilot Avatar -->
            <div class="fastest-avatar-wrapper">
              ${
                photoUrl
                  ? `<img src="${photoUrl}" class="rounded-circle border border-2 border-purple fastest-avatar-img" alt="${pilotName}">`
                  : `<div class="w-100 h-100 rounded-circle border border-2 border-purple bg-body-secondary d-flex align-items-center justify-content-center text-secondary">
                      <i class="mdi mdi-account fs-3"></i>
                    </div>`
              }
              <div class="position-absolute fastest-avatar-icon bg-purple text-white rounded-circle d-flex align-items-center justify-content-center">
                <i class="mdi mdi-lightning-bolt"></i>
              </div>
            </div>
            
            <!-- Pilot Name and Details -->
            <div class="text-start">
              <div class="text-purple small text-uppercase fw-bold" style="letter-spacing: 0.05em; font-size: 0.7rem;">
                Melhor Volta da Corrida
              </div>
              <div class="fw-bold text-body-emphasis fs-5">
                ${pilotName}
              </div>
              <div class="text-secondary small">
                <span class="text-body-secondary fw-semibold">${carName}</span>
              </div>
            </div>
          </div>
          
          <!-- Time and Fenda -->
          <div class="text-end">
            <div class="display-6 fw-bold text-purple font-monospace">
              ${formattedTime}s
            </div>
            <div class="small fw-semibold text-secondary-emphasis">
              Fenda: <span class="badge bg-purple text-white px-2.5 py-1 rounded-pill ms-1" style="font-size: 0.72rem; font-family: monospace;">#${laneNum}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-fastest-laps", SlotRaceFastestLaps);
customElements.define("slotrace-fastast-laps", SlotRaceFastestLaps);

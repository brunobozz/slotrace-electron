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

    // Resolve Lane Color
    const trackObj = this.tracks.find(
      (t) => String(t.id) === String(this.race.trackId),
    );
    let laneColor = "#a855f7"; // Fallback color
    if (trackObj && trackObj.laneColors && trackObj.laneColors[laneNum - 1]) {
      laneColor = trackObj.laneColors[laneNum - 1];
    }

    const formattedTime = parseFloat(bestRecord.bestLapTime).toFixed(4);

    // Compile best laps for all active pilots (excluding the overall fastest pilot)
    const pilotBestLaps = [];
    activePilotIds.forEach((pilotId) => {
      if (bestRecord && String(pilotId) === String(bestRecord.pilotId)) {
        return;
      }
      let pilotRecord = null;
      let time = 0;
      let index = 0;
      let lane = 1;

      if (this.race.raceSession && this.race.raceSession.length > 0) {
        pilotRecord = this.race.raceSession.find(
          (r) => String(r.pilotId) === String(pilotId),
        );
        if (pilotRecord) {
          time = parseFloat(pilotRecord.bestLapTime) || 0;
          index = pilotRecord.bestLapIndex || 0;
          lane = pilotRecord.bestLapLane || 1;
        }
      }

      if (time === 0 && this.race.quali && this.race.quali.length > 0) {
        pilotRecord = this.race.quali.find(
          (q) => String(q.pilotId) === String(pilotId),
        );
        if (pilotRecord) {
          time = parseFloat(pilotRecord.bestLapTime) || 0;
          index = pilotRecord.bestLapIndex || 0;
          lane = pilotRecord.bestLapLane || this.race.lane || 1;
        }
      }

      const driverObj = this.drivers.find(
        (d) => String(d.id) === String(pilotId),
      );
      if (driverObj) {
        pilotBestLaps.push({
          pilotId,
          name: driverObj.nickname || driverObj.name,
          photo: driverObj.photo || "",
          bestLapTime: time,
          bestLapIndex: index,
          bestLapLane: lane,
        });
      }
    });

    // Sort by bestLapTime ascending (excluding 0, which go to the bottom)
    pilotBestLaps.sort((a, b) => {
      const timeA = a.bestLapTime || Infinity;
      const timeB = b.bestLapTime || Infinity;
      if (timeA === Infinity && timeB === Infinity) return 0;
      return timeA - timeB;
    });

    const rowsHtml = pilotBestLaps
      .map((item, idx) => {
        const formattedLapTime =
          item.bestLapTime > 0
            ? `${parseFloat(item.bestLapTime).toFixed(4)}s`
            : "-";

        const pConfig = this.race.pilots.find((p) => {
          const pId = typeof p === "object" ? p.id : p;
          return String(pId) === String(item.pilotId);
        });
        const carId =
          pConfig && typeof pConfig === "object" ? pConfig.carId : null;
        const carObj =
          carId && this.cars
            ? this.cars.find((c) => String(c.id) === String(carId))
            : null;
        const carName = carObj ? carObj.name : "-";

        return `
        <style>
          .fastast-list .list-group-item:first-child{
            border-top: 0;
          }
        </style>
        <div class="fastast-list list-group-item d-flex align-items-center justify-content-between py-2 px-3" style="font-size: 1rem;">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold text-secondary text-start font-monospace" style="width: 22px;">#${idx + 2}</span>
            ${
              item.photo
                ? `<img src="${item.photo}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">`
                : `<div class="rounded-circle bg-body-tertiary d-flex align-items-center justify-content-center text-secondary" style="width: 24px; height: 24px;">
                    <i class="mdi mdi-account" style="font-size: 0.8rem;"></i>
                  </div>`
            }
            <div class="text-start ms-1">
              <span class="fw-bold text-body-emphasis" style="font-size: 1rem;">${item.name}</span>
              <span class="text-secondary small ms-1" style="font-size: 0.72rem;">(${carName})</span>
            </div>
          </div>
          <div class="d-flex align-items-center">
            <span class="fw-bold font-monospace text-body-secondary" style="font-size: 1rem;">
              ${formattedLapTime}
            </span>
          </div>
        </div>
      `;
      })
      .join("");

    let listHtml = "";
    if (pilotBestLaps.length > 0) {
      listHtml = `
        <div class="list-group rounded-2 overflow-hidden rounded-top-0">
          ${rowsHtml}
        </div>
      `;
    }

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

      <div class="fastest-lap-card border border-secondary-subtle rounded-3 rounded-bottom-0 p-3 shadow-sm mt-5">
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
            <div class="small fw-semibold text-secondary-emphasis d-flex align-items-center justify-content-end" style="gap: 6px;">
              <!--<span>Fenda:</span>
              <span class="rounded-circle border text-center border-0 fw-bold" style="width: 24px; height: 24px; background-color: ${laneColor}; display: inline-block;">${laneNum}</span>-->
            </div>
          </div>
        </div>
      </div>

      ${listHtml}
    `;
  }
}

customElements.define("slotrace-fastest-laps", SlotRaceFastestLaps);
customElements.define("slotrace-fastast-laps", SlotRaceFastestLaps);

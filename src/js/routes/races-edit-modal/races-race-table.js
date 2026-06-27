class SlotRaceRegistrationsRacesRaceTable extends HTMLElement {
  constructor() {
    super();
    this.race = null;
    this.drivers = [];
    this.cars = [];
    this.expandedPilotIds = new Set();
  }

  connectedCallback() {
    this._langListener = () => {
      if (this.race && this.drivers) {
        this.render();
        this.populateRaceTable();
      }
    };

    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setParams(race, drivers, cars) {
    this.race = race;
    this.drivers = drivers;
    this.cars = cars || [];
    this.render();
    this.populateRaceTable();
  }

  render() {
    this.innerHTML = `
      <style>
        /* Custom Zebra Striping that supports expanded accordion rows by targeting td cells directly */
        #race-edit-race-table-body tr:nth-of-type(4n+1) td,
        #race-edit-race-table-body tr:nth-of-type(4n+2) td {
          background-color: var(--bs-body-bg) !important;
        }
        #race-edit-race-table-body tr:nth-of-type(4n+3) td,
        #race-edit-race-table-body tr:nth-of-type(4n) td {
          background-color: var(--bs-tertiary-bg) !important;
        }
        /* Soft separator border between pilot row and expanded laps row */
        #race-edit-race-table-body tr.laps-accordion-row td {
          border-top: 1px solid var(--bs-border-color-translucent) !important;
        }
        /* Custom coloring for best lap times */
        .best-time-leader {
          color: #a855f7 !important; /* Purple for fastest lap overall */
        }
        html[data-bs-theme="light"] .best-time-leader {
          color: #6f42c1 !important;
        }
        .best-time-others {
          color: #2ec866 !important; /* Green for other personal bests */
        }
        html[data-bs-theme="light"] .best-time-others {
          color: #198754 !important;
        }
        .best-time-none {
          color: var(--bs-secondary-color) !important;
        }
        /* Custom coloring for difference times */
        .diff-time-has {
          color: #ffc107 !important; /* Yellow for time differences */
        }
        html[data-bs-theme="light"] .diff-time-has {
          color: #854d0e !important;
        }
      </style>

      <div class="col-12 text-start">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2" style="font-size: 0.95rem;">
            <i class="mdi mdi-flag-checkered text-primary fs-5"></i>
            Corrida
          </h6>
          <div class="d-flex align-items-center gap-2">
            <button type="button" id="btn-clear-race" class="btn btn-sm btn-danger d-flex align-items-center px-2.5 py-1 rounded-pill shadow-sm d-none" title="${window.t("registrations.races_modal.quali.clear_quali_button") || "Zerar Tempos"}" style="outline: none; box-shadow: none;">
              <i class="mdi mdi-refresh fs-6"></i>
            </button>
            <button type="button" id="btn-go-race" class="btn btn-sm btn-primary d-flex align-items-center px-2.5 py-1 rounded-pill shadow-sm" title="${window.t("registrations.races_modal.quali.go_race_button") || "Correr"}" style="outline: none; box-shadow: none;">
              <i class="mdi mdi-flag-checkered fs-6 me-2"></i>
              <span class="fw-semibold" style="font-size: 0.75rem; letter-spacing: 0.02em;">${window.t("registrations.races_modal.quali.go_race_button") || "Correr"}</span>
            </button>
          </div>
        </div>
        <div class="table-responsive border border-secondary-subtle rounded-3 overflow-hidden shadow-sm bg-body-tertiary">
          <table class="table table-borderless align-middle mb-0 text-center" style="background: transparent;">
            <thead class="bg-body-secondary border-bottom border-secondary-subtle text-secondary small text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">
              <tr>
                <th class="text-start" style="width: 8%;">POS</th>
                 <th class="text-start" style="width: 20%;">${window.t("registrations.modal.driver_caps_label") || "Piloto"}</th>
                 <th class="text-start" style="width: 20%;">${window.t("registrations.modal.car_caps_label") || "Carro"}</th>
                 <th style="width: 8%;">${window.t("registrations.modal.laps_label") || "Voltas"}</th>
                 <th style="width: 8%;">ZONA</th>
                 <th class="text-center" style="width: 13%;">LÍDER</th>
                 <th class="text-center" style="width: 13%;">RELATIVO</th>
                 <th class="text-end" style="width: 10%;">MELHOR</th>
                <th style="width: 5%;"></th>
              </tr>
            </thead>
            <tbody id="race-edit-race-table-body">
              <!-- Table rows rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

    `;
    this.setupHeaderEvents();
  }

  populateRaceTable() {
    const tableBody = this.querySelector("#race-edit-race-table-body");
    if (!tableBody || !this.race) return;

    const racePilots = this.race.pilots || [];

    if (racePilots.length === 0) {
      this.classList.add("d-none");
      return;
    }

    this.classList.remove("d-none");
    tableBody.innerHTML = "";

    this.race.raceSession = this.race.raceSession || [];

    // Clean up stale raceSession records
    this.race.raceSession = this.race.raceSession.filter((q) => {
      const id = typeof q.pilotId === "object" ? q.pilotId.id : q.pilotId;
      return racePilots.some((p) => {
        const pId = typeof p === "object" ? p.id : p;
        return pId === id;
      });
    });

    // Add missing raceSession records and ensure lapTimes exists on all records
    racePilots.forEach((pilot) => {
      const pilotId = typeof pilot === "object" ? pilot.id : pilot;
      const exists = this.race.raceSession.some((q) => q.pilotId === pilotId);
      if (!exists) {
        this.race.raceSession.push({
          pilotId: pilotId,
          laps: 0,
          bestLapIndex: 0,
          bestLapTime: 0,
          lapTimes: [],
        });
      }
    });

    this.race.raceSession.forEach((q) => {
      if (!q.lapTimes) {
        q.lapTimes = [];
      }
    });

    // Show/hide clear button dynamically
    const hasLaps = this.race.raceSession.some(
      (q) => q.laps > 0 || (q.lapTimes && q.lapTimes.length > 0),
    );
    const clearBtn = this.querySelector("#btn-clear-race");
    if (clearBtn) {
      if (hasLaps) {
        clearBtn.classList.remove("d-none");
      } else {
        clearBtn.classList.add("d-none");
      }
    }

    // Sort:
    // 1. More laps wins (descending)
    // 2. If laps are equal, smaller total elapsed time wins (ascending)
    // 3. If laps and times are equal, higher final zone wins (descending)
    // 4. Preserve racePilots insertion order as fallback
    const sortedRace = [...this.race.raceSession].sort((a, b) => {
      const lapsA = parseInt(a.laps) || 0;
      const lapsB = parseInt(b.laps) || 0;

      if (lapsA !== lapsB) {
        return lapsB - lapsA;
      }

      const zoneA = parseFloat(a.finalZone) || 0;
      const zoneB = parseFloat(b.finalZone) || 0;
      if (zoneA !== zoneB) {
        return zoneB - zoneA;
      }

      // Tie breaker: qualifying best lap time (fastest first, zeros at bottom)
      const qA = this.race.quali
        ? this.race.quali.find((q) => String(q.pilotId) === String(a.pilotId))
        : null;
      const qB = this.race.quali
        ? this.race.quali.find((q) => String(q.pilotId) === String(b.pilotId))
        : null;
      const qTimeA =
        qA && parseFloat(qA.bestLapTime) > 0
          ? parseFloat(qA.bestLapTime)
          : Infinity;
      const qTimeB =
        qB && parseFloat(qB.bestLapTime) > 0
          ? parseFloat(qB.bestLapTime)
          : Infinity;

      if (qTimeA !== qTimeB) {
        return qTimeA - qTimeB;
      }

      // Tie-breaker for identical qualifying best lap times: who did it first
      const setAtA = (qA && qA.bestLapTimeSetAt) || 0;
      const setAtB = (qB && qB.bestLapTimeSetAt) || 0;
      if (setAtA !== setAtB) {
        if (setAtA === 0) return 1;
        if (setAtB === 0) return -1;
        return setAtA - setAtB;
      }

      const idxA = racePilots.findIndex(
        (p) => (typeof p === "object" ? p.id : p) === a.pilotId,
      );
      const idxB = racePilots.findIndex(
        (p) => (typeof p === "object" ? p.id : p) === b.pilotId,
      );
      return idxA - idxB;
    });

    const leader = sortedRace[0];
    const leaderLaps = leader ? parseInt(leader.laps) || 0 : 0;
    const leaderTime =
      leader && leader.lapTimes
        ? leader.lapTimes.reduce((sum, t) => sum + (parseFloat(t) || 0), 0)
        : 0;

    sortedRace.forEach((item, index) => {
      const driverObj = this.drivers.find((d) => d.id === item.pilotId);
      const name = driverObj
        ? driverObj.nickname || driverObj.name
        : item.pilotId;
      const photoUrl = driverObj ? driverObj.photo : "";

      const racePilotObj = racePilots.find(
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
        positionHtml = `<span class="badge bg-warning text-dark px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-dark me-0.5"></i> 1º</span>`;
      } else if (index === 1) {
        positionHtml = `<span class="badge bg-secondary text-light px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-light me-0.5"></i> 2º</span>`;
      } else if (index === 2) {
        positionHtml = `<span class="badge bg-danger bg-opacity-75 text-light px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-light me-0.5"></i> 3º</span>`;
      } else {
        positionHtml = `<span class="fw-bold text-secondary-emphasis" style="font-size: 0.85rem;">${index + 1}º</span>`;
      }

      // Calculate difference
      let diffHtml = `<span class="text-secondary label-race-diff" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
      let relativeHtml = `<span class="text-secondary label-race-relative" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
      const currentLaps = parseInt(item.laps) || 0;
      const currentZone = parseFloat(item.finalZone) || 0;

      if (index > 0) {
        const leaderZone = leader ? parseFloat(leader.finalZone) || 0 : 0;
        const diffLaps = leaderLaps - currentLaps;
        const hasLeaderZone = leaderZone > 0;

        if (diffLaps === 0) {
          if (hasLeaderZone) {
            const diffZones = leaderZone - currentZone;
            diffHtml =
              diffZones > 0
                ? `<span class="text-secondary-emphasis fw-semibold label-race-diff" style="font-size: 0.95rem;">+${diffZones}z</span>`
                : `<span class="text-secondary label-race-diff" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
          } else {
            diffHtml = `<span class="text-secondary label-race-diff" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
          }
        } else {
          diffHtml = `<span class="text-secondary-emphasis fw-semibold label-race-diff" style="font-size: 0.95rem;">+${diffLaps}v</span>`;
        }

        // Relative calculation
        const pilotAhead = sortedRace[index - 1];
        const lapsAhead = parseInt(pilotAhead.laps) || 0;
        const zoneAhead = parseFloat(pilotAhead.finalZone) || 0;
        const diffLapsAhead = lapsAhead - currentLaps;
        const hasAheadZone = zoneAhead > 0;

        if (diffLapsAhead === 0) {
          if (hasAheadZone) {
            const diffZonesAhead = zoneAhead - currentZone;
            relativeHtml =
              diffZonesAhead > 0
                ? `<span class="text-secondary-emphasis fw-semibold label-race-relative" style="font-size: 0.95rem;">+${diffZonesAhead}z</span>`
                : `<span class="text-secondary label-race-relative" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
          } else {
            relativeHtml = `<span class="text-secondary label-race-relative" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
          }
        } else {
          relativeHtml = `<span class="text-secondary-emphasis fw-semibold label-race-relative" style="font-size: 0.95rem;">+${diffLapsAhead}v</span>`;
        }
      }

      const bestTime = parseFloat(item.bestLapTime) || 0;
      let bestTimeHtml = `<span class="text-secondary" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
      if (bestTime > 0) {
        const overallBestLap = sortedRace.reduce((best, q) => {
          const t = parseFloat(q.bestLapTime) || 0;
          if (t > 0 && (best === 0 || t < best)) return t;
          return best;
        }, 0);

        const isPole = Math.abs(bestTime - overallBestLap) < 0.0001;
        bestTimeHtml = `<span class="label-race-best px-2 font-monospace ${isPole ? "fw-bold best-time-leader" : "fw-bold best-time-others"}" style="font-size: 1.05rem;">${bestTime.toFixed(4)}</span>`;
      }

      const isExpanded = this.expandedPilotIds.has(item.pilotId);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="align-middle text-start">${positionHtml}</td>
        <td class="align-middle text-start">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 40px; height: 40px;">
              ${
                photoUrl
                  ? `
                <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
              `
                  : `
                <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                  <i class="mdi mdi-account text-secondary fs-4"></i>
                </div>
              `
              }
            </div>
            <span class="fw-bold text-body-emphasis small ms-2" style="font-size: 0.85rem;">${name}</span>
          </div>
        </td>
        <td class="align-middle text-start">
          ${
            carObj
              ? `
            <div class="d-flex align-items-center gap-2">
              <div class="rounded overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 48px; height: 32px;">
                ${
                  carPhotoUrl
                    ? `
                  <img src="${carPhotoUrl}" class="w-100 h-100 object-fit-cover">
                `
                    : `
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                    <i class="mdi mdi-car text-secondary fs-6"></i>
                  </div>
                `
                }
              </div>
              <span class="text-body-emphasis small fw-medium text-truncate" style="font-size: 0.8rem; max-width: 130px;" title="${carName}">${carName}</span>
            </div>
          `
              : `
            <span class="text-secondary" style="font-size: 1.05rem; font-family: inherit; margin-left: 20px;">-</span>
          `
          }
        </td>
        <td class="align-middle">
          <span class="fw-semibold text-body-emphasis label-race-laps" style="font-size: 0.95rem;">${item.laps}</span>
        </td>
        <td class="align-middle">
          <span class="label-race-zone fw-semibold ${item.finalZone > 0 ? "text-body-emphasis" : "text-secondary"}" style="font-size: 0.95rem;">${item.finalZone > 0 ? item.finalZone : "-"}</span>
        </td>
        <td class="align-middle text-center">
          ${diffHtml}
        </td>
        <td class="align-middle text-center">
          ${relativeHtml}
        </td>
        <td class="align-middle text-end">
          ${bestTimeHtml}
        </td>
        <td class="align-middle text-center">
          <button type="button" class="btn btn-sm btn-link text-secondary btn-toggle-laps p-1" data-pilot-id="${item.pilotId}" title="Ver tempos de voltas" style="outline: none; box-shadow: none;">
            <i class="mdi mdi-chevron-down fs-5" id="race-chevron-${item.pilotId}" style="display: inline-block; transition: transform 0.2s ease-in-out; ${isExpanded ? "transform: rotate(180deg);" : ""}"></i>
          </button>
        </td>
      `;

      const accordionRow = document.createElement("tr");
      accordionRow.id = `race-laps-row-${item.pilotId}`;
      accordionRow.className = `laps-accordion-row ${isExpanded ? "" : "d-none"}`;
      accordionRow.innerHTML = `
        <td colspan="9" class="p-0 text-start">
          <div class="laps-collapse-container" style="overflow: hidden; transition: max-height 0.2s ease-out, opacity 0.2s ease-out; ${isExpanded ? "max-height: none; opacity: 1;" : "max-height: 0px; opacity: 0;"}">
            <div class="p-3">
              <slotrace-registrations-races-session-laps id="race-session-laps-${item.pilotId}"></slotrace-registrations-races-session-laps>
            </div>
          </div>
        </td>
      `;

      const labelLaps = row.querySelector(".label-race-laps");
      const labelZone = row.querySelector(".label-race-zone");
      const labelBestTime = row.querySelector(".label-race-best");
      const labelDiff = row.querySelector(".label-race-diff");
      const labelRelative = row.querySelector(".label-race-relative");

      const updateBestTimeStyles = (hasValue) => {
        if (!labelBestTime) return;
        const overallBestLap = sortedRace.reduce((best, q) => {
          const t = parseFloat(q.bestLapTime) || 0;
          if (t > 0 && (best === 0 || t < best)) return t;
          return best;
        }, 0);
        const isPole =
          Math.abs((parseFloat(item.bestLapTime) || 0) - overallBestLap) <
          0.0001;

        if (hasValue) {
          labelBestTime.className = `label-race-best px-2 font-monospace ${isPole ? "fw-bold best-time-leader" : "fw-bold best-time-others"}`;
        } else {
          labelBestTime.className = "text-secondary label-race-best px-2";
        }
      };

      const updateDiffStyles = (hasValue, isTimeDiff) => {
        if (!labelDiff) return;
        if (hasValue) {
          if (isTimeDiff) {
            labelDiff.className = "diff-time-has fw-semibold label-race-diff";
            labelDiff.style.fontFamily = "monospace";
          } else {
            labelDiff.className =
              "text-secondary-emphasis fw-semibold label-race-diff";
            labelDiff.style.fontFamily = "inherit";
          }
        } else {
          labelDiff.className = "text-secondary label-race-diff";
          labelDiff.style.fontFamily = "inherit";
        }
      };

      const updateRelativeStyles = (hasValue, isTimeDiff) => {
        if (!labelRelative) return;
        if (hasValue) {
          if (isTimeDiff) {
            labelRelative.className =
              "diff-time-has fw-semibold label-race-relative";
            labelRelative.style.fontFamily = "monospace";
          } else {
            labelRelative.className =
              "text-secondary-emphasis fw-semibold label-race-relative";
            labelRelative.style.fontFamily = "inherit";
          }
        } else {
          labelRelative.className = "text-secondary label-race-relative";
          labelRelative.style.fontFamily = "inherit";
        }
      };

      const recalculateRaceMetrics = (record) => {
        record.laps = record.lapTimes.length;

        let minTime = 0;
        let minIndex = 0;

        record.lapTimes.forEach((time, idx) => {
          const val = parseFloat(time) || 0;
          if (val > 0) {
            if (minTime === 0 || val < minTime) {
              minTime = val;
              minIndex = idx + 1;
            }
          }
        });

        record.bestLapTime = minTime;
        record.bestLapIndex = minIndex;

        const calcTotal = record.lapTimes.reduce(
          (sum, t) => sum + (parseFloat(t) || 0),
          0,
        );

        // Update row labels in real-time
        if (labelLaps) labelLaps.textContent = record.laps;
        if (labelZone) {
          labelZone.textContent = record.finalZone > 0 ? record.finalZone : "-";
          labelZone.className =
            record.finalZone > 0
              ? "label-race-zone fw-semibold text-body-emphasis"
              : "label-race-zone fw-semibold text-secondary";
        }
        if (labelBestTime) {
          labelBestTime.textContent = record.bestLapTime
            ? parseFloat(record.bestLapTime).toFixed(4)
            : "-";
          updateBestTimeStyles(!!record.bestLapTime);
        }
        if (labelDiff) {
          if (index === 0) {
            labelDiff.textContent = "-";
            updateDiffStyles(false, false);
          } else {
            const currentZone = parseFloat(record.finalZone) || 0;
            const leaderZone = leader ? parseFloat(leader.finalZone) || 0 : 0;
            const diffLaps = leaderLaps - record.laps;
            const hasLeaderZone = leaderZone > 0;

            if (diffLaps === 0) {
              if (hasLeaderZone) {
                const diffZones = leaderZone - currentZone;
                if (diffZones > 0) {
                  labelDiff.textContent = `+${diffZones}z`;
                  updateDiffStyles(true, false);
                } else {
                  labelDiff.textContent = "-";
                  updateDiffStyles(false, false);
                }
              } else {
                labelDiff.textContent = "-";
                updateDiffStyles(false, false);
              }
            } else {
              labelDiff.textContent = `+${diffLaps}v`;
              updateDiffStyles(true, false);
            }
          }
        }

        if (labelRelative) {
          if (index === 0) {
            labelRelative.textContent = "-";
            updateRelativeStyles(false, false);
          } else {
            const currentZone = parseFloat(record.finalZone) || 0;
            const pilotAhead = sortedRace[index - 1];
            const lapsAhead = parseInt(pilotAhead.laps) || 0;
            const zoneAhead = parseFloat(pilotAhead.finalZone) || 0;
            const diffLapsAhead = lapsAhead - record.laps;
            const hasAheadZone = zoneAhead > 0;

            if (diffLapsAhead === 0) {
              if (hasAheadZone) {
                const diffZonesAhead = zoneAhead - currentZone;
                if (diffZonesAhead > 0) {
                  labelRelative.textContent = `+${diffZonesAhead}z`;
                  updateRelativeStyles(true, false);
                } else {
                  labelRelative.textContent = "-";
                  updateRelativeStyles(false, false);
                }
              } else {
                labelRelative.textContent = "-";
                updateRelativeStyles(false, false);
              }
            } else {
              labelRelative.textContent = `+${diffLapsAhead}v`;
              updateRelativeStyles(true, false);
            }
          }
        }

        // Notify parent modal of quali/laps updates
        window.dispatchEvent(new CustomEvent("raceQualiUpdated"));
      };

      const sessionLapsEl = accordionRow.querySelector(
        `#race-session-laps-${item.pilotId}`,
      );
      if (sessionLapsEl) {
        const overallBestLap = sortedRace.reduce((best, q) => {
          const t = parseFloat(q.bestLapTime) || 0;
          if (t > 0 && (best === 0 || t < best)) return t;
          return best;
        }, 0);
        const isPole =
          index === 0 &&
          bestTime > 0 &&
          Math.abs(bestTime - overallBestLap) < 0.0001;

        sessionLapsEl.setParams(
          item,
          () => {
            recalculateRaceMetrics(item);
          },
          isPole,
        );
      }

      // Chevron Toggle Listener
      const toggleBtn = row.querySelector(".btn-toggle-laps");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const container = accordionRow.querySelector(
            ".laps-collapse-container",
          );
          const isOpen = !accordionRow.classList.contains("d-none");
          const chevron = row.querySelector(`#race-chevron-${item.pilotId}`);

          if (isOpen) {
            if (container) {
              container.style.maxHeight = container.scrollHeight + "px";
              container.offsetHeight; // reflow
              container.style.maxHeight = "0px";
              container.style.opacity = "0";

              const onTransitionEnd = () => {
                accordionRow.classList.add("d-none");
                this.expandedPilotIds.delete(item.pilotId);
                if (chevron) chevron.style.transform = "rotate(0deg)";

                // Re-sort and re-render only when collapsing
                this.populateRaceTable();
                container.removeEventListener("transitionend", onTransitionEnd);
              };
              container.addEventListener("transitionend", onTransitionEnd);
            } else {
              accordionRow.classList.add("d-none");
              this.expandedPilotIds.delete(item.pilotId);
              if (chevron) chevron.style.transform = "rotate(0deg)";
              this.populateRaceTable();
            }
          } else {
            accordionRow.classList.remove("d-none");
            this.expandedPilotIds.add(item.pilotId);
            if (chevron) chevron.style.transform = "rotate(180deg)";

            if (container) {
              container.style.maxHeight = "0px";
              container.style.opacity = "0";
              container.offsetHeight; // reflow
              container.style.maxHeight = container.scrollHeight + "px";
              container.style.opacity = "1";

              const onTransitionEnd = () => {
                container.style.maxHeight = "none";
                container.removeEventListener("transitionend", onTransitionEnd);
              };
              container.addEventListener("transitionend", onTransitionEnd);
            }
          }
        });
      }

      tableBody.appendChild(row);
      tableBody.appendChild(accordionRow);
    });
  }

  setupHeaderEvents() {
    // Clear button event listener
    const clearBtn = this.querySelector("#btn-clear-race");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        window.confirmModal({
          title: "Zerar Corrida",
          message: `Tem certeza de que deseja zerar todas as voltas e tempos da corrida <strong class="text-danger fw-bold">${this.race.name}</strong>? Esta ação não poderá ser desfeita e removerá o registro do histórico.`,
          theme: "danger",
          icon: "mdi-alert-circle",
          cancelBtnText: "Cancelar",
          confirmBtnText: "Zerar",
          confirmBtnIcon: "mdi-trash-can-outline"
        }).then((confirmed) => {
          if (confirmed) {
            // Clear race metrics for all pilots
            this.race.raceSession = this.race.raceSession.map((q) => ({
              ...q,
              laps: 0,
              bestLapIndex: 0,
              bestLapTime: 0,
              lapTimes: [],
            }));

            this.populateRaceTable();

            // Notify parent modal of quali/laps updates to enable save button
            window.dispatchEvent(new CustomEvent("raceQualiUpdated"));
          }
        });
      });
    }

    // Setup Go Race Button listener
    const goRaceBtn = this.querySelector("#btn-go-race");
    if (goRaceBtn) {
      goRaceBtn.addEventListener("click", (e) => {
        if (this._hasPendingChanges) {
          e.preventDefault();
          return;
        }
        window.dispatchEvent(
          new CustomEvent("requestGoRace", {
            detail: { race: this.race },
          }),
        );
      });
    }

    this.setHasPendingChanges(this._hasPendingChanges || false);
  }

  setHasPendingChanges(hasChanges) {
    this._hasPendingChanges = hasChanges;
    const btn = this.querySelector("#btn-go-race");
    if (btn) {
      if (hasChanges) {
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
        btn.setAttribute("title", "Você precisa salvar as alterações");
      } else {
        btn.style.opacity = "";
        btn.style.cursor = "";
        const originalTitle = window.t("registrations.races_modal.quali.go_race_button") || "Correr";
        btn.setAttribute("title", originalTitle);
      }
    }
  }

  collapseAll() {
    this.expandedPilotIds.clear();
    this.populateRaceTable();
  }
}

customElements.define(
  "slotrace-registrations-races-race-table",
  SlotRaceRegistrationsRacesRaceTable,
);

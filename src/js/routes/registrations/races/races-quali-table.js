class SlotRaceRegistrationsRacesQualiTable extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.cars = [];
    this.expandedPilotIds = new Set();

    this._langListener = () => {
      if (this.race && this.drivers) {
        this.render();
        this.populateQualiTable();
      }
    };

    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  setParams(race, drivers, cars) {
    this.race = race;
    this.drivers = drivers;
    this.cars = cars || [];
    this.render();
    this.populateQualiTable();
  }

  render() {
    this.innerHTML = `
      <style>
        /* Custom Zebra Striping that supports expanded accordion rows by targeting td cells directly */
        #race-edit-quali-table-body tr:nth-of-type(4n+1) td,
        #race-edit-quali-table-body tr:nth-of-type(4n+2) td {
          background-color: var(--bs-body-bg) !important;
        }
        #race-edit-quali-table-body tr:nth-of-type(4n+3) td,
        #race-edit-quali-table-body tr:nth-of-type(4n) td {
          background-color: var(--bs-tertiary-bg) !important;
        }
        /* Soft separator border between pilot row and expanded laps row */
        #race-edit-quali-table-body tr.laps-accordion-row td {
          border-top: 1px solid var(--bs-border-color-translucent) !important;
        }
        /* Custom coloring for best lap times */
        .best-time-leader {
          color: #a855f7 !important; /* Vibrant modern purple for dark theme */
        }
        html[data-bs-theme="light"] .best-time-leader {
          color: #6f42c1 !important; /* Elegant purple for light theme */
        }
        .best-time-others {
          color: #2ec866 !important; /* Neon light green for dark theme */
        }
        html[data-bs-theme="light"] .best-time-others {
          color: #198754 !important; /* Dark green for high readability in light theme */
        }
        .best-time-none {
          color: var(--bs-secondary-color) !important;
        }
        /* Custom coloring for difference times */
        .diff-time-has {
          color: #ffc107 !important; /* Golden warning yellow for dark theme */
        }
        html[data-bs-theme="light"] .diff-time-has {
          color: #854d0e !important; /* Darker amber/brownish yellow for perfect contrast in light theme */
        }
      </style>

      <div class="col-12 text-start">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2" style="font-size: 0.95rem;">
            <i class="mdi mdi-table-large text-primary fs-5"></i>
            Classificação
          </h6>
          <div class="d-flex align-items-center gap-2">
            <button type="button" id="btn-go-qualify" class="btn btn-sm btn-primary d-flex align-items-center px-2.5 py-1 rounded-pill shadow-sm" title="${window.t('registrations.races_modal.quali.go_qualify_button') || 'Go Qualify'}" style="outline: none; box-shadow: none;">
              <i class="mdi mdi-timer-outline fs-6 me-2"></i>
              <span class="fw-semibold" style="font-size: 0.75rem; letter-spacing: 0.02em;">${window.t('registrations.races_modal.quali.go_qualify_button') || 'Go Qualify'}</span>
            </button>
            <button type="button" id="btn-clear-quali" class="btn btn-sm btn-danger d-flex align-items-center px-2.5 py-1 rounded-pill shadow-sm" title="${window.t('registrations.races_modal.quali.clear_quali_button') || 'Zerar Tempos'}" style="outline: none; box-shadow: none;">
              <i class="mdi mdi-refresh fs-6 me-2"></i>
              <span class="fw-semibold" style="font-size: 0.75rem; letter-spacing: 0.02em;">${window.t('registrations.races_modal.quali.clear_quali_button') || 'Zerar Tempos'}</span>
            </button>
          </div>
        </div>
        <div class="table-responsive border border-secondary-subtle rounded-3 overflow-hidden shadow-sm bg-body-tertiary">
          <table class="table table-borderless align-middle mb-0 text-center" style="background: transparent;">
            <thead class="bg-body-secondary border-bottom border-secondary-subtle text-secondary small text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">
              <tr>
                <th class="text-start" style="width: 8%;">POS</th>
                <th class="text-start" style="width: 20%;">${window.t('registrations.modal.driver_caps_label') || 'Piloto'}</th>
                <th class="text-start" style="width: 20%;">${window.t('registrations.modal.car_caps_label') || 'Carro'}</th>
                <th style="width: 10%;">${window.t('registrations.modal.laps_label') || 'Voltas'}</th>
                <th style="width: 12%;">QUAL VOLTA</th>
                <th class="text-end" style="width: 13%;">${window.t('registrations.modal.diff_label') || 'DIFERENÇA'}</th>
                <th class="text-end" style="width: 12%;">MELHOR</th>
                <th style="width: 5%;"></th>
              </tr>
            </thead>
            <tbody id="race-edit-quali-table-body">
              <!-- Table rows rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Confirmation Modal for Clearing Standings -->
      <div class="modal fade" id="modal-confirm-clear-quali" tabindex="-1" aria-labelledby="modal-confirm-clear-quali-title" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1065; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-md">
          <div class="modal-content border-danger-subtle">
            <div class="modal-header bg-danger bg-opacity-10 border-danger-subtle py-2.5">
              <h6 class="modal-title fw-bold text-danger d-flex align-items-center gap-2" id="modal-confirm-clear-quali-title" style="font-size: 0.95rem;">
                <i class="mdi mdi-alert-circle-outline fs-5"></i>
                Confirmar Limpeza de Classificação
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              <p class="mb-0 text-body-emphasis small">
                Tem certeza de que deseja zerar todas as voltas e tempos de todos os pilotos nesta corrida? Esta ação é irreversível e excluirá permanentemente todos os registros de telemetria desta classificação.
              </p>
            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="btn-confirm-clear-quali-action" class="btn btn-sm btn-danger fw-semibold px-3">Zerar Tudo</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.setupHeaderEvents();
  }

  populateQualiTable() {
    const tableBody = this.querySelector('#race-edit-quali-table-body');
    if (!tableBody || !this.race) return;

    const racePilots = this.race.pilots || [];

    if (racePilots.length === 0) {
      this.classList.add('d-none');
      return;
    }

    this.classList.remove('d-none');
    tableBody.innerHTML = '';

    this.race.quali = this.race.quali || [];
    
    // Clean up stale quali records
    this.race.quali = this.race.quali.filter(q => {
      const id = typeof q.pilotId === 'object' ? q.pilotId.id : q.pilotId;
      return racePilots.some(p => {
        const pId = typeof p === 'object' ? p.id : p;
        return pId === id;
      });
    });

    // Add missing quali records and ensure lapTimes exists on all records
    racePilots.forEach(pilot => {
      const pilotId = typeof pilot === 'object' ? pilot.id : pilot;
      const exists = this.race.quali.some(q => q.pilotId === pilotId);
      if (!exists) {
        this.race.quali.push({
          pilotId: pilotId,
          laps: 0,
          bestLapIndex: 0,
          bestLapTime: 0,
          lapTimes: []
        });
      }
    });

    this.race.quali.forEach(q => {
      if (!q.lapTimes) {
        q.lapTimes = [];
      }
    });

    // Sort: lower bestLapTime wins (0/empty goes to the bottom, tied 0s sorted by inclusion order in racePilots)
    const sortedQuali = [...this.race.quali].sort((a, b) => {
      const timeA = parseFloat(a.bestLapTime) || 0;
      const timeB = parseFloat(b.bestLapTime) || 0;
      
      if (timeA === 0 && timeB === 0) {
        const idxA = racePilots.findIndex(p => (typeof p === 'object' ? p.id : p) === a.pilotId);
        const idxB = racePilots.findIndex(p => (typeof p === 'object' ? p.id : p) === b.pilotId);
        return idxA - idxB;
      }
      if (timeA === 0) return 1;
      if (timeB === 0) return -1;
      return timeA - timeB;
    });

    const leaderTime = sortedQuali[0] ? (parseFloat(sortedQuali[0].bestLapTime) || 0) : 0;

    sortedQuali.forEach((item, index) => {
      const driverObj = this.drivers.find(d => d.id === item.pilotId);
      const name = driverObj ? (driverObj.nickname || driverObj.name) : item.pilotId;
      const photoUrl = driverObj ? driverObj.photo : '';

      // Find the pilot object in race.pilots to get the carId
      const racePilotObj = racePilots.find(p => (typeof p === 'object' ? p.id : p) === item.pilotId);
      const carId = racePilotObj && typeof racePilotObj === 'object' ? racePilotObj.carId : null;
      const carObj = carId && this.cars ? this.cars.find(c => c.id === carId) : null;
      
      const carName = carObj ? carObj.name : '';
      const carPhotoUrl = carObj ? carObj.photo : '';

      let positionHtml = '';

      if (index === 0) {
        positionHtml = `<span class="badge bg-warning text-dark px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-dark me-0.5"></i> 1º</span>`;
      } else if (index === 1) {
        positionHtml = `<span class="badge bg-secondary text-light px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-light me-0.5"></i> 2º</span>`;
      } else if (index === 2) {
        positionHtml = `<span class="badge bg-danger bg-opacity-75 text-light px-2.5 py-1.5 fw-bold shadow-sm" style="font-size: 0.75rem;"><i class="mdi mdi-trophy text-light me-0.5"></i> 3º</span>`;
      } else {
        positionHtml = `<span class="fw-bold text-secondary-emphasis" style="font-size: 0.85rem;">${index + 1}º</span>`;
      }

      const currentBest = parseFloat(item.bestLapTime) || 0;
      let diffHtml = '';
      if (currentBest === 0 || leaderTime === 0 || index === 0) {
        diffHtml = `<span class="text-secondary label-quali-diff" style="font-size: 1.05rem; font-family: inherit;">-</span>`;
      } else {
        const diff = currentBest - leaderTime;
        diffHtml = `<span class="diff-time-has fw-semibold label-quali-diff" style="font-size: 1.05rem; font-family: monospace;">+${diff.toFixed(4)}</span>`;
      }

      const isExpanded = this.expandedPilotIds && this.expandedPilotIds.has(item.pilotId);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="align-middle text-start">${positionHtml}</td>
        <td class="align-middle text-start">
          <div class="d-flex align-items-center gap-2.5">
            <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 40px; height: 40px;">
              ${photoUrl ? `
                <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
              ` : `
                <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                  <i class="mdi mdi-account text-secondary fs-4"></i>
                </div>
              `}
            </div>
            <span class="fw-bold text-body-emphasis small ms-2" style="font-size: 0.85rem;">${name}</span>
          </div>
        </td>
        <td class="align-middle text-start">
          ${carObj ? `
            <div class="d-flex align-items-center gap-2">
              <div class="rounded overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 48px; height: 32px;">
                ${carPhotoUrl ? `
                  <img src="${carPhotoUrl}" class="w-100 h-100 object-fit-cover">
                ` : `
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                    <i class="mdi mdi-car text-secondary fs-6"></i>
                  </div>
                `}
              </div>
              <span class="text-body-emphasis small fw-medium text-truncate" style="font-size: 0.8rem; max-width: 130px;" title="${carName}">${carName}</span>
            </div>
          ` : `
            <span class="text-secondary label-quali-car-none" style="font-size: 1.05rem; font-family: inherit; margin-left: 20px;">-</span>
          `}
        </td>
        <td class="align-middle">
          <span class="fw-semibold text-body-emphasis label-quali-laps" style="font-size: 0.95rem;">${item.laps}</span>
        </td>
        <td class="align-middle">
          <span class="label-quali-best-index" style="font-family: inherit;">${item.bestLapIndex || '-'}</span>
        </td>
        <td class="align-middle text-end">
          ${diffHtml}
        </td>
        <td class="align-middle text-end">
          <span class="label-quali-best-time px-2" style="font-size: 1.05rem;">${item.bestLapTime ? parseFloat(item.bestLapTime).toFixed(4) : '-'}</span>
        </td>
        <td class="align-middle text-center">
          <button type="button" class="btn btn-sm btn-link text-secondary btn-toggle-laps p-1" data-pilot-id="${item.pilotId}" title="Ver tempos de voltas" style="outline: none; box-shadow: none;">
            <i class="mdi mdi-chevron-down fs-5" id="chevron-${item.pilotId}" style="display: inline-block; transition: transform 0.2s ease-in-out; ${isExpanded ? 'transform: rotate(180deg);' : ''}"></i>
          </button>
        </td>
      `;

      const accordionRow = document.createElement('tr');
      accordionRow.id = `laps-row-${item.pilotId}`;
      accordionRow.className = `laps-accordion-row ${isExpanded ? '' : 'd-none'}`;
      accordionRow.innerHTML = `
        <td colspan="8" class="p-0 text-start">
          <div class="laps-collapse-container" style="overflow: hidden; transition: max-height 0.2s ease-out, opacity 0.2s ease-out; ${isExpanded ? 'max-height: none; opacity: 1;' : 'max-height: 0px; opacity: 0;'}">
            <div class="p-3">
              <slotrace-registrations-races-session-laps id="session-laps-${item.pilotId}"></slotrace-registrations-races-session-laps>
            </div>
          </div>
        </td>
      `;

      // Cache references to the labels for programmatic updates
      const labelLaps = row.querySelector('.label-quali-laps');
      const labelBestIndex = row.querySelector('.label-quali-best-index');
      const labelBestTime = row.querySelector('.label-quali-best-time');
      const labelDiff = row.querySelector('.label-quali-diff');

      const updateBestIndexStyles = (hasValue) => {
        if (!labelBestIndex) return;
        if (hasValue) {
          labelBestIndex.className = 'fw-semibold text-body-emphasis label-quali-best-index';
          labelBestIndex.style.fontSize = '0.95rem';
        } else {
          labelBestIndex.className = 'text-secondary label-quali-best-index';
          labelBestIndex.style.fontSize = '1.05rem';
        }
      };

      const updateBestTimeStyles = (hasValue) => {
        if (!labelBestTime) return;
        if (hasValue) {
          labelBestTime.className = `label-quali-best-time px-2 ${index === 0 ? 'fw-bold best-time-leader' : 'fw-bold best-time-others'}`;
          labelBestTime.style.fontFamily = 'monospace';
        } else {
          labelBestTime.className = 'text-secondary best-time-none label-quali-best-time px-2';
          labelBestTime.style.fontFamily = 'inherit';
        }
      };

      const updateDiffStyles = (hasValue) => {
        if (!labelDiff) return;
        if (hasValue) {
          labelDiff.className = 'diff-time-has fw-semibold label-quali-diff';
          labelDiff.style.fontFamily = 'monospace';
        } else {
          labelDiff.className = 'text-secondary label-quali-diff';
          labelDiff.style.fontFamily = 'inherit';
        }
      };

      // Apply initial styling dynamically to ensure exact consistency
      updateBestIndexStyles(!!item.bestLapIndex);
      updateBestTimeStyles(!!item.bestLapTime);
      updateDiffStyles(parseFloat(item.bestLapTime) > 0 && leaderTime > 0 && index > 0);

      const recalculateQualiMetrics = (record) => {
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

        // Update main labels in real-time
        if (labelLaps) labelLaps.textContent = record.laps;
        if (labelBestIndex) {
          labelBestIndex.textContent = record.bestLapIndex || '-';
          updateBestIndexStyles(!!record.bestLapIndex);
        }
        if (labelBestTime) {
          labelBestTime.textContent = record.bestLapTime ? parseFloat(record.bestLapTime).toFixed(4) : '-';
          updateBestTimeStyles(!!record.bestLapTime);
        }
        if (labelDiff) {
          const currentBest = parseFloat(record.bestLapTime) || 0;
          if (currentBest === 0 || leaderTime === 0 || index === 0) {
            labelDiff.textContent = '-';
            updateDiffStyles(false);
          } else {
            const diff = currentBest - leaderTime;
            labelDiff.textContent = diff >= 0 ? `+${diff.toFixed(4)}` : `+0.0000`;
            updateDiffStyles(true);
          }
        }

        // Notify parent modal of quali/laps updates
        window.dispatchEvent(new CustomEvent('raceQualiUpdated'));
      };

      const sessionLapsEl = accordionRow.querySelector(`#session-laps-${item.pilotId}`);
      if (sessionLapsEl) {
        const isPole = index === 0 && currentBest > 0;
        sessionLapsEl.setParams(item, () => {
          recalculateQualiMetrics(item);
        }, isPole);
      }

      // Chevron Toggle Button Listener
      const toggleBtn = row.querySelector('.btn-toggle-laps');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const container = accordionRow.querySelector('.laps-collapse-container');
          const isOpen = !accordionRow.classList.contains('d-none');
          const chevron = row.querySelector(`#chevron-${item.pilotId}`);
          
          if (isOpen) {
            if (container) {
              // Retrieve actual scrollHeight first
              container.style.maxHeight = container.scrollHeight + 'px';
              // Force reflow
              container.offsetHeight;
              container.style.maxHeight = '0px';
              container.style.opacity = '0';
              
              const onTransitionEnd = () => {
                accordionRow.classList.add('d-none');
                this.expandedPilotIds.delete(item.pilotId);
                if (chevron) chevron.style.transform = 'rotate(0deg)';
                
                // Re-sort and re-render the table only when collapsing (editing finished)
                this.populateQualiTable();
                container.removeEventListener('transitionend', onTransitionEnd);
              };
              container.addEventListener('transitionend', onTransitionEnd);
            } else {
              accordionRow.classList.add('d-none');
              this.expandedPilotIds.delete(item.pilotId);
              if (chevron) chevron.style.transform = 'rotate(0deg)';
              this.populateQualiTable();
            }
          } else {
            accordionRow.classList.remove('d-none');
            this.expandedPilotIds.add(item.pilotId);
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            
            if (container) {
              container.style.maxHeight = '0px';
              container.style.opacity = '0';
              // Force reflow
              container.offsetHeight;
              container.style.maxHeight = container.scrollHeight + 'px';
              container.style.opacity = '1';
              
              const onTransitionEnd = () => {
                // Allow container to expand freely with dynamically added laps
                container.style.maxHeight = 'none';
                container.removeEventListener('transitionend', onTransitionEnd);
              };
              container.addEventListener('transitionend', onTransitionEnd);
            }
          }
        });
      }

      tableBody.appendChild(row);
      tableBody.appendChild(accordionRow);
    });
  }

  setupHeaderEvents() {
    // Setup Clear Quali Button listener
    const clearBtn = this.querySelector('#btn-clear-quali');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const confirmModalEl = this.querySelector('#modal-confirm-clear-quali');
        if (confirmModalEl) {
          let confirmModalInstance = bootstrap.Modal.getInstance(confirmModalEl);
          if (!confirmModalInstance) {
            confirmModalInstance = new bootstrap.Modal(confirmModalEl);
          }
          confirmModalInstance.show();

          const actionBtn = confirmModalEl.querySelector('#btn-confirm-clear-quali-action');
          if (actionBtn) {
            const newActionBtn = actionBtn.cloneNode(true);
            actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

            newActionBtn.addEventListener('click', () => {
              // Clear quali metrics for all pilots
              this.race.quali = this.race.quali.map(q => ({
                ...q,
                laps: 0,
                bestLapIndex: 0,
                bestLapTime: 0,
                lapTimes: []
              }));

              // Re-render table
              this.populateQualiTable();

              // Notify parent modal of quali/laps updates
              window.dispatchEvent(new CustomEvent('raceQualiUpdated'));

              confirmModalInstance.hide();
            });
          }
        }
      });
    }

    // Setup Go Qualify Button listener
    const goQualifyBtn = this.querySelector('#btn-go-qualify');
    if (goQualifyBtn) {
      goQualifyBtn.addEventListener('click', () => {
        // Dispatch custom event for future telemetry/racing screens integration
        window.dispatchEvent(new CustomEvent('requestGoQualify', {
          detail: { race: this.race }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-races-quali-table', SlotRaceRegistrationsRacesQualiTable);

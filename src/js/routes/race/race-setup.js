class SlotRaceRaceSetup extends HTMLElement {
  set session(value) {
    this._session = value;
    if (this.tracks && this.tracks.length > 0) {
      this.prepopulateForm();
    }
  }

  get session() {
    return this._session;
  }

  connectedCallback() {
    this.tracks = [];
    this.drivers = [];
    this.selectedDrivers = [];

    this.render();
    this.loadData();
    this.setupEvents();
  }

  loadData() {
    Promise.all([
      window.electronAPI.db.get('tracks'),
      window.electronAPI.db.get('drivers')
    ]).then(([tracks, drivers]) => {
      this.tracks = tracks || [];
      this.drivers = (drivers || []).sort((a, b) =>
        (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '', undefined, { sensitivity: 'base' })
      );
      this.populateSelects();
      this.prepopulateForm();

      // Auto-focus the race name input field to prevent Electron focus bugs and provide premium UX!
      const raceNameInput = this.querySelector('#input-race-name');
      if (raceNameInput) {
        window.focus();
        setTimeout(() => {
          raceNameInput.focus();
        }, 100);
      }
    }).catch(err => {
      console.error('Failed to load database items in race setup:', err);
    });
  }

  populateSelects() {
    const trackSelect = this.querySelector('#select-track');
    if (trackSelect) {
      trackSelect.innerHTML = `<option value="">${window.t('race.setup.track_placeholder') || 'Select track...'}</option>`;
      this.tracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.id;
        option.textContent = `${track.name} (${track.lanes} ${window.t('registrations.tracks_modal.lane_label')}s | ${track.scale})`;
        trackSelect.appendChild(option);
      });
    }

    const pilotsContainer = this.querySelector('#pilots-checklist-container');
    if (pilotsContainer) {
      if (this.drivers.length === 0) {
        pilotsContainer.innerHTML = `
          <div class="small text-secondary py-2 text-center">
            <i class="mdi mdi-account-multiple-outline me-1"></i>
            ${window.t('race.setup.no_pilots_registered') || 'No pilots registered in the database yet.'}
          </div>
        `;
        return;
      }

      pilotsContainer.innerHTML = '';
      this.drivers.forEach(pilot => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check mb-2 col-md-6 col-lg-4';
        wrapper.innerHTML = `
          <input class="form-check-input pilot-checkbox" type="checkbox" value="${pilot.id}" id="check-pilot-${pilot.id}">
          <label class="form-check-label fw-semibold text-body-emphasis small" style="cursor: pointer;" for="check-pilot-${pilot.id}">
            ${pilot.nickname ? `${pilot.nickname} <span class="text-secondary fw-normal">(${pilot.name})</span>` : pilot.name}
          </label>
        `;

        const checkbox = wrapper.querySelector('input');
        checkbox.addEventListener('change', () => {
          this.updateSelectedPilots();
        });

        pilotsContainer.appendChild(wrapper);
      });
    }
  }

  updateSelectedPilots() {
    const checkboxes = this.querySelectorAll('.pilot-checkbox:checked');
    this.selectedDrivers = Array.from(checkboxes).map(chk => {
      return this.drivers.find(d => d.id === chk.value);
    });

    // Update selected count badge
    const badge = this.querySelector('#badge-pilots-selected');
    if (badge) {
      badge.textContent = `${this.selectedDrivers.length} ${window.t('race.setup.pilots_selected') || 'pilot(s) selected'}`;
    }

    this.checkConfigurationWarnings();
  }

  checkConfigurationWarnings() {
    const trackSelect = this.querySelector('#select-track');
    const warningDiv = this.querySelector('#config-warnings-container');
    if (!warningDiv || !trackSelect) return;

    warningDiv.innerHTML = '';
    const trackId = trackSelect.value;
    if (!trackId || this.selectedDrivers.length === 0) return;

    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    const lanes = parseInt(track.lanes) || 0;
    const pilotsCount = this.selectedDrivers.length;

    if (pilotsCount > lanes) {
      const deckCount = pilotsCount - lanes;
      const warningText = (window.t('race.setup.lanes_warning') || 'Warning: The selected track has {lanes} lanes. You selected {pilots} pilots.')
        .replace('{lanes}', lanes)
        .replace('{pilots}', pilotsCount);

      const deckText = (window.t('race.setup.deck_info') || '{deck} pilots will start on the DECK (bench) and enter during rotation.')
        .replace('{deck}', deckCount);

      warningDiv.innerHTML = `
        <div class="alert alert-warning border-warning-subtle bg-warning bg-opacity-10 d-flex flex-column gap-1 mb-0 py-2 px-3 small">
          <div class="fw-bold text-warning-emphasis"><i class="mdi mdi-alert-circle-outline"></i> ${warningText}</div>
          <div class="text-secondary">${deckText}</div>
        </div>
      `;
    } else {
      warningDiv.innerHTML = `
        <div class="alert alert-success border-success-subtle bg-success bg-opacity-10 py-2 px-3 small mb-0 text-success-emphasis fw-bold">
          <i class="mdi mdi-check-circle-outline"></i> ${window.t('race.telemetry.running') || 'Configuração correta.'}
        </div>
      `;
    }
  }

  setupEvents() {
    const trackSelect = this.querySelector('#select-track');
    const qualToggle = this.querySelector('#switch-qualifying');
    const qualOptions = this.querySelector('#qualifying-options-container');
    const qualLaneSelect = this.querySelector('#select-qualifying-lane');

    if (trackSelect) {
      trackSelect.addEventListener('change', () => {
        this.checkConfigurationWarnings();
        this.populateQualifyingLanes();
      });
    }

    if (qualToggle && qualOptions) {
      qualToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          qualOptions.classList.remove('d-none');
          this.populateQualifyingLanes();
        } else {
          qualOptions.classList.add('d-none');
        }
        this.updateSubmitButtonText();
      });
    }

    const form = this.querySelector('#form-race-setup');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const raceNameInput = this.querySelector('#input-race-name');
        const trackId = trackSelect ? trackSelect.value : '';
        const heatTimeInput = this.querySelector('#input-heat-time');
        const intervalTimeInput = this.querySelector('#input-interval-time');
        const cutoffTimeInput = this.querySelector('#input-cutoff-time');
        const useQualifying = qualToggle ? qualToggle.checked : false;

        const raceName = raceNameInput ? raceNameInput.value.trim() : '';
        const track = this.tracks.find(t => t.id === trackId);
        const heatTime = heatTimeInput ? parseInt(heatTimeInput.value) || 180 : 180;
        const intervalTime = intervalTimeInput ? parseInt(intervalTimeInput.value) || 10 : 10;
        const cutoffTime = cutoffTimeInput ? parseFloat(cutoffTimeInput.value) || 3.0 : 3.0;

        if (!raceName) {
          alert(window.t('race.setup.validation_name') || 'Please enter the race name.');
          return;
        }
        if (!track) {
          alert(window.t('race.setup.validation_track') || 'Please select a track.');
          return;
        }
        if (this.selectedDrivers.length === 0) {
          alert(window.t('race.setup.validation_pilots') || 'Please select at least 1 pilot.');
          return;
        }

        let qualifyLane = null;
        if (useQualifying && qualLaneSelect) {
          const laneNum = parseInt(qualLaneSelect.value);
          // Normalize track.laneColors
          const defaultColors = ['#dc3545', '#0d6efd', '#ffffff', '#ffc107', '#198754', '#fd7e14', '#6f42c1', '#0dcaf0'];
          const normColors = (track.laneColors || []).map((c, i) => {
            if (c && typeof c === 'object') return c;
            return { number: i + 1, color: c || defaultColors[i % defaultColors.length] };
          });
          qualifyLane = normColors.find(c => c.number === laneNum) || normColors[0];
        }

        const detail = {
          raceName,
          track,
          pilots: this.selectedDrivers,
          heatTime,
          intervalTime,
          cutoffTime,
          qualifyLane
        };

        if (useQualifying) {
          this.dispatchEvent(new CustomEvent('goToQualifying', {
            bubbles: true,
            composed: true,
            detail: detail
          }));
        } else {
          // Qualification is disabled. Perform automatic starting grid and deck placement!
          // We sort pilots alphabetically to represent qualification standing.
          const sortedPilots = [...this.selectedDrivers].sort((a, b) =>
            (a.nickname || a.name || '').localeCompare(b.nickname || b.name || '', undefined, { sensitivity: 'base' })
          );

          const L = parseInt(track.lanes) || 0;
          const N = sortedPilots.length;

          let startingGrid = [];
          let deck = [];

          if (N <= L) {
            startingGrid = [...sortedPilots];
          } else {
            const D = N - L;
            // Active lanes (0 to L-1) get P_{D+1} to P_N
            for (let i = 0; i < L; i++) {
              startingGrid.push(sortedPilots[D + i]);
            }
            // Deck (0 to D-1) gets P_D down to P_1
            for (let j = 0; j < D; j++) {
              deck.push(sortedPilots[D - 1 - j]);
            }
          }

          detail.startingGrid = startingGrid;
          detail.deck = deck;

          this.dispatchEvent(new CustomEvent('goToTelemetry', {
            bubbles: true,
            composed: true,
            detail: detail
          }));
        }
      });
    }
  }

  populateQualifyingLanes() {
    const trackSelect = this.querySelector('#select-track');
    const qualLaneSelect = this.querySelector('#select-qualifying-lane');
    if (!trackSelect || !qualLaneSelect) return;

    qualLaneSelect.innerHTML = '';
    const trackId = trackSelect.value;
    if (!trackId) return;

    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    const defaultColors = ['#dc3545', '#0d6efd', '#ffffff', '#ffc107', '#198754', '#fd7e14', '#6f42c1', '#0dcaf0'];
    const count = parseInt(track.lanes) || 0;
    const laneWord = window.t('registrations.tracks_modal.lane_label') || 'Lane';

    const normalizedColors = (track.laneColors || []).map((item, idx) => {
      if (item && typeof item === 'object') return item;
      return { number: idx + 1, color: item || defaultColors[idx % defaultColors.length] };
    });

    if (normalizedColors.length === 0 && count > 0) {
      for (let i = 0; i < count; i++) {
        normalizedColors.push({
          number: i + 1,
          color: defaultColors[i % defaultColors.length]
        });
      }
    }

    normalizedColors.forEach(item => {
      const option = document.createElement('option');
      option.value = item.number;
      option.textContent = `${laneWord} ${item.number} (${item.color})`;
      qualLaneSelect.appendChild(option);
    });
  }

  updateSubmitButtonText() {
    const qualToggle = this.querySelector('#switch-qualifying');
    const submitBtn = this.querySelector('#btn-submit-setup');
    if (!submitBtn) return;

    if (qualToggle && qualToggle.checked) {
      submitBtn.innerHTML = `
        <i class="mdi mdi-arrow-right-circle-outline fs-5"></i>
        ${window.t('race.setup.start_qualifying') || 'Go to Qualifying'}
      `;
    } else {
      submitBtn.innerHTML = `
        <i class="mdi mdi-play-circle-outline fs-5"></i>
        ${window.t('race.setup.start_race') || 'Start Direct Race'}
      `;
    }
  }

  render() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString();

    this.innerHTML = `
      <div class="row justify-content-center py-2 fade-in">
        <div class="col-12 col-xl-10">
          
          <div class="card bg-body-tertiary border-secondary-subtle shadow-sm mb-4">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3">
              <h5 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <i class="mdi mdi-cog-outline text-primary fs-4"></i>
                ${window.t('race.setup.title') || 'Configure New Race'}
              </h5>
            </div>
            
            <div class="card-body p-4">
              <form id="form-race-setup" class="needs-validation" novalidate>
                
                <div class="row">
                  <!-- Race Name -->
                  <div class="col-md-6 mb-3">
                    <label for="input-race-name" class="form-label fw-semibold text-secondary small">${window.t('race.setup.name_label') || 'Race Name'}</label>
                    <input type="text" class="form-control p-2" id="input-race-name" placeholder="${window.t('race.setup.name_placeholder') || 'Enter race name'}" required>
                    <div class="invalid-feedback">${window.t('race.setup.validation_name') || 'Please enter the race name.'}</div>
                  </div>

                  <!-- Date (Static) -->
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-semibold text-secondary small">Data</label>
                    <div class="form-control p-2 bg-body-secondary text-secondary" style="cursor: not-allowed;">
                      <i class="mdi mdi-calendar me-1"></i> ${formattedDate}
                    </div>
                  </div>
                </div>

                <div class="row">
                  <!-- Track Selection -->
                  <div class="col-md-6 mb-3">
                    <label for="select-track" class="form-label fw-semibold text-secondary small">${window.t('race.setup.track_label') || 'Selected Track'}</label>
                    <select class="form-select p-2" id="select-track" required>
                      <option value="">${window.t('race.setup.track_placeholder') || 'Select track...'}</option>
                    </select>
                    <div class="invalid-feedback">${window.t('race.setup.validation_track') || 'Please select a track.'}</div>
                  </div>

                  <!-- Race Type Selection -->
                  <div class="col-md-6 mb-3">
                    <label for="select-race-type" class="form-label fw-semibold text-secondary small">${window.t('race.setup.type_label') || 'Race Type'}</label>
                    <select class="form-select p-2" id="select-race-type" required>
                      <option value="grand_prix" selected>Grand Prix</option>
                    </select>
                  </div>
                </div>

                <hr class="my-4 border-secondary-subtle opacity-25">

                <!-- Grand Prix parameters -->
                <div class="row mb-4">
                  <!-- Heat Time (Seconds) -->
                  <div class="col-md-4 mb-3">
                    <label for="input-heat-time" class="form-label fw-semibold text-secondary small">${window.t('race.setup.heat_time_label') || 'Heat Time (seconds)'}</label>
                    <input type="number" min="5" step="1" class="form-control p-2" id="input-heat-time" value="180" required>
                    <div class="invalid-feedback">${window.t('race.setup.validation_heat_time') || 'Invalid heat time.'}</div>
                  </div>

                  <!-- Interval Time (Seconds) -->
                  <div class="col-md-4 mb-3">
                    <label for="input-interval-time" class="form-label fw-semibold text-secondary small">${window.t('race.setup.interval_time_label') || 'Interval Time (seconds)'}</label>
                    <input type="number" min="0" step="1" class="form-control p-2" id="input-interval-time" value="10" required>
                    <div class="invalid-feedback">${window.t('race.setup.validation_interval_time') || 'Invalid interval time.'}</div>
                  </div>

                  <!-- Cut-off Time (Seconds) -->
                  <div class="col-md-4 mb-3">
                    <label for="input-cutoff-time" class="form-label fw-semibold text-secondary small">${window.t('race.setup.cutoff_time_label') || 'Cut-off Time (seconds)'}</label>
                    <input type="number" min="0.1" step="0.05" class="form-control p-2" id="input-cutoff-time" value="3.0" required>
                    <div class="invalid-feedback">${window.t('race.setup.validation_cutoff_time') || 'Invalid cut-off time.'}</div>
                  </div>
                </div>

                <div class="card border-secondary-subtle bg-body-secondary bg-opacity-25 p-3 mb-4">
                  <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h6 class="fw-bold text-body-emphasis mb-0">
                      <i class="mdi mdi-account-multiple-outline text-primary me-1"></i>
                      ${window.t('race.setup.pilots_label') || 'Participating Pilots'}
                    </h6>
                    <span id="badge-pilots-selected" class="badge bg-secondary border border-secondary-subtle text-secondary-emphasis font-monospace px-2.5 py-1">0 ${window.t('race.setup.pilots_selected') || 'pilot(s) selected'}</span>
                  </div>

                  <div class="row px-2" id="pilots-checklist-container">
                    <!-- Loaded via JS -->
                  </div>

                  <!-- Configuration warnings -->
                  <div id="config-warnings-container" class="mt-3">
                    <!-- Populated dynamically -->
                  </div>
                </div>

                <!-- Qualifying Switch and options -->
                <div class="card border-secondary-subtle bg-body-secondary bg-opacity-25 p-3 mb-4">
                  <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" role="switch" id="switch-qualifying" style="cursor: pointer;">
                    <label class="form-check-label fw-bold text-body-emphasis" for="switch-qualifying" style="cursor: pointer;">
                      ${window.t('race.setup.qualifying_toggle') || 'Run Qualifying Session (Grid Definition)'}
                    </label>
                  </div>
                  
                  <div id="qualifying-options-container" class="row mt-3 d-none">
                    <div class="col-md-6">
                      <label for="select-qualifying-lane" class="form-label fw-semibold text-secondary small">${window.t('race.setup.qualifying_lane_label') || 'Qualifying Lane'}</label>
                      <select class="form-select p-2" id="select-qualifying-lane">
                        <!-- Loaded dynamically based on track -->
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Submit -->
                <div class="d-flex justify-content-end pt-2">
                  <button type="submit" id="btn-submit-setup" class="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-2">
                    <i class="mdi mdi-play-circle-outline fs-5"></i>
                    ${window.t('race.setup.start_race') || 'Start Direct Race'}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  prepopulateForm() {
    if (!this._session) return;
    
    // We only prepopulate if we have a valid race name in session, indicating a setup was previously performed.
    if (!this._session.raceName) return;

    // Race Name
    const raceNameInput = this.querySelector('#input-race-name');
    if (raceNameInput) {
      raceNameInput.value = this._session.raceName;
    }

    // Heat Time
    const heatTimeInput = this.querySelector('#input-heat-time');
    if (heatTimeInput && this._session.heatTime !== undefined) {
      heatTimeInput.value = this._session.heatTime;
    }

    // Interval Time
    const intervalTimeInput = this.querySelector('#input-interval-time');
    if (intervalTimeInput && this._session.intervalTime !== undefined) {
      intervalTimeInput.value = this._session.intervalTime;
    }

    // Cut-off Time
    const cutoffTimeInput = this.querySelector('#input-cutoff-time');
    if (cutoffTimeInput && this._session.cutoffTime !== undefined) {
      cutoffTimeInput.value = this._session.cutoffTime;
    }

    // Track Selection
    const trackSelect = this.querySelector('#select-track');
    if (trackSelect && this._session.track) {
      trackSelect.value = this._session.track.id;
      // Populate qualifying lanes and check warnings
      this.populateQualifyingLanes();
      this.checkConfigurationWarnings();
    }

    // Qualifying Switch
    const qualToggle = this.querySelector('#switch-qualifying');
    const qualOptions = this.querySelector('#qualifying-options-container');
    const qualLaneSelect = this.querySelector('#select-qualifying-lane');

    if (this._session.qualifyLane) {
      if (qualToggle) {
        qualToggle.checked = true;
      }
      if (qualOptions) {
        qualOptions.classList.remove('d-none');
      }
      this.populateQualifyingLanes();
      if (qualLaneSelect) {
        qualLaneSelect.value = this._session.qualifyLane.number;
      }
    } else {
      if (qualToggle) {
        qualToggle.checked = false;
      }
      if (qualOptions) {
        qualOptions.classList.add('d-none');
      }
    }
    this.updateSubmitButtonText();

    // Checked Pilots Checklist
    if (this._session.pilots && this._session.pilots.length > 0) {
      const pilotIds = this._session.pilots.map(p => p.id);
      pilotIds.forEach(id => {
        const checkbox = this.querySelector(`#check-pilot-${id}`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
      this.updateSelectedPilots();
    }
  }
}

customElements.define('slotrace-race-setup', SlotRaceRaceSetup);

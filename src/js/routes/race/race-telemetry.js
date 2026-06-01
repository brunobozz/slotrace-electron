class SlotRaceRaceTelemetry extends HTMLElement {
  set session(value) {
    this._session = value;
    this.init();
  }

  get session() {
    return this._session;
  }

  init() {
    if (!this._session) return;

    const track = this._session.track;
    const defaultColors = ['#dc3545', '#0d6efd', '#ffffff', '#ffc107', '#198754', '#fd7e14', '#6f42c1', '#0dcaf0'];
    const L = parseInt(track.lanes) || 1;

    // Normalize track rotation order
    this.rotationOrder = (track.laneColors || []).map((c, i) => {
      if (c && typeof c === 'object') return c;
      return { number: i + 1, color: c || defaultColors[i % defaultColors.length] };
    });

    if (this.rotationOrder.length === 0) {
      for (let i = 0; i < L; i++) {
        this.rotationOrder.push({
          number: i + 1,
          color: defaultColors[i % defaultColors.length]
        });
      }
    }

    const N = this._session.pilots.length;
    this.activeHeatsCount = Math.max(N, L); // Each pilot runs on every lane exactly once

    // Restore or initialize runtime telemetry states inside session to survive navigation!
    if (this._session.currentHeat === undefined || this._session.currentHeat === null) {
      this._session.currentHeat = 1;
    }
    // Always force paused state when loaded/reloaded to satisfy safety pause requirement
    this._session.isPaused = true;
    
    if (this._session.isInterval === undefined || this._session.isInterval === null) {
      this._session.isInterval = false;
    }
    if (this._session.isHeatStarted === undefined || this._session.isHeatStarted === null) {
      this._session.isHeatStarted = false;
    }
    if (this._session.timeLeft === undefined || this._session.timeLeft === null) {
      this._session.timeLeft = this._session.heatTime;
    }

    // Setup active lanes and deck state in session
    if (!this._session.activeLanes) {
      this._session.activeLanes = Array(L).fill(null);
      for (let i = 0; i < L; i++) {
        if (this._session.startingGrid[i]) {
          this._session.activeLanes[i] = this._session.startingGrid[i];
        }
      }
    }

    if (!this._session.deckState) {
      this._session.deckState = [...this._session.deck];
    }

    // Initialize stats database for all pilots inside session
    if (!this._session.pilotStats) {
      this._session.pilotStats = {};
      this._session.pilots.forEach(pilot => {
        this._session.pilotStats[pilot.id] = {
          pilot,
          lapsByHeat: Array(this.activeHeatsCount).fill(0),
          bestLapByHeat: Array(this.activeHeatsCount).fill(null),
          totalLaps: 0,
          finalZone: 0,
          bestLap: null,
          avgLapSum: 0,
          avgLapCount: 0,
          lapsHistory: [],
          accumulatedLapTime: 0,
          lastLapTimeLeft: this._session.heatTime
        };
      });
    }

    if (!this._session.laneLastLapTime) {
      this._session.laneLastLapTime = {};
      this.rotationOrder.forEach(lane => {
        this._session.laneLastLapTime[lane.number] = 0;
      });
    }

    if (!this._session.laneRunStarted) {
      this._session.laneRunStarted = {};
      this.rotationOrder.forEach(lane => {
        this._session.laneRunStarted[lane.number] = false;
      });
    }

    // Bind local state variables directly to session references
    this.currentHeat = this._session.currentHeat;
    this.isPaused = this._session.isPaused;
    this.isInterval = this._session.isInterval;
    this.isHeatStarted = this._session.isHeatStarted;
    this.timeLeft = this._session.timeLeft;
    this.activeLanes = this._session.activeLanes;
    this.deckState = this._session.deckState;
    this.pilotStats = this._session.pilotStats;
    this.laneLastLapTime = this._session.laneLastLapTime;
    this.laneRunStarted = this._session.laneRunStarted;

    this.pauseTimestamp = 0;
    this.heatStartTimestamp = 0;

    this.render();
    this.setupTimerLoop();
    this.setupGlobalEvents();
  }

  setupGlobalEvents() {
    // Keyboard trigger listeners for lap triggers
    this._lapKeyListener = (e) => {
      // Keys '1' to '8'
      const keyVal = parseInt(e.key);
      if (keyVal >= 1 && keyVal <= 8) {
        const laneIndex = keyVal - 1;
        if (laneIndex < this.activeLanes.length) {
          e.preventDefault();
          this.triggerLap(laneIndex);
        }
      }
      // Space/Enter to start or pause
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.toggleStartPause();
      }
    };
    window.addEventListener('keydown', this._lapKeyListener);

    // Route change auto-pause listener (in case they switch tabs in the top navigation bar)
    this._routePauseListener = () => {
      const hash = window.location.hash || '#dashboard';
      if (!hash.startsWith('#race')) {
        if (!this.isPaused) {
          this.toggleStartPause();
        }
      }
    };
    window.addEventListener('hashchange', this._routePauseListener);

    // Windows blur / Browser Tab visibility auto-pause listener (in case they minimize or click outside)
    this._visibilityPauseListener = () => {
      if (document.hidden) {
        if (!this.isPaused) {
          this.toggleStartPause();
        }
      }
    };
    document.addEventListener('visibilitychange', this._visibilityPauseListener);
    window.addEventListener('blur', this._visibilityPauseListener);
  }

  setupDomEvents() {
    const startPauseBtn = this.querySelector('#btn-telemetry-start-pause');
    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', () => {
        this.toggleStartPause();
      });
    }

    const skipBtn = this.querySelector('#btn-telemetry-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.skipTimer();
      });
    }
  }

  cleanup() {
    this.clearTimerLoop();
    this.isPaused = true;
    if (this._session) {
      this._session.isPaused = true;
    }
    if (this._lapKeyListener) {
      window.removeEventListener('keydown', this._lapKeyListener);
    }
    if (this._routePauseListener) {
      window.removeEventListener('hashchange', this._routePauseListener);
    }
    if (this._visibilityPauseListener) {
      document.removeEventListener('visibilitychange', this._visibilityPauseListener);
      window.removeEventListener('blur', this._visibilityPauseListener);
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  setupTimerLoop() {
    this.clearTimerLoop();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        if (this.timeLeft > 0) {
          this.timeLeft--;
          this._session.timeLeft = this.timeLeft;
          this.updateTimerDisplay();
        } else {
          this.handleTimerEnd();
        }
      }
    }, 1000);
  }

  clearTimerLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerVal = this.querySelector('#telemetry-countdown-value');
    if (timerVal) {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      timerVal.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  startHeatTiming() {
    const now = Date.now();
    this.heatStartTimestamp = now;
    this.pauseTimestamp = 0;

    // Initialize carryover timing or first passage triggers
    this.activeLanes.forEach((pilot, idx) => {
      if (!pilot) return;
      const lane = this.rotationOrder[idx];
      const stats = this.pilotStats[pilot.id];

      if (stats.totalLaps > 0 || stats.lapsHistory.length > 0 || stats.accumulatedLapTime > 0) {
        this.laneRunStarted[lane.number] = true;
        this.laneLastLapTime[lane.number] = now - (stats.accumulatedLapTime * 1000);
        stats.lastLapTimeLeft = this.timeLeft;
      } else {
        this.laneRunStarted[lane.number] = false;
        this.laneLastLapTime[lane.number] = 0;
        stats.lastLapTimeLeft = this.timeLeft;
        stats.accumulatedLapTime = 0;
      }
    });
  }

  toggleStartPause() {
    this.isPaused = !this.isPaused;
    this._session.isPaused = this.isPaused;

    if (!this.isInterval) {
      const now = Date.now();
      if (!this.isPaused) {
        // Resuming or Starting Heat
        if (!this.isHeatStarted) {
          this.isHeatStarted = true;
          this._session.isHeatStarted = true;
          this.startHeatTiming();
        } else {
          // Resuming from pause
          if (this.pauseTimestamp > 0) {
            const pauseDuration = now - this.pauseTimestamp;
            this.rotationOrder.forEach(lane => {
              if (this.laneLastLapTime[lane.number] > 0) {
                this.laneLastLapTime[lane.number] += pauseDuration;
              }
            });
          }
          this.heatStartTimestamp = now;
        }
        this.pauseTimestamp = 0;
      } else {
        // Going from Running to Paused
        this.pauseTimestamp = now;
      }
    }

    this.updateControllerUI();
  }

  updateControllerUI() {
    const btn = this.querySelector('#btn-telemetry-start-pause');
    const statusText = this.querySelector('#telemetry-status-text');

    if (btn) {
      if (this.isPaused) {
        btn.className = 'btn btn-primary px-4 fw-bold d-flex align-items-center gap-2';
        btn.innerHTML = `<i class="mdi mdi-play fs-4"></i> ${window.t('race.telemetry.start_btn') || 'Iniciar'}`;
      } else {
        btn.className = 'btn btn-warning px-4 fw-bold d-flex align-items-center gap-2';
        btn.innerHTML = `<i class="mdi mdi-pause fs-4"></i> ${window.t('race.telemetry.pause_btn') || 'Pausar'}`;
      }
    }

    if (statusText) {
      if (this.isPaused) {
        statusText.className = 'badge border border-warning-subtle text-warning bg-warning bg-opacity-10 px-3 py-2 font-monospace fs-6';
        statusText.innerHTML = `<i class="mdi mdi-pause-circle-outline"></i> ${window.t('race.telemetry.paused') || 'PAUSADO'}`;
      } else {
        statusText.className = 'badge border border-success-subtle text-success bg-success bg-opacity-10 px-3 py-2 font-monospace fs-6';
        statusText.innerHTML = `<i class="mdi mdi-play-circle-outline"></i> ${window.t('race.telemetry.running') || 'CORRENDO'}`;
      }
    }

    // Toggle track status border glow on active lanes
    const gridContainer = this.querySelector('#active-lanes-grid');
    if (gridContainer) {
      if (this.isPaused) {
        gridContainer.classList.add('border-danger-glow');
        gridContainer.classList.remove('border-success-glow');
      } else {
        gridContainer.classList.remove('border-danger-glow');
        gridContainer.classList.add('border-success-glow');
      }
    }

    // Update all active lane triggers
    const triggerButtons = this.querySelectorAll('.btn-trigger-lane-lap');
    triggerButtons.forEach((triggerBtn, idx) => {
      const pilot = this.activeLanes[idx];
      triggerBtn.disabled = !pilot || this.isPaused || this.isInterval;
    });
  }

  skipTimer() {
    this.timeLeft = 0;
    this._session.timeLeft = 0;
    this.handleTimerEnd();
  }

  abortRace() {
    const confirmMsg = window.t('race.telemetry.reset_confirm') || 'Deseja realmente abortar a corrida atual? Os dados serão perdidos.';
    if (confirm(confirmMsg)) {
      this.dispatchEvent(new CustomEvent('resetRace', {
        bubbles: true,
        composed: true
      }));
    }
  }

  triggerLap(laneIndex) {
    if (this.isPaused || this.isInterval) return;
    const pilot = this.activeLanes[laneIndex];
    if (!pilot) return;

    const now = Date.now();
    const cutoff = parseFloat(this._session.cutoffTime) || 3.0;
    const laneNum = this.rotationOrder[laneIndex].number;

    if (!this.laneRunStarted[laneNum]) {
      // First crossing initiates the telemetry clock for this pilot in this heat
      this.laneRunStarted[laneNum] = true;
      this.laneLastLapTime[laneNum] = now;
      const stats = this.pilotStats[pilot.id];
      stats.lastLapTimeLeft = this.timeLeft;
      stats.accumulatedLapTime = 0;
      this.renderActiveLanes();
      return;
    }

    const elapsed = (now - this.laneLastLapTime[laneNum]) / 1000;
    if (elapsed < cutoff) {
      // Cut-off threshold filtering
      return;
    }

    this.laneLastLapTime[laneNum] = now;

    // Add valid lap to statistics
    const stats = this.pilotStats[pilot.id];
    stats.lapsByHeat[this.currentHeat - 1]++;
    stats.totalLaps++;
    stats.lapsHistory.push(elapsed);
    stats.avgLapCount++;
    stats.avgLapSum += elapsed;
    if (stats.bestLap === null || elapsed < stats.bestLap) {
      stats.bestLap = elapsed;
    }
    const currentHeatIdx = this.currentHeat - 1;
    if (stats.bestLapByHeat[currentHeatIdx] === null || elapsed < stats.bestLapByHeat[currentHeatIdx]) {
      stats.bestLapByHeat[currentHeatIdx] = elapsed;
    }

    // Reset accumulated lap metrics for the new lap
    stats.accumulatedLapTime = 0;
    stats.lastLapTimeLeft = this.timeLeft;

    this.renderActiveLanes();
    this.renderLeaderboard();
  }

  handleTimerEnd() {
    this.isPaused = true;
    this._session.isPaused = true;
    this.clearTimerLoop();
    this.updateControllerUI();

    // If it was an interval, go to the next heat automatically
    if (this.isInterval) {
      this.isInterval = false;
      this._session.isInterval = false;
      this.timeLeft = this._session.heatTime;
      this._session.timeLeft = this.timeLeft;
      this.isPaused = false; // Start heat automatically!
      this._session.isPaused = false;
      this.isHeatStarted = true;
      this._session.isHeatStarted = true;
      this.startHeatTiming(); // Initialize carryover timing!
      this.setupTimerLoop();
      this.render();
      return;
    }

    // It was a heat. Pause and prompt exit/rotation modals
    // Save accumulated unfinished lap time for all active pilots
    this.activeLanes.forEach((pilot, idx) => {
      if (!pilot) return;
      const lane = this.rotationOrder[idx];
      const stats = this.pilotStats[pilot.id];
      if (this.laneRunStarted[lane.number]) {
        const timeSpent = stats.lastLapTimeLeft - this.timeLeft;
        stats.accumulatedLapTime += timeSpent;
      } else if (stats.totalLaps > 0 || stats.lapsHistory.length > 0 || stats.accumulatedLapTime > 0) {
        const timeSpent = stats.lastLapTimeLeft - this.timeLeft;
        stats.accumulatedLapTime += timeSpent;
      }
      stats.lastLapTimeLeft = 0;
    });

    const N = this._session.pilots.length;
    const L = this.rotationOrder.length;

    if (this.currentHeat === this.activeHeatsCount) {
      // Race is completely finished! Show final zone inputs for all active pilots!
      this.showFinalZonesModal();
    } else {
      // Intermediate heat end.
      if (N > L) {
        // Deck rotation: Exiting pilot goes to deck, needs exit zone modal
        const exitingPilot = this.activeLanes[L - 1];
        if (exitingPilot) {
          this.showRotationZoneModal(exitingPilot);
        } else {
          this.performRotation(0);
        }
      } else {
        // No deck rotation: simple closed-loop rotation. No zone required!
        this.performRotation(0);
      }
    }
  }

  showRotationZoneModal(pilot) {
    // Create bootstrap modal dynamically
    let modalEl = document.getElementById('modal-rotation-zone');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'modal-rotation-zone';
      modalEl.className = 'modal fade';
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('data-bs-backdrop', 'static');
      document.body.appendChild(modalEl);
    }

    const titleText = (window.t('race.telemetry.modal_rotation_title') || 'Fim da Bateria {heat} - Rodízio')
      .replace('{heat}', this.currentHeat);
    const descText = (window.t('race.telemetry.modal_rotation_desc') || 'O piloto <strong>{pilot}</strong> completou sua fenda e irá para o DECK. Digite a zona final onde o carro parou.')
      .replace('{pilot}', pilot.nickname || pilot.name);

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-secondary-subtle">
          <div class="modal-header border-secondary-subtle bg-body-tertiary">
            <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2">
              <i class="mdi mdi-swap-horizontal text-primary fs-4"></i>
              ${titleText}
            </h5>
          </div>
          <div class="modal-body text-start">
            <p class="text-secondary small mb-3">${descText}</p>
            <div class="mb-3">
              <label for="input-rotation-zone" class="form-label fw-semibold small text-secondary">${window.t('race.telemetry.modal_zone_label') || 'Zona de Parada'}</label>
              <input type="number" min="0" max="100" class="form-control p-2" id="input-rotation-zone" value="0" required>
              <div class="small text-secondary mt-1.5" style="font-size: 0.75rem;">
                ${window.t('race.telemetry.modal_zone_help') || 'Insira o setor em que o piloto parou para iniciar com o mesmo fractional lap ao re-entrar.'}
              </div>
            </div>
          </div>
          <div class="modal-footer border-secondary-subtle">
            <button type="button" id="btn-confirm-rotation" class="btn btn-primary px-4 fw-semibold">
              ${window.t('race.telemetry.confirm_rotation') || 'Confirmar Rodízio'}
            </button>
          </div>
        </div>
      </div>
    `;

    let modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(modalEl);
    }
    modalInstance.show();

    const confirmBtn = modalEl.querySelector('#btn-confirm-rotation');
    const zoneInput = modalEl.querySelector('#input-rotation-zone');

    if (confirmBtn && zoneInput) {
      confirmBtn.onclick = () => {
        const zoneVal = parseInt(zoneInput.value) || 0;
        modalInstance.hide();
        this.performRotation(zoneVal);
      };
    }
  }

  performRotation(exitingPilotZone) {
    const L = this.rotationOrder.length;
    const N = this._session.pilots.length;

    // Reset lane timing configurations
    this.rotationOrder.forEach(lane => {
      this.laneLastLapTime[lane.number] = 0;
      this.laneRunStarted[lane.number] = false;
    });

    if (N > L) {
      // Rotation with DECK
      const exitingPilot = this.activeLanes[L - 1];
      if (exitingPilot) {
        // Record exit zone as their final zone (representing their score up to this exit)
        this.pilotStats[exitingPilot.id].finalZone = exitingPilotZone;
        // Exiting pilot goes to the bottom of the deck
        this.deckState.push(exitingPilot);
      }

      // Shift active lanes index 0 to L-2 forward to 1 to L-1
      for (let i = L - 1; i > 0; i--) {
        this.activeLanes[i] = this.activeLanes[i - 1];
      }

      // Pop the top of the deck to entry lane (index 0)
      this.activeLanes[0] = this.deckState.shift();
    } else {
      // Closed loop rotation (N <= L)
      const exitingPilot = this.activeLanes[L - 1];
      
      // Shift active lanes index 0 to L-2 forward
      for (let i = L - 1; i > 0; i--) {
        this.activeLanes[i] = this.activeLanes[i - 1];
      }

      // Last lane pilot rotates to index 0 (closed loop)
      this.activeLanes[0] = exitingPilot;
    }

    // Set Interval state
    this.currentHeat++;
    this._session.currentHeat = this.currentHeat;
    this.isInterval = true;
    this._session.isInterval = true;
    this.timeLeft = this._session.intervalTime;
    this._session.timeLeft = this.timeLeft;
    this.isPaused = false; // Start interval automatically!
    this._session.isPaused = false;
    this.isHeatStarted = false; // Reset heat started flag!
    this._session.isHeatStarted = false;

    this.setupTimerLoop();
    this.render();
  }

  showFinalZonesModal() {
    let modalEl = document.getElementById('modal-final-zones');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'modal-final-zones';
      modalEl.className = 'modal fade';
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('data-bs-backdrop', 'static');
      document.body.appendChild(modalEl);
    }

    const activePilots = this.activeLanes.filter(p => p !== null);

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-secondary-subtle">
          <div class="modal-header border-secondary-subtle bg-body-tertiary">
            <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2">
              <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
              ${window.t('race.results.modal_final_title') || 'Fim da Corrida - Zonas Finais'}
            </h5>
          </div>
          <div class="modal-body text-start">
            <p class="text-secondary small mb-3">${window.t('race.results.modal_final_desc') || 'Insira a zona física final onde os carros de cada piloto pararam na última bateria:'}</p>
            <div id="final-zones-inputs-list" class="d-flex flex-column gap-3">
              ${activePilots.map(pilot => `
                <div class="row align-items-center">
                  <div class="col-6">
                    <span class="fw-semibold text-body-emphasis small">${pilot.nickname || pilot.name}</span>
                  </div>
                  <div class="col-6">
                    <input type="number" min="0" max="100" class="form-control p-1.5 font-monospace final-zone-input" data-pilot-id="${pilot.id}" value="0">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer border-secondary-subtle">
            <button type="button" id="btn-confirm-final" class="btn btn-success px-4 fw-semibold">
              ${window.t('race.results.confirm_final') || 'Confirmar Resultados'}
            </button>
          </div>
        </div>
      </div>
    `;

    let modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(modalEl);
    }
    modalInstance.show();

    const confirmBtn = modalEl.querySelector('#btn-confirm-final');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const inputs = modalEl.querySelectorAll('.final-zone-input');
        inputs.forEach(input => {
          const pilotId = input.getAttribute('data-pilot-id');
          const zoneVal = parseInt(input.value) || 0;
          this.pilotStats[pilotId].finalZone = zoneVal;
        });

        modalInstance.hide();
        this.concludeRace();
      };
    }
  }

  concludeRace() {
    this.clearTimerLoop();

    // Compile and calculate final standings:
    // Standings are sorted by totalLaps (descending), then finalZone (descending), then bestLap (ascending, with nulls last)
    const standings = Object.values(this.pilotStats).map(stats => {
      const avgLap = stats.avgLapCount > 0 ? stats.avgLapSum / stats.avgLapCount : 0;
      return {
        pilot: stats.pilot,
        totalLaps: stats.totalLaps,
        finalZone: stats.finalZone,
        bestLap: stats.bestLap,
        avgLap: avgLap,
        score: stats.totalLaps + (stats.finalZone / 100) // represented as 156.42 score (laps + fractional lap zone)
      };
    });

    standings.sort((a, b) => {
      // 1. Laps (descending)
      if (b.totalLaps !== a.totalLaps) {
        return b.totalLaps - a.totalLaps;
      }
      // 2. Zone (descending)
      if (b.finalZone !== a.finalZone) {
        return b.finalZone - a.finalZone;
      }
      // 3. Best lap time (ascending, nulls are worst)
      const bBest = b.bestLap === null ? Infinity : b.bestLap;
      const aBest = a.bestLap === null ? Infinity : a.bestLap;
      return aBest - bBest;
    });

    this.dispatchEvent(new CustomEvent('telemetryFinished', {
      bubbles: true,
      composed: true,
      detail: {
        raceName: this._session.raceName,
        track: this._session.track,
        date: new Date().toLocaleDateString(),
        standings
      }
    }));
  }

  renderActiveLanes() {
    const lanesContainer = this.querySelector('#telemetry-active-lanes');
    if (!lanesContainer) return;

    // Find the minimum heat lap recorded in the CURRENT heat across all active pilots
    let bestHeatLapOverall = Infinity;
    this.activeLanes.forEach(pilot => {
      if (!pilot) return;
      const stats = this.pilotStats[pilot.id];
      const heatBest = stats.bestLapByHeat[this.currentHeat - 1];
      if (heatBest !== null && heatBest < bestHeatLapOverall) {
        bestHeatLapOverall = heatBest;
      }
    });

    lanesContainer.innerHTML = '';
    this.activeLanes.forEach((pilot, idx) => {
      const lane = this.rotationOrder[idx];
      const isLaneActive = pilot !== null;

      let lapsStr = '0';
      let bestLapStr = '--.---';
      let lastLapStr = '--.---';
      let avgLapStr = '--.---';
      let isReady = false;
      let isBestHeatLap = false;

      if (pilot) {
        const stats = this.pilotStats[pilot.id];
        lapsStr = stats.lapsByHeat[this.currentHeat - 1].toString();
        
        const heatBest = stats.bestLapByHeat[this.currentHeat - 1];
        bestLapStr = heatBest !== null ? `${heatBest.toFixed(3)}s` : '--.---';
        if (heatBest !== null && bestHeatLapOverall !== Infinity && heatBest === bestHeatLapOverall) {
          isBestHeatLap = true;
        }

        const validLaps = stats.lapsHistory;
        lastLapStr = validLaps.length > 0 ? `${validLaps[validLaps.length - 1].toFixed(3)}s` : '--.---';

        const avgVal = stats.avgLapCount > 0 ? stats.avgLapSum / stats.avgLapCount : 0;
        avgLapStr = avgVal > 0 ? `${avgVal.toFixed(3)}s` : '--.---';

        isReady = this.laneRunStarted[lane.number];
      }

      const row = document.createElement('div');
      row.className = `card border-secondary-subtle bg-dark mb-2.5 p-3 d-flex flex-row justify-content-between align-items-center position-relative ${isReady ? 'border-primary border-opacity-25' : ''}`;
      
      // Highlight timing block if this pilot has the fastest lap of the current heat
      const bestLapHtml = isBestHeatLap ? `
        <div class="fw-extrabold text-purple animate-pulse d-flex align-items-center justify-content-center gap-1" style="font-size: 0.85rem; color: #da18fd !important; text-shadow: 0 0 8px rgba(218, 24, 253, 0.4);">
          <i class="mdi mdi-flash" style="font-size: 0.85rem;"></i> ${bestLapStr}
        </div>
      ` : `
        <div class="fw-bold text-primary" style="font-size: 0.85rem;">${bestLapStr}</div>
      `;

      // Neon/Glass layout for active lane rows
      row.innerHTML = `
        <!-- Far Left: Custom lane identifier -->
        <div class="d-flex align-items-center gap-3" style="width: 32%;">
          <!-- Custom track rail swatch -->
          <div class="d-flex align-items-center justify-content-center border border-secondary-subtle flex-shrink-0" style="width: 42px; height: 30px; background-color: #1a1a1a; border-radius: 6px;">
            <span style="width: 3px; height: 16px; background-color: ${lane.color}; margin-right: 3px; border-radius: 1px;"></span>
            <span style="width: 3px; height: 16px; background-color: ${lane.color}; border-radius: 1px;"></span>
          </div>

          <div class="overflow-hidden">
            <div class="small fw-bold text-uppercase font-monospace text-secondary-50" style="font-size: 0.65rem; color: ${lane.color}cc !important;">
              ${window.t('registrations.tracks_modal.lane_label') || 'Fenda'} ${lane.number}
            </div>
            <h5 class="fw-bold mb-0 text-truncate text-start" style="color: ${lane.color} !important; font-size: 1.15rem; line-height: 1.2;">
              ${isLaneActive ? (pilot.nickname || pilot.name) : '<span class="text-secondary opacity-30">Fenda Vazia</span>'}
            </h5>
            ${isLaneActive && pilot.nickname ? `<div class="text-secondary font-monospace" style="font-size: 0.65rem; text-align: left;">(${pilot.name})</div>` : ''}
          </div>
        </div>

        <!-- Center: Laps count -->
        <div class="text-center d-flex flex-column align-items-center justify-content-center" style="width: 18%;">
          <div class="fs-1 fw-extrabold font-monospace text-body-emphasis line-height-1" style="font-size: 2.2rem; line-height: 1;">${lapsStr}</div>
          <div class="small text-secondary text-uppercase fw-bold font-monospace" style="font-size: 0.6rem;">${window.t('race.qualifying.laps_count_col') || 'Voltas'}</div>
        </div>

        <!-- Center Right: Timing statistics -->
        <div class="d-flex align-items-center gap-4 text-center justify-content-center font-monospace small" style="width: 35%;">
          <div style="width: 30%;">
            <div class="text-secondary-50 fw-semibold text-uppercase" style="font-size: 0.6rem;">${window.t('race.telemetry.best_lap_abbr') || 'Melhor'}</div>
            ${bestLapHtml}
          </div>
          <div style="width: 30%;">
            <div class="text-secondary-50 fw-semibold text-uppercase" style="font-size: 0.6rem;">Última</div>
            <div class="text-body-emphasis fw-bold" style="font-size: 0.85rem;">${lastLapStr}</div>
          </div>
          <div style="width: 30%;">
            <div class="text-secondary-50 fw-semibold text-uppercase" style="font-size: 0.6rem;">${window.t('race.telemetry.avg_lap_abbr') || 'Média'}</div>
            <div class="text-secondary fw-bold" style="font-size: 0.85rem;">${avgLapStr}</div>
          </div>
        </div>

        <!-- Far Right: Simulation click button -->
        <div style="width: 12%;" class="text-end">
          <button class="btn btn-sm btn-outline-secondary btn-trigger-lane-lap px-2.5 py-1.5 fw-bold font-monospace" style="font-size: 0.7rem;" ${!isLaneActive || this.isPaused || this.isInterval ? 'disabled' : ''}>
            ${isReady ? `TRIGGER <span class="badge bg-secondary ms-1">${lane.number}</span>` : 'INICIAR'}
          </button>
        </div>
      `;

      const triggerBtn = row.querySelector('.btn-trigger-lane-lap');
      if (triggerBtn) {
        triggerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.triggerLap(idx);
        });
      }

      lanesContainer.appendChild(row);
    });
  }

  renderLeaderboard() {
    const boardContainer = this.querySelector('#telemetry-leaderboard');
    if (!boardContainer) return;

    // Standings are sorted by totalLaps (descending), then bestLap (ascending, nulls last)
    const standings = Object.values(this.pilotStats).sort((a, b) => {
      if (b.totalLaps !== a.totalLaps) {
        return b.totalLaps - a.totalLaps;
      }
      const bBest = b.bestLap === null ? Infinity : b.bestLap;
      const aBest = a.bestLap === null ? Infinity : a.bestLap;
      return aBest - bBest;
    });

    boardContainer.innerHTML = '';
    standings.forEach((entry, idx) => {
      const bestLapStr = entry.bestLap !== null ? `${entry.bestLap.toFixed(3)}s` : '--.---';
      const isExiting = this.activeLanes[this.activeLanes.length - 1]?.id === entry.pilot.id;

      // Find if active and which lane they are currently in
      const activeIdx = this.activeLanes.findIndex(p => p?.id === entry.pilot.id);
      let laneStr = '';
      if (activeIdx !== -1) {
        const laneNum = this.rotationOrder[activeIdx].number;
        const color = this.rotationOrder[activeIdx].color;
        laneStr = `<span class="badge border border-opacity-25" style="border-color: ${color} !important; color: ${color} !important; background-color: ${color}15; font-size: 0.65rem;">F${laneNum}</span>`;
      } else {
        laneStr = `<span class="badge bg-secondary border border-secondary-subtle text-secondary-emphasis" style="font-size: 0.65rem;">DECK</span>`;
      }

      const li = document.createElement('div');
      li.className = `d-flex align-items-center justify-content-between p-2 rounded-2 mb-2 bg-body-secondary bg-opacity-25 border border-secondary-subtle border-opacity-10 small font-monospace ${activeIdx !== -1 ? 'border-primary border-opacity-10' : ''}`;
      
      li.innerHTML = `
        <div class="d-flex align-items-center gap-2 overflow-hidden" style="width: 60%;">
          <span class="fw-bold text-secondary" style="font-size: 0.75rem;">${idx + 1}</span>
          ${laneStr}
          <span class="fw-semibold text-body-emphasis text-truncate small" style="text-align: left; display: inline-block;">${entry.pilot.nickname || entry.pilot.name}</span>
        </div>
        <div class="d-flex align-items-center gap-3 text-end" style="width: 40%; justify-content-end;">
          <div>
            <span class="text-secondary small" style="font-size: 0.7rem;">${window.t('race.telemetry.laps_abbr') || 'V'}:</span>
            <strong class="text-body-emphasis fw-bold" style="font-size: 0.85rem;">${entry.totalLaps}</strong>
          </div>
          <div>
            <span class="text-secondary small" style="font-size: 0.7rem;">${window.t('race.telemetry.best_lap_abbr') || 'Melhor'}:</span>
            <strong class="text-primary fw-bold" style="font-size: 0.85rem;">${bestLapStr}</strong>
          </div>
        </div>
      `;

      boardContainer.appendChild(li);
    });
  }

  renderDeck() {
    const deckContainer = this.querySelector('#telemetry-deck');
    if (!deckContainer) return;

    deckContainer.innerHTML = '';
    if (this.deckState.length === 0) {
      deckContainer.innerHTML = `
        <div class="small text-secondary py-3 text-center border border-dashed border-secondary-subtle border-opacity-20 rounded-3">
          <i class="mdi mdi-check-all me-1"></i> Sem pilotos no DECK.
        </div>
      `;
      return;
    }

    this.deckState.forEach((pilot, idx) => {
      const orderWord = idx === 0 ? 
        (window.t('race.telemetry.first_to_enter') || '1º a entrar') : 
        `${idx + 1}${window.t('race.telemetry.next_to_enter') || 'º a entrar'}`;

      const card = document.createElement('div');
      card.className = 'd-flex align-items-center justify-content-between p-2 border border-secondary-subtle rounded-2 mb-2 bg-body-tertiary shadow-sm';
      card.innerHTML = `
        <div class="overflow-hidden me-2 text-start">
          <h6 class="fw-bold mb-0 text-body-emphasis text-truncate small">${pilot.nickname || pilot.name}</h6>
          ${pilot.nickname ? `<div class="text-secondary font-monospace" style="font-size: 0.65rem;">(${pilot.name})</div>` : ''}
        </div>
        <span class="badge border border-secondary-subtle text-secondary small fw-semibold font-monospace bg-dark bg-opacity-20">${orderWord}</span>
      `;
      deckContainer.appendChild(card);
    });
  }

  render() {
    if (!this._session) return;
    
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const track = this._session.track;
    const statusTextHtml = this.isPaused ? 
      `<span id="telemetry-status-text" class="badge border border-warning-subtle text-warning bg-warning bg-opacity-10 px-3 py-2 font-monospace fs-6"><i class="mdi mdi-pause-circle-outline"></i> ${window.t('race.telemetry.paused') || 'PAUSADO'}</span>` : 
      `<span id="telemetry-status-text" class="badge border border-success-subtle text-success bg-success bg-opacity-10 px-3 py-2 font-monospace fs-6"><i class="mdi mdi-play-circle-outline"></i> ${window.t('race.telemetry.running') || 'CORRENDO'}</span>`;

    const startPauseBtnHtml = this.isPaused ?
      `<button id="btn-telemetry-start-pause" class="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2">
        <i class="mdi mdi-play fs-4"></i> ${window.t('race.telemetry.start_btn') || 'Iniciar'}
      </button>` :
      `<button id="btn-telemetry-start-pause" class="btn btn-warning px-4 fw-bold d-flex align-items-center gap-2">
        <i class="mdi mdi-pause fs-4"></i> ${window.t('race.telemetry.pause_btn') || 'Pausar'}
      </button>`;

    const activeGridClass = this.isPaused ? 'border-danger-glow' : 'border-success-glow';

    this.innerHTML = `
      <div class="row fade-in">
        <!-- Center Dashboard Area -->
        <div class="col-12 col-xl-8 mb-4">
          
          <!-- Telemetry HUD Controls -->
          <div class="card bg-body-tertiary border-secondary-subtle shadow-sm mb-4">
            <div class="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              
              <!-- Left HUD Details -->
              <div class="d-flex align-items-center gap-3">
                <div class="bg-body-secondary p-2.5 border border-secondary-subtle rounded-3 text-center" style="min-width: 100px;">
                  <div class="text-secondary small fw-bold text-uppercase font-monospace" style="font-size: 0.6rem;">${this.isInterval ? (window.t('race.telemetry.interval_label') || 'INTERVALO') : (window.t('race.telemetry.heat_label') || 'BATERIA')}</div>
                  <div class="fs-4 fw-extrabold text-body-emphasis line-height-1" style="line-height: 1;">${this.currentHeat} <span class="text-secondary opacity-40 fs-6">/ ${this.activeHeatsCount}</span></div>
                </div>
                <div>
                  <h5 class="fw-bold mb-0 text-body-emphasis text-start">${this._session.raceName}</h5>
                  <div class="small text-secondary text-start"><i class="mdi mdi-flag-checkered me-1"></i> ${track.name} &nbsp;|&nbsp; Scale ${track.scale}</div>
                </div>
              </div>
 
              <!-- Main Timer Clock -->
              <div class="d-flex align-items-center gap-3">
                <div class="bg-dark border border-secondary-subtle px-4 py-1.5 rounded-4" style="min-width: 160px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                  <div id="telemetry-countdown-value" class="fs-1 fw-bold font-monospace text-primary text-center line-height-1" style="font-size: 2.8rem; line-height: 1; letter-spacing: 2px; text-shadow: 0 0 10px rgba(var(--bs-primary-rgb), 0.35);">${formattedTimer}</div>
                </div>
                ${statusTextHtml}
              </div>
 
              <!-- Action buttons -->
              <div class="d-flex align-items-center gap-2">
                ${startPauseBtnHtml}
                <button id="btn-telemetry-skip" class="btn btn-outline-secondary px-2.5 py-2 fw-semibold" title="Pular tempo">
                  <i class="mdi mdi-skip-next fs-5"></i>
                </button>
              </div>
 
            </div>
          </div>
 
          <!-- Active Lanes Container -->
          <div id="active-lanes-grid" class="border border-secondary-subtle bg-body-tertiary bg-opacity-25 rounded-4 p-3 ${activeGridClass}" style="transition: border-color 0.25s ease, box-shadow 0.25s ease;">
            <div id="telemetry-active-lanes">
              <!-- Loaded dynamically via JS -->
            </div>

            <!-- Footer indicator -->
            <div class="small text-secondary text-center mt-3" style="font-size: 0.75rem;">
              <i class="mdi mdi-keyboard-variant text-primary me-1"></i>
              Use as teclas numéricas <strong>1</strong> a <strong>8</strong> no teclado para disparar passagens manuais de voltas nas fendas.
            </div>
          </div>

        </div>

        <!-- Sidebar panels -->
        <div class="col-12 col-xl-4 mb-4">
          
          <!-- Live standings Leaderboard -->
          <div class="card bg-body-tertiary border-secondary-subtle shadow-sm mb-4">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3">
              <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <i class="mdi mdi-podium text-primary fs-5"></i>
                ${window.t('race.telemetry.leaderboard_title') || 'Classificação Geral'}
              </h6>
            </div>
            <div class="card-body p-3 overflow-y-auto" style="max-height: 280px;" id="telemetry-leaderboard">
              <!-- Loaded dynamically -->
            </div>
          </div>

          <!-- Deck panel -->
          <div class="card bg-body-tertiary border-secondary-subtle shadow-sm">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3">
              <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <i class="mdi mdi-layers-outline text-primary fs-5"></i>
                ${window.t('race.telemetry.deck_title') || 'DECK (Bench)'}
              </h6>
            </div>
            <div class="card-body p-3 overflow-y-auto" style="max-height: 250px;" id="telemetry-deck">
              <!-- Loaded dynamically -->
            </div>
          </div>

        </div>
      </div>

      <style>
        .border-danger-glow {
          border-color: rgba(220, 53, 69, 0.25) !important;
          box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.05);
        }
        .border-success-glow {
          border-color: var(--bs-primary) !important;
          box-shadow: 0 0 15px rgba(var(--bs-primary-rgb), 0.15);
        }
        .line-height-1 {
          line-height: 1 !important;
        }
      </style>
    `;

    this.renderActiveLanes();
    this.renderLeaderboard();
    this.renderDeck();
    this.setupDomEvents();
  }
}

customElements.define('slotrace-race-telemetry', SlotRaceRaceTelemetry);

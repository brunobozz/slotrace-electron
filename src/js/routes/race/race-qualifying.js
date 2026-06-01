class SlotRaceRaceQualifying extends HTMLElement {
  set session(value) {
    this._session = value;
    this.init();
  }

  get session() {
    return this._session;
  }

  init() {
    if (!this._session) return;
    this.pilots = [...this._session.pilots];
    
    // Restore or initialize qualifying state properties directly in session to survive transitions!
    if (!this._session.qualifyingOrder) {
      this._session.qualifyingOrder = [];
    }
    if (this._session.activePilotIndex === undefined || this._session.activePilotIndex === null) {
      this._session.activePilotIndex = -1;
    }
    if (!this._session.pilotLaps) {
      this._session.pilotLaps = {};
    }
    if (this._session.isRunStarted === undefined || this._session.isRunStarted === null) {
      this._session.isRunStarted = false;
    }

    this.qualifyingOrder = this._session.qualifyingOrder;
    this.activePilotIndex = this._session.activePilotIndex;
    this.pilotLaps = this._session.pilotLaps;
    this.isRunStarted = this._session.isRunStarted;
    this.lastLapTimestamp = 0;

    this.render();
    this.setupEvents();

    // If qualifying was already drafted, restore the active pilot view and leaderboard immediately!
    if (this.qualifyingOrder && this.qualifyingOrder.length > 0) {
      this.updateActivePilotView();
      this.updateLeaderboard();
    }
  }

  setupEvents() {
    const shuffleBtn = this.querySelector('#btn-shuffle-qualifying');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        this.shuffleOrder();
      });
    }

    // Keyboard listener for Space or Enter to trigger manual laps
    this._keyListener = (e) => {
      if (this.activePilotIndex >= 0 && this.activePilotIndex < this.qualifyingOrder.length) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.triggerQualifyingLap();
        }
      }
    };
    window.addEventListener('keydown', this._keyListener);
  }

  cleanup() {
    if (this._keyListener) {
      window.removeEventListener('keydown', this._keyListener);
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  shuffleOrder() {
    const shuffled = [...this.pilots];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    this._session.qualifyingOrder = shuffled;
    this._session.activePilotIndex = 0;
    this._session.pilotLaps = {};
    shuffled.forEach(p => {
      this._session.pilotLaps[p.id] = [];
    });
    this._session.isRunStarted = false;

    this.qualifyingOrder = this._session.qualifyingOrder;
    this.activePilotIndex = this._session.activePilotIndex;
    this.pilotLaps = this._session.pilotLaps;
    this.isRunStarted = this._session.isRunStarted;
    this.lastLapTimestamp = 0;

    this.dispatchEvent(new CustomEvent('qualifyingModified', {
      bubbles: true,
      composed: true
    }));

    // Show alert
    const alertDiv = this.querySelector('#qualifying-alert-container');
    if (alertDiv) {
      alertDiv.innerHTML = `
        <div class="alert alert-success border-success-subtle bg-success bg-opacity-10 py-2 px-3 small mb-3 text-success-emphasis text-center fw-semibold">
          <i class="mdi mdi-shuffle me-1"></i> ${window.t('race.qualifying.shuffled_alert') || 'Ordem dos pilotos sorteada com sucesso!'}
        </div>
      `;
      setTimeout(() => {
        alertDiv.innerHTML = '';
      }, 3000);
    }

    this.updateActivePilotView();
    this.updateLeaderboard();
  }

  triggerQualifyingLap() {
    const pilot = this.qualifyingOrder[this.activePilotIndex];
    if (!pilot) return;

    const now = Date.now();
    const cutoff = parseFloat(this._session.cutoffTime) || 3.0;

    if (!this.isRunStarted) {
      // First trigger represents pilot crossing line to start qualifying!
      this.isRunStarted = true;
      this._session.isRunStarted = true;
      this.lastLapTimestamp = now;
      this.updateActivePilotView();
      this.dispatchEvent(new CustomEvent('qualifyingModified', {
        bubbles: true,
        composed: true
      }));
      return;
    }

    const lapTime = (now - this.lastLapTimestamp) / 1000;
    
    // Check cut-off minimum lap time
    if (lapTime < cutoff) {
      // Reject lap (too fast, e.g. noise or false trigger)
      console.log(`Lap rejected (below cutoff): ${lapTime.toFixed(3)}s`);
      return;
    }

    this.lastLapTimestamp = now;
    this.pilotLaps[pilot.id].push(lapTime);

    this.updateActivePilotView();
    this.updateLeaderboard();
  }

  simulateLapTime() {
    // Clickable button trigger simulation
    const pilot = this.qualifyingOrder[this.activePilotIndex];
    if (!pilot) return;

    if (!this.isRunStarted) {
      this.isRunStarted = true;
      this._session.isRunStarted = true;
      this.lastLapTimestamp = Date.now();
      this.updateActivePilotView();
      this.dispatchEvent(new CustomEvent('qualifyingModified', {
        bubbles: true,
        composed: true
      }));
      return;
    }

    // Generate a random valid lap time between 4.2 and 5.8 seconds
    const simulatedTime = 4.2 + Math.random() * 1.6;
    this.pilotLaps[pilot.id].push(simulatedTime);
    this.lastLapTimestamp = Date.now();

    this.updateActivePilotView();
    this.updateLeaderboard();
  }

  getBestLap(pilotId) {
    const laps = this.pilotLaps[pilotId] || [];
    if (laps.length === 0) return null;
    return Math.min(...laps);
  }

  nextPilot() {
    if (this.activePilotIndex < this.qualifyingOrder.length - 1) {
      this.activePilotIndex++;
      this._session.activePilotIndex = this.activePilotIndex;
      this.isRunStarted = false;
      this._session.isRunStarted = false;
      this.lastLapTimestamp = 0;
      this.updateActivePilotView();
    }
  }

  finishQualifying() {
    // Compile standings
    const standings = this.qualifyingOrder.map(pilot => {
      const bestLap = this.getBestLap(pilot.id);
      return {
        pilot,
        bestLap: bestLap !== null ? bestLap : Infinity,
        lapsCount: (this.pilotLaps[pilot.id] || []).length
      };
    });

    // Sort by bestLap ascending
    standings.sort((a, b) => a.bestLap - b.bestLap);

    const track = this._session.track;
    const L = parseInt(track.lanes) || 0;
    const N = standings.length;

    let startingGrid = [];
    let deck = [];

    // The standings list of pilots sorted best to worst
    const rankedPilots = standings.map(s => s.pilot);

    if (N <= L) {
      // P1 to P_N on starting lanes directly
      startingGrid = [...rankedPilots];
    } else {
      const D = N - L;
      // Active lanes (ordered 0 to L-1) get P_{D+1} to P_N
      for (let i = 0; i < L; i++) {
        startingGrid.push(rankedPilots[D + i]);
      }
      // Deck gets P_D down to P_1
      for (let j = 0; j < D; j++) {
        deck.push(rankedPilots[D - 1 - j]);
      }
    }

    this.dispatchEvent(new CustomEvent('qualifyingFinished', {
      bubbles: true,
      composed: true,
      detail: {
        standings,
        startingGrid,
        deck
      }
    }));
  }

  updateActivePilotView() {
    const activeContainer = this.querySelector('#active-pilot-container');
    if (!activeContainer) return;

    if (this.activePilotIndex < 0 || this.activePilotIndex >= this.qualifyingOrder.length) {
      activeContainer.innerHTML = '';
      return;
    }

    const pilot = this.qualifyingOrder[this.activePilotIndex];
    const laps = this.pilotLaps[pilot.id] || [];
    const bestLap = this.getBestLap(pilot.id);
    const bestLapStr = bestLap !== null ? `${bestLap.toFixed(3)}s` : '--.---';

    const isLastPilot = this.activePilotIndex === this.qualifyingOrder.length - 1;
    const hasLaps = laps.length > 0;

    activeContainer.innerHTML = `
      <div class="card border-primary border-opacity-50 shadow-sm p-4 bg-body-tertiary">
        <div class="text-center mb-4">
          <div class="small fw-bold text-primary text-uppercase font-monospace mb-1">
            ${window.t('race.qualifying.active_pilot') || 'Piloto na Fenda'} (${this.activePilotIndex + 1} / ${this.qualifyingOrder.length})
          </div>
          <h2 class="fw-bold text-body-emphasis mb-1">${pilot.nickname ? pilot.nickname : pilot.name}</h2>
          ${pilot.nickname ? `<div class="small text-secondary fw-semibold mb-2">(${pilot.name})</div>` : ''}
        </div>

        <div class="row align-items-center mb-4 text-center">
          <div class="col-6 border-end border-secondary-subtle border-opacity-20">
            <div class="small fw-semibold text-secondary mb-1">${window.t('race.qualifying.best_lap_col') || 'Melhor Volta'}</div>
            <div class="fs-1 fw-bold font-monospace text-primary" style="text-shadow: 0 0 10px rgba(var(--bs-primary-rgb), 0.2);">${bestLapStr}</div>
          </div>
          <div class="col-6">
            <div class="small fw-semibold text-secondary mb-1">${window.t('race.qualifying.laps_count_col') || 'Voltas'}</div>
            <div class="fs-1 fw-bold font-monospace text-body-emphasis">${laps.length}</div>
          </div>
        </div>

        <!-- Simulated Timing controls -->
        <div class="mb-4">
          <div class="d-grid gap-2 mb-2">
            <button id="btn-trigger-lap" class="btn btn-primary btn-lg fw-bold p-3 d-flex align-items-center justify-content-center gap-2">
              <i class="mdi mdi-timer-outline fs-4"></i>
              ${this.isRunStarted ? (window.t('race.qualifying.manual_trigger_btn') || 'Simular Volta (Espaço / Enter)') : 'INICIAR CRONOMETRAGEM (Cruzar Fenda)'}
            </button>
            <button id="btn-click-simulate" class="btn btn-outline-secondary fw-semibold">
              <i class="mdi mdi-laptop"></i> Simular por Clique (Tempo Aleatório)
            </button>
          </div>
          
          <div class="small text-secondary text-center">
            <i class="mdi mdi-keyboard-variant"></i> Pressione a barra de <strong>Espaço</strong> ou <strong>Enter</strong> para simular voltas em tempo real.
          </div>
        </div>

        <!-- Live laps list -->
        <div class="border border-secondary-subtle border-opacity-20 bg-body-secondary bg-opacity-25 rounded-3 p-3 mb-4 max-height-laps overflow-y-auto" style="max-height: 150px;">
          <h6 class="fw-bold text-secondary small mb-2">${window.t('race.qualifying.live_laps') || 'Voltas Registradas'}</h6>
          ${laps.length === 0 ? `
            <div class="small text-secondary py-2 text-center">
              ${!this.isRunStarted ? 'Aguardando o piloto cruzar a fenda de largada.' : 'Nenhuma volta cronometrada ainda.'}
            </div>
          ` : `
            <div class="row row-cols-3 g-2 font-monospace text-center small">
              ${laps.map((lap, idx) => `
                <div>
                  <span class="text-secondary opacity-50">${idx + 1}:</span>
                  <strong class="${lap === bestLap ? 'text-primary fw-bold' : 'text-body-emphasis'}">${lap.toFixed(3)}s</strong>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Routing buttons -->
        <div class="d-flex justify-content-end gap-2 border-top border-secondary-subtle border-opacity-20 pt-3">
          ${isLastPilot ? `
            <button id="btn-finish-qualifying" class="btn btn-success px-4 py-2.5 fw-bold d-flex align-items-center gap-2" ${!hasLaps ? 'disabled' : ''}>
              <i class="mdi mdi-check-circle-outline fs-5"></i>
              ${window.t('race.qualifying.finish_btn') || 'Concluir Qualificação e Ir Para Corrida'}
            </button>
          ` : `
            <button id="btn-next-pilot" class="btn btn-primary px-4 py-2.5 fw-bold d-flex align-items-center gap-2" ${!hasLaps ? 'disabled' : ''}>
              ${window.t('race.qualifying.next_pilot') || 'Próximo Piloto'}
              <i class="mdi mdi-arrow-right-bold-circle-outline fs-5"></i>
            </button>
          `}
        </div>
      </div>
    `;

    // Active Trigger listeners
    const triggerBtn = this.querySelector('#btn-trigger-lap');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.triggerQualifyingLap();
      });
    }

    const clickSimBtn = this.querySelector('#btn-click-simulate');
    if (clickSimBtn) {
      clickSimBtn.addEventListener('click', () => {
        this.simulateLapTime();
      });
    }

    const nextBtn = this.querySelector('#btn-next-pilot');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextPilot();
      });
    }

    const finishBtn = this.querySelector('#btn-finish-qualifying');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.finishQualifying();
      });
    }
  }

  updateLeaderboard() {
    const leaderboardBody = this.querySelector('#qualifying-leaderboard-body');
    if (!leaderboardBody) return;

    if (this.qualifyingOrder.length === 0) {
      leaderboardBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-secondary py-3">
            ${window.t('race.qualifying.no_laps') || 'Nenhuma classificação em andamento.'}
          </td>
        </tr>
      `;
      return;
    }

    const entries = this.qualifyingOrder.map(pilot => {
      const bestLap = this.getBestLap(pilot.id);
      return {
        pilot,
        bestLap: bestLap !== null ? bestLap : Infinity,
        lapsCount: (this.pilotLaps[pilot.id] || []).length
      };
    });

    // Sort: pilots with laps first (ascending order), pilots without laps last
    entries.sort((a, b) => a.bestLap - b.bestLap);

    leaderboardBody.innerHTML = '';
    entries.forEach((entry, idx) => {
      const bestLapStr = entry.bestLap !== Infinity ? `${entry.bestLap.toFixed(3)}s` : '--.---';
      const isPilotActive = this.activePilotIndex >= 0 && this.qualifyingOrder[this.activePilotIndex].id === entry.pilot.id;

      const tr = document.createElement('tr');
      if (isPilotActive) tr.className = 'table-primary table-opacity-10 fw-bold';

      tr.innerHTML = `
        <td class="font-monospace text-center small fw-semibold">${idx + 1}</td>
        <td>
          <span class="fw-semibold text-body-emphasis small">${entry.pilot.nickname ? entry.pilot.nickname : entry.pilot.name}</span>
          ${entry.pilot.nickname ? `&nbsp;<span class="text-secondary font-monospace" style="font-size: 0.7rem;">(${entry.pilot.name})</span>` : ''}
          ${isPilotActive ? ' <span class="badge bg-primary text-uppercase font-monospace border border-primary-subtle ms-1" style="font-size: 0.65rem;">ACTIVE</span>' : ''}
        </td>
        <td class="font-monospace text-primary text-center fw-bold small">${bestLapStr}</td>
        <td class="font-monospace text-center text-secondary small">${entry.lapsCount}</td>
      `;

      leaderboardBody.appendChild(tr);
    });
  }

  render() {
    if (!this._session) return;
    const track = this._session.track;
    const qualifyLane = this._session.qualifyLane;

    this.innerHTML = `
      <div class="row fade-in">
        <div class="col-12 col-lg-7 mb-4">
          <!-- Active Pilot session card -->
          <div id="qualifying-alert-container"></div>
          
          <div id="active-pilot-container">
            <!-- Loaded after sorting order is generated -->
            <div class="card bg-body-tertiary border-secondary-subtle shadow-sm p-5 text-center">
              <div class="d-inline-flex p-3 bg-secondary bg-opacity-10 text-secondary rounded-circle mb-3 mx-auto">
                <i class="mdi mdi-shuffle-variant" style="font-size: 48px; line-height: 1;"></i>
              </div>
              <h5 class="fw-bold text-body-emphasis mb-2">${window.t('race.qualifying.title') || 'Qualification Order Draft'}</h5>
              <p class="text-secondary small mb-4">${window.t('race.qualifying.subtitle') || 'To begin, shuffle the qualifying pilot order to define who runs first.'}</p>
              <button id="btn-shuffle-qualifying" class="btn btn-primary px-4 py-2.5 fw-bold d-flex align-items-center gap-2 mx-auto">
                <i class="mdi mdi-shuffle fs-5"></i>
                ${window.t('race.qualifying.shuffle_btn') || 'Sortear Ordem'}
              </button>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-5 mb-4">
          <!-- Qualifying standings leaderboard -->
          <div class="card bg-body-tertiary border-secondary-subtle shadow-sm">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3 d-flex align-items-center justify-content-between">
              <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <i class="mdi mdi-format-list-numbered text-primary fs-5"></i>
                ${window.t('race.qualifying.leaderboard') || 'Qualifying Leaderboard'}
              </h6>
              
              <span class="badge border border-secondary-subtle text-secondary px-2 py-1 small fw-semibold font-monospace bg-dark bg-opacity-20">
                Fenda ${qualifyLane ? qualifyLane.number : '1'}
              </span>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="border-collapse: collapse;">
                <thead>
                  <tr class="table-light border-bottom border-secondary-subtle border-opacity-25 small text-secondary">
                    <th scope="col" class="text-center font-monospace" style="width: 60px;">${window.t('race.qualifying.rank_col') || 'Pos'}</th>
                    <th scope="col">${window.t('race.qualifying.pilot_col') || 'Piloto'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 120px;">${window.t('race.qualifying.best_lap_col') || 'Melhor Volta'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 80px;">${window.t('race.qualifying.laps_count_col') || 'Voltas'}</th>
                  </tr>
                </thead>
                <tbody id="qualifying-leaderboard-body" class="border-top-0">
                  <!-- Populated dynamically -->
                  <tr>
                    <td colspan="4" class="text-center text-secondary py-4 small">
                      ${window.t('race.qualifying.no_laps') || 'Nenhuma volta registrada ainda.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-race-qualifying', SlotRaceRaceQualifying);

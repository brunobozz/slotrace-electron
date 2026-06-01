class SlotRaceRaceResults extends HTMLElement {
  set session(value) {
    this._session = value;
    this.init();
  }

  get session() {
    return this._session;
  }

  init() {
    if (!this._session || !this._session.resultsData) return;
    this.standings = this._session.resultsData.standings || [];
    this.render();
    this.setupEvents();
  }

  setupEvents() {
    const saveBtn = this.querySelector('#btn-save-race');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveRaceToHistory();
      });
    }

    const newRaceBtn = this.querySelector('#btn-new-race');
    if (newRaceBtn) {
      newRaceBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('resetRace', {
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  saveRaceToHistory() {
    const saveBtn = this.querySelector('#btn-save-race');
    if (saveBtn) saveBtn.setAttribute('disabled', 'true');

    window.electronAPI.db.get('races').then(races => {
      const racesList = races || [];
      const newRace = {
        id: Date.now().toString(),
        name: this._session.raceName,
        trackName: this._session.track.name,
        trackId: this._session.track.id,
        date: this._session.date || new Date().toLocaleDateString(),
        standings: this.standings.map(s => ({
          pilotId: s.pilot.id,
          pilotName: s.pilot.name,
          pilotNickname: s.pilot.nickname || '',
          totalLaps: s.totalLaps,
          finalZone: s.finalZone,
          bestLap: s.bestLap,
          avgLap: s.avgLap
        })),
        // Serialize full setup, qualifying, and telemetry session states
        qualifyLane: this._session.qualifyLane || null,
        qualificationStandings: this._session.qualificationStandings || [],
        startingGrid: this._session.startingGrid || [],
        deck: this._session.deck || [],
        qualifyingOrder: this._session.qualifyingOrder || [],
        pilotLaps: this._session.pilotLaps || {},
        activePilotIndex: this._session.activePilotIndex || -1,
        isRunStarted: this._session.isRunStarted || false,
        resultsData: this._session.resultsData || null,
        currentHeat: this._session.currentHeat || 1,
        isPaused: true,
        isInterval: this._session.isInterval || false,
        isHeatStarted: this._session.isHeatStarted || false,
        timeLeft: this._session.timeLeft || 0,
        activeLanes: this._session.activeLanes || null,
        deckState: this._session.deckState || null,
        pilotStats: this._session.pilotStats || null,
        laneLastLapTime: this._session.laneLastLapTime || null,
        laneRunStarted: this._session.laneRunStarted || null,
        heatTime: this._session.heatTime || 180,
        intervalTime: this._session.intervalTime || 10,
        cutoffTime: this._session.cutoffTime || 3.0,
        pilots: this._session.pilots || [],
        track: this._session.track || null
      };

      racesList.push(newRace);
      return window.electronAPI.db.set('races', racesList);
    }).then(success => {
      if (success) {
        window.dispatchEvent(new CustomEvent('raceListChanged'));
        const alertDiv = this.querySelector('#save-alert-container');
        if (alertDiv) {
          alertDiv.innerHTML = `
            <div class="alert alert-success border-success-subtle bg-success bg-opacity-10 py-2.5 px-3 small mb-3 text-success-emphasis text-center fw-semibold">
              <i class="mdi mdi-check-decagram-outline me-1"></i> ${window.t('race.results.save_success') || 'Corrida salva no histórico com sucesso!'}
            </div>
          `;
        }
      }
    }).catch(err => {
      console.error('Failed to save completed race records:', err);
      if (saveBtn) saveBtn.removeAttribute('disabled');
    });
  }

  render() {
    if (!this._session) return;

    // Get top 3 for podium
    const p1 = this.standings[0] || null;
    const p2 = this.standings[1] || null;
    const p3 = this.standings[2] || null;

    const getScoreStr = (entry) => {
      if (!entry) return '';
      return `${entry.totalLaps} ${window.t('registrations.modal.laps_label') || 'Voltas'} + ${entry.finalZone} Zonas`;
    };

    this.innerHTML = `
      <div class="row justify-content-center fade-in">
        <div class="col-12 col-xl-10">
          
          <div id="save-alert-container"></div>

          <!-- Podium Area -->
          <div class="card border-secondary-subtle bg-body-tertiary shadow-sm mb-4">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3 text-center position-relative">
              <h5 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center justify-content-center gap-2">
                <i class="mdi mdi-trophy text-warning fs-4"></i>
                ${window.t('race.results.podium_title') || 'GP Podium Standings'}
              </h5>
              ${this._session.isHistoryView ? `
                <span class="position-absolute end-0 top-50 translate-middle-y me-3 badge border border-primary-subtle text-primary bg-primary bg-opacity-10 px-2.5 py-1 small fw-bold font-monospace" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <i class="mdi mdi-history me-1"></i> ${window.t('race.results.history_badge') || 'Histórico'}
                </span>
              ` : ''}
            </div>
            
            <div class="card-body p-4 pt-5 pb-4">
              <div class="podium-container d-flex align-items-end justify-content-center gap-2 gap-sm-4 mx-auto mb-2" style="max-width: 600px; height: 260px;">
                
                <!-- 2nd Place Pedestal -->
                ${p2 ? `
                  <div class="d-flex flex-column align-items-center" style="width: 30%;">
                    <div class="text-center mb-2 overflow-hidden px-1">
                      <h6 class="fw-bold mb-0 text-truncate text-body-emphasis" style="font-size: 0.9rem;">${p2.pilot.nickname || p2.pilot.name}</h6>
                      <span class="text-secondary small font-monospace" style="font-size: 0.7rem;">${p2.totalLaps}.${p2.finalZone.toString().padStart(2,'0')} v</span>
                    </div>
                    <div class="rounded-top-3 border border-secondary-subtle border-bottom-0 d-flex flex-column align-items-center justify-content-center bg-gradient-podium" style="width: 100%; height: 110px; background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%), #2a2c30;">
                      <div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-25 border border-secondary border-opacity-50 text-secondary fw-bold" style="width: 32px; height: 32px; font-size: 1rem; box-shadow: 0 0 10px rgba(255,255,255,0.05);">2</div>
                      <span class="text-secondary small fw-bold font-monospace mt-2">SILVER</span>
                    </div>
                  </div>
                ` : '<div style="width: 30%; visibility: hidden;"></div>'}

                <!-- 1st Place Pedestal -->
                ${p1 ? `
                  <div class="d-flex flex-column align-items-center" style="width: 34%;">
                    <i class="mdi mdi-crown text-warning fs-3 mb-1 animate-glow-crown"></i>
                    <div class="text-center mb-2 overflow-hidden px-1">
                      <h5 class="fw-bold mb-0 text-truncate text-warning" style="font-size: 1.05rem;">${p1.pilot.nickname || p1.pilot.name}</h5>
                      <span class="text-secondary small font-monospace fw-bold" style="font-size: 0.75rem; color: var(--bs-primary) !important;">${p1.totalLaps}.${p1.finalZone.toString().padStart(2,'0')} v</span>
                    </div>
                    <div class="rounded-top-4 border border-warning border-opacity-50 border-bottom-0 d-flex flex-column align-items-center justify-content-center" style="width: 100%; height: 150px; background: linear-gradient(180deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0) 100%), #383120; box-shadow: 0 0 25px rgba(255, 193, 7, 0.15);">
                      <div class="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-20 border border-warning text-warning fw-bold" style="width: 36px; height: 36px; font-size: 1.15rem; box-shadow: 0 0 15px rgba(255, 193, 7, 0.25);">1</div>
                      <span class="text-warning small fw-bold font-monospace mt-2">GOLD</span>
                    </div>
                  </div>
                ` : '<div style="width: 34%; visibility: hidden;"></div>'}

                <!-- 3rd Place Pedestal -->
                ${p3 ? `
                  <div class="d-flex flex-column align-items-center" style="width: 30%;">
                    <div class="text-center mb-2 overflow-hidden px-1">
                      <h6 class="fw-bold mb-0 text-truncate text-body-emphasis" style="font-size: 0.9rem;">${p3.pilot.nickname || p3.pilot.name}</h6>
                      <span class="text-secondary small font-monospace" style="font-size: 0.7rem;">${p3.totalLaps}.${p3.finalZone.toString().padStart(2,'0')} v</span>
                    </div>
                    <div class="rounded-top-3 border border-secondary-subtle border-bottom-0 d-flex flex-column align-items-center justify-content-center bg-gradient-podium" style="width: 100%; height: 80px; background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%), #242629;">
                      <div class="rounded-circle d-flex align-items-center justify-content-center bg-opacity-25 text-body-emphasis fw-bold border border-secondary-subtle" style="width: 30px; height: 30px; font-size: 0.9rem; background-color: #5d423b80; border-color: #8c5b4e80 !important; color: #b08d84 !important;">3</div>
                      <span class="small fw-bold font-monospace mt-2" style="color: #b08d84 !important;">BRONZE</span>
                    </div>
                  </div>
                ` : '<div style="width: 30%; visibility: hidden;"></div>'}

              </div>
            </div>
          </div>

          <!-- Detailed Results Table -->
          <div class="card border-secondary-subtle bg-body-tertiary shadow-sm mb-4">
            <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3">
              <h6 class="fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <i class="mdi mdi-format-list-bulleted text-primary fs-5"></i>
                ${window.t('race.results.leaderboard_title') || 'Detailed Results Leaderboard'}
              </h6>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="border-collapse: collapse;">
                <thead>
                  <tr class="table-light border-bottom border-secondary-subtle border-opacity-25 small text-secondary">
                    <th scope="col" class="text-center font-monospace" style="width: 60px;">${window.t('race.results.pos_col') || 'Pos'}</th>
                    <th scope="col">${window.t('race.results.pilot_col') || 'Piloto'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 130px;">${window.t('race.results.laps_col') || 'Voltas Totais'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 120px;">${window.t('race.results.zone_col') || 'Zona Final'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 140px;">${window.t('race.results.best_lap_col') || 'Melhor Volta'}</th>
                    <th scope="col" class="text-center font-monospace" style="width: 130px;">${window.t('race.results.avg_lap_col') || 'Média'}</th>
                    <th scope="col" class="text-center font-monospace fw-bold" style="width: 180px;">${window.t('race.results.score_col') || 'Resultado'}</th>
                  </tr>
                </thead>
                <tbody class="border-top-0">
                  ${this.standings.map((entry, idx) => {
                    const bestLapStr = entry.bestLap !== null ? `${entry.bestLap.toFixed(3)}s` : '--.---';
                    const avgLapStr = entry.avgLap > 0 ? `${entry.avgLap.toFixed(3)}s` : '--.---';
                    
                    let medalIcon = '';
                    if (idx === 0) medalIcon = '<i class="mdi mdi-medal text-warning fs-5 ms-1"></i>';
                    else if (idx === 1) medalIcon = '<i class="mdi mdi-medal text-secondary fs-5 ms-1"></i>';
                    else if (idx === 2) medalIcon = '<i class="mdi mdi-medal fs-5 ms-1" style="color: #b08d84 !important;"></i>';

                    return `
                      <tr class="${idx === 0 ? 'table-primary table-opacity-5 fw-bold' : ''}">
                        <td class="font-monospace text-center small fw-semibold">${idx + 1}</td>
                        <td>
                          <span class="fw-semibold text-body-emphasis small">${entry.pilot.nickname ? entry.pilot.nickname : entry.pilot.name}</span>
                          ${entry.pilot.nickname ? `&nbsp;<span class="text-secondary font-monospace" style="font-size: 0.75rem;">(${entry.pilot.name})</span>` : ''}
                          ${medalIcon}
                        </td>
                        <td class="font-monospace text-center text-body-emphasis small">${entry.totalLaps}</td>
                        <td class="font-monospace text-center text-secondary small">${entry.finalZone}</td>
                        <td class="font-monospace text-primary text-center fw-bold small">${bestLapStr}</td>
                        <td class="font-monospace text-center text-secondary small">${avgLapStr}</td>
                        <td class="font-monospace text-center fw-extrabold text-body-emphasis" style="font-size: 0.95rem;">
                          ${entry.totalLaps}<span class="text-primary fw-bold">.${entry.finalZone.toString().padStart(2, '0')}</span> <span class="text-secondary fw-normal opacity-50" style="font-size: 0.75rem;">voltas</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex justify-content-end gap-2 pt-2 pb-4">
            <button id="btn-new-race" class="btn btn-secondary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
              <i class="mdi mdi-plus-circle-outline fs-5"></i>
              ${window.t('race.results.new_race_btn') || 'Nova Corrida'}
            </button>
            ${this._session.isHistoryView ? '' : `
              <button id="btn-save-race" class="btn btn-primary px-4 py-2.5 fw-bold d-flex align-items-center gap-2">
                <i class="mdi mdi-content-save-outline fs-5"></i>
                ${window.t('race.results.save_btn') || 'Salvar Corrida'}
              </button>
            `}
          </div>

        </div>
      </div>

      <style>
        .animate-glow-crown {
          animation: crown-glow 2.5s infinite alternate ease-in-out;
        }
        @keyframes crown-glow {
          0% {
            filter: drop-shadow(0 0 2px rgba(255, 193, 7, 0.4));
            transform: scale(1);
          }
          100% {
            filter: drop-shadow(0 0 12px rgba(255, 193, 7, 0.9));
            transform: scale(1.15);
          }
        }
      </style>
    `;
  }
}

customElements.define('slotrace-race-results', SlotRaceRaceResults);

class SlotRaceRace extends HTMLElement {
  connectedCallback() {
    this.session = {
      state: 'setup', // setup, qualifying, telemetry, results
      raceName: '',
      track: null,
      pilots: [],
      heatTime: 180,
      intervalTime: 10,
      cutoffTime: 3.0,
      qualifyLane: null,
      qualificationStandings: [],
      startingGrid: [],
      deck: [],
      resultsData: null,
      qualifyingOrder: [],
      activePilotIndex: -1,
      pilotLaps: {},
      isRunStarted: false
    };

    // Tracking for the navigation wizard visited states
    this.visitedStates = new Set(['setup']);

    this.render();
    this.setupEventListeners();

    this._langListener = () => {
      this.render();
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  setupEventListeners() {
    // Listen for transitions from setup (Step 1)
    this.addEventListener('goToQualifying', (e) => {
      // Clear subsequent steps since Step 1 is being re-submitted (cascading reset)
      this.clearSubsequentSteps('setup');
      
      Object.assign(this.session, e.detail);
      this.session.state = 'qualifying';
      this.visitedStates.add('qualifying');
      this.render();
    });

    this.addEventListener('goToTelemetry', (e) => {
      // Clear subsequent steps since Step 1 is being re-submitted (cascading reset)
      this.clearSubsequentSteps('setup');

      Object.assign(this.session, e.detail);
      this.session.state = 'telemetry';
      this.visitedStates.add('telemetry');
      this.render();
    });

    // Listen for qualifying completed (Step 2)
    this.addEventListener('qualifyingFinished', (e) => {
      // Clear subsequent steps since Step 2 was completed/modified (cascading reset)
      this.clearSubsequentSteps('qualifying');

      this.session.qualificationStandings = e.detail.standings;
      this.session.startingGrid = e.detail.startingGrid;
      this.session.deck = e.detail.deck;
      this.session.state = 'telemetry';
      this.visitedStates.add('telemetry');
      this.render();
    });

    // Listen for telemetry completed (Step 3)
    this.addEventListener('telemetryFinished', (e) => {
      this.session.resultsData = e.detail;
      this.session.state = 'results';
      this.visitedStates.add('results');
      this.render();
    });

    // Listen for reset/new race requests
    this.addEventListener('resetRace', () => {
      this.resetSession();
    });

    // Listen for qualifying modifications (shuffle / run start)
    this.addEventListener('qualifyingModified', () => {
      this.clearSubsequentSteps('qualifying');
    });
  }

  clearSubsequentSteps(fromState) {
    // Disabled cascading resets upon tab navigation as requested by the user.
    // Dynamic resets will be handled by other explicit triggers in future updates.
  }

  loadSavedRace(race) {
    // Perform robust cleanup before loading new data
    const activeTelemetry = this.querySelector('slotrace-race-telemetry');
    if (activeTelemetry && typeof activeTelemetry.cleanup === 'function') {
      activeTelemetry.cleanup();
    }
    const activeQualifying = this.querySelector('slotrace-race-qualifying');
    if (activeQualifying && typeof activeQualifying.cleanup === 'function') {
      activeQualifying.cleanup();
    }

    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    const standings = (race.standings || []).map(s => ({
      pilot: {
        id: s.pilotId,
        name: s.pilotName,
        nickname: s.pilotNickname || ''
      },
      totalLaps: s.totalLaps,
      finalZone: s.finalZone,
      bestLap: s.bestLap,
      avgLap: s.avgLap
    }));

    this.session = {
      id: race.id,
      state: 'results',
      raceName: race.name,
      track: race.track || {
        id: race.trackId,
        name: race.trackName
      },
      pilots: race.pilots || standings.map(s => s.pilot),
      heatTime: race.heatTime || 180,
      intervalTime: race.intervalTime || 10,
      cutoffTime: race.cutoffTime || 3.0,
      qualifyLane: race.qualifyLane || null,
      qualificationStandings: race.qualificationStandings || [],
      startingGrid: race.startingGrid || [],
      deck: race.deck || [],
      resultsData: race.resultsData || {
        standings: standings
      },
      qualifyingOrder: race.qualifyingOrder || [],
      activePilotIndex: race.activePilotIndex !== undefined ? race.activePilotIndex : -1,
      pilotLaps: race.pilotLaps || {},
      isRunStarted: race.isRunStarted !== undefined ? race.isRunStarted : false,
      date: race.date,
      isHistoryView: true,
      // Telemetry variables
      currentHeat: race.currentHeat || 1,
      isPaused: true,
      isInterval: race.isInterval || false,
      isHeatStarted: race.isHeatStarted || false,
      timeLeft: race.timeLeft !== undefined ? race.timeLeft : (race.heatTime || 180),
      activeLanes: race.activeLanes || null,
      deckState: race.deckState || null,
      pilotStats: race.pilotStats || null,
      laneLastLapTime: race.laneLastLapTime || null,
      laneRunStarted: race.laneRunStarted || null
    };

    this.visitedStates = new Set(['setup', 'qualifying', 'telemetry', 'results']);
    this.render();
  }

  saveCurrentRace() {
    const raceId = this.session.id || Date.now().toString();
    this.session.id = raceId;

    window.electronAPI.db.get('races').then(races => {
      const racesList = races || [];
      const existingIndex = racesList.findIndex(r => r.id === raceId);
      
      const newRace = {
        id: raceId,
        name: this.session.raceName,
        trackName: this.session.track ? this.session.track.name : (window.t("registrations.default_track") || "Pista Padrão"),
        trackId: this.session.track ? this.session.track.id : "",
        date: this.session.date || new Date().toLocaleDateString(),
        standings: (this.session.resultsData && this.session.resultsData.standings) 
          ? this.session.resultsData.standings.map(s => ({
              pilotId: s.pilot.id,
              pilotName: s.pilot.name,
              pilotNickname: s.pilot.nickname || '',
              totalLaps: s.totalLaps,
              finalZone: s.finalZone,
              bestLap: s.bestLap,
              avgLap: s.avgLap
            }))
          : [],
        qualifyLane: this.session.qualifyLane || null,
        qualificationStandings: this.session.qualificationStandings || [],
        startingGrid: this.session.startingGrid || [],
        deck: this.session.deck || [],
        qualifyingOrder: this.session.qualifyingOrder || [],
        pilotLaps: this.session.pilotLaps || {},
        activePilotIndex: this.session.activePilotIndex || -1,
        isRunStarted: this.session.isRunStarted || false,
        resultsData: this.session.resultsData || null,
        currentHeat: this.session.currentHeat || 1,
        isPaused: true,
        isInterval: this.session.isInterval || false,
        isHeatStarted: this.session.isHeatStarted || false,
        timeLeft: this.session.timeLeft || 0,
        activeLanes: this.session.activeLanes || null,
        deckState: this.session.deckState || null,
        pilotStats: this.session.pilotStats || null,
        laneLastLapTime: this.session.laneLastLapTime || null,
        laneRunStarted: this.session.laneRunStarted || null,
        heatTime: this.session.heatTime || 180,
        intervalTime: this.session.intervalTime || 10,
        cutoffTime: this.session.cutoffTime || 3.0,
        pilots: this.session.pilots || [],
        track: this.session.track || null
      };

      if (existingIndex >= 0) {
        racesList[existingIndex] = newRace;
      } else {
        racesList.push(newRace);
      }

      return window.electronAPI.db.set('races', racesList);
    }).then(success => {
      if (success) {
        window.dispatchEvent(new CustomEvent('raceListChanged'));
        this.showSaveBanner();
      }
    }).catch(err => {
      console.error('Failed to save current race state:', err);
    });
  }

  showSaveBanner() {
    const existing = this.querySelector('#header-save-success-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'header-save-success-banner';
    banner.className = 'alert alert-success border-success-subtle bg-success bg-opacity-10 py-2.5 px-3 small mb-3 text-success-emphasis text-center fw-semibold fade-in';
    banner.innerHTML = `
      <i class="mdi mdi-check-decagram-outline me-1"></i> ${window.t('race.results.save_success') || 'Corrida salva no histórico com sucesso!'}
    `;

    const stepperCard = this.querySelector('.card.mb-4');
    if (stepperCard) {
      stepperCard.parentNode.insertBefore(banner, stepperCard);
    }

    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 300);
    }, 3000);
  }

  resetSession() {
    // Explicitly clean up any active timers/listeners in sub-components before removing them
    const activeTelemetry = this.querySelector('slotrace-race-telemetry');
    if (activeTelemetry && typeof activeTelemetry.cleanup === 'function') {
      activeTelemetry.cleanup();
    }
    const activeQualifying = this.querySelector('slotrace-race-qualifying');
    if (activeQualifying && typeof activeQualifying.cleanup === 'function') {
      activeQualifying.cleanup();
    }

    // Robust cleanup of any leftovers from active Bootstrap modals (backdrops and body styles)
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Hide and remove any active modal DOM elements
    ['modal-rotation-zone', 'modal-final-zones'].forEach(id => {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
          try {
            modalInstance.hide();
          } catch(e) {}
        }
        modalEl.remove();
      }
    });

    this.session = {
      state: 'setup',
      raceName: '',
      track: null,
      pilots: [],
      heatTime: 180,
      intervalTime: 10,
      cutoffTime: 3.0,
      qualifyLane: null,
      qualificationStandings: [],
      startingGrid: [],
      deck: [],
      resultsData: null,
      qualifyingOrder: [],
      activePilotIndex: -1,
      pilotLaps: {},
      isRunStarted: false
    };
    this.visitedStates = new Set(['setup']);
    this.render();
  }

  navigateToState(targetState) {
    if (!this.visitedStates.has(targetState)) return;

    // Explicitly clean up any active timers/listeners in sub-components before removing them
    const activeTelemetry = this.querySelector('slotrace-race-telemetry');
    if (activeTelemetry && typeof activeTelemetry.cleanup === 'function') {
      activeTelemetry.cleanup();
    }
    const activeQualifying = this.querySelector('slotrace-race-qualifying');
    if (activeQualifying && typeof activeQualifying.cleanup === 'function') {
      activeQualifying.cleanup();
    }

    // Robust cleanup of any leftovers from active Bootstrap modals (backdrops and body styles)
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Hide and remove any active modal DOM elements
    ['modal-rotation-zone', 'modal-final-zones'].forEach(id => {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
          try {
            modalInstance.hide();
          } catch(e) {}
        }
        modalEl.remove();
      }
    });

    this.session.state = targetState;
    this.render();
  }

  render() {
    this.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'container-fluid px-0 py-3';

    const headerRow = document.createElement('div');
    headerRow.className = 'd-flex justify-content-between align-items-center mb-3 mt-1 pb-2 border-bottom border-secondary-subtle border-opacity-25';
    
    let titleText = window.t('navbar.race') || 'Race';
    if (this.session.isHistoryView) {
      titleText = `${titleText} (${window.t('race.results.history_badge') || 'Histórico'})`;
    }

    headerRow.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="mdi mdi-flag-checkered text-primary fs-3"></i>
        <h3 class="fw-bold text-body-emphasis mb-0" style="font-size: 1.6rem; letter-spacing: -0.5px;">${titleText}</h3>
      </div>
      <button id="btn-header-save-race" class="btn btn-primary px-3 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm transition-hover">
        <i class="mdi mdi-content-save-outline fs-5"></i>
        <span>${window.t('race.results.save_btn') || 'Salvar Corrida'}</span>
      </button>
    `;
    container.appendChild(headerRow);

    const saveBtn = headerRow.querySelector('#btn-header-save-race');
    if (saveBtn) {
      saveBtn.onclick = () => {
        this.saveCurrentRace();
      };
    }

    // Build the Stepper progress bar
    const stepperCard = document.createElement('div');
    stepperCard.className = 'card bg-body-tertiary border-secondary-subtle shadow-sm mb-4 mt-3';
    
    // Dynamic steps resolution (Qualificação is only included if requested in setup)
    const showQualifying = this.session.qualifyLane !== null || this.visitedStates.has('qualifying');
    const steps = showQualifying 
      ? ['setup', 'qualifying', 'telemetry', 'results'] 
      : ['setup', 'telemetry', 'results'];

    const stepLabels = {
      setup: window.t('race.setup.title') || 'Configuração',
      qualifying: window.t('race.qualifying.title') || 'Classificação',
      telemetry: window.t('race.telemetry.title') || 'Corrida',
      results: window.t('race.results.title') || 'Resultado'
    };

    const activeIndex = steps.indexOf(this.session.state);
    const percent = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

    let stepsHtml = '';
    steps.forEach((stateKey, index) => {
      const label = stepLabels[stateKey];
      const isActive = this.session.state === stateKey;
      const isCompleted = steps.indexOf(this.session.state) > index;
      const isVisited = this.visitedStates.has(stateKey);
      
      let nodeClass = 'border border-2 border-secondary-subtle text-secondary bg-body-secondary bg-opacity-50 opacity-75';
      let cursorStyle = 'cursor: not-allowed;';

      if (isActive) {
        nodeClass = 'border border-2 border-primary text-primary fw-bold bg-dark shadow-primary-glow';
        cursorStyle = 'cursor: default;';
      } else if (isCompleted) {
        nodeClass = 'bg-primary border border-primary text-white fw-bold';
        cursorStyle = 'cursor: pointer;';
      } else if (isVisited) {
        nodeClass = 'border border-2 border-secondary text-secondary-emphasis bg-body-secondary';
        cursorStyle = 'cursor: pointer;';
      }

      const content = isCompleted 
        ? '<i class="mdi mdi-check" style="font-size: 1.1rem; line-height: 1;"></i>' 
        : (index + 1).toString();

      stepsHtml += `
        <div class="step-node d-flex flex-column align-items-center position-relative" style="${cursorStyle} z-index: 2; width: 80px;" data-state="${stateKey}">
          <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all" style="width: 36px; height: 36px; ${nodeClass}">
            ${content}
          </div>
          <span class="small fw-semibold mt-2 text-center text-truncate w-100 ${isActive ? 'text-primary' : 'text-secondary'}" style="font-size: 0.75rem;">
            ${label}
          </span>
        </div>
      `;
    });

    stepperCard.innerHTML = `
      <div class="card-body py-3 px-4 position-relative overflow-hidden">
        <div class="d-flex align-items-center justify-content-between px-md-5 position-relative w-100">
          
          <!-- Stepper Gray connector bar -->
          <div class="position-absolute top-50 start-0 end-0 border-bottom border-secondary-subtle border-opacity-20 translate-middle-y" style="z-index: 0; transform: translateY(-50%); height: 2px; margin-left: 60px; margin-right: 60px;"></div>
          
          <!-- Stepper Active Primary connector bar -->
          <div class="position-absolute top-50 start-0 border-bottom border-primary translate-middle-y" style="z-index: 1; transform: translateY(-50%); height: 2px; width: calc(${percent}% - 120px * (100 - ${percent}) / 100); margin-left: 60px; transition: width 0.3s ease;"></div>
          
          ${stepsHtml}
        </div>
      </div>
      
      <style>
        .shadow-primary-glow {
          box-shadow: 0 0 12px rgba(var(--bs-primary-rgb), 0.4) !important;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .step-node:hover .rounded-circle {
          transform: scale(1.1);
        }
      </style>
    `;

    // Bind navigation click listeners to visited nodes
    stepperCard.querySelectorAll('.step-node').forEach(node => {
      const stateKey = node.getAttribute('data-state');
      if (this.visitedStates.has(stateKey) && this.session.state !== stateKey) {
        node.onclick = () => {
          this.navigateToState(stateKey);
        };
      }
    });

    container.appendChild(stepperCard);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'mt-3';

    if (this.session.state === 'setup') {
      const setupEl = document.createElement('slotrace-race-setup');
      setupEl.session = this.session; // Pass down the session to load form configurations!
      contentDiv.appendChild(setupEl);
    } else if (this.session.state === 'qualifying') {
      const qualEl = document.createElement('slotrace-race-qualifying');
      qualEl.session = this.session;
      contentDiv.appendChild(qualEl);
    } else if (this.session.state === 'telemetry') {
      const telemEl = document.createElement('slotrace-race-telemetry');
      telemEl.session = this.session;
      contentDiv.appendChild(telemEl);
    } else if (this.session.state === 'results') {
      const resEl = document.createElement('slotrace-race-results');
      resEl.session = this.session;
      contentDiv.appendChild(resEl);
    }

    container.appendChild(contentDiv);
    this.appendChild(container);
  }
}

customElements.define('slotrace-race', SlotRaceRace);

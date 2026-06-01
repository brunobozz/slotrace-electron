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

    // Renders the header dynamically based on state
    let stateDesc = window.t('race.desc') || 'Race management and live telemetry.';
    if (this.session.state === 'qualifying') {
      stateDesc = window.t('race.qualifying.title') || 'Qualifying Session';
    } else if (this.session.state === 'telemetry') {
      stateDesc = window.t('race.telemetry.title') || 'Race Telemetry';
    } else if (this.session.state === 'results') {
      stateDesc = window.t('race.results.title') || 'Race Results';
    }

    const header = document.createElement('slotrace-header');
    header.setAttribute('title', window.t('navbar.race') || 'Race');
    header.setAttribute('description', stateDesc);
    container.appendChild(header);

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

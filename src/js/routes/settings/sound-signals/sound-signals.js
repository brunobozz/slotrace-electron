class SlotRaceSettingsSoundSignals extends HTMLElement {
  connectedCallback() {
    this._tooltips = []; // Active tooltips registry
    this.render();
    
    // Fetch and initialize the preferences from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        this._savedStartBeepDuration = settings.start_beep_duration !== undefined ? parseFloat(settings.start_beep_duration) : 0.5;
        this._savedLapBeepDuration = settings.lap_beep_duration !== undefined ? parseFloat(settings.lap_beep_duration) : 0.50;
        this._savedEndBeepDuration = settings.end_beep_duration !== undefined ? parseFloat(settings.end_beep_duration) : 0.5;

        this._savedStartBeepFrequency = settings.start_beep_frequency !== undefined ? parseInt(settings.start_beep_frequency, 10) : 1000;
        this._savedLapBeepFrequency = settings.lap_beep_frequency !== undefined ? parseInt(settings.lap_beep_frequency, 10) : 1300;
        this._savedEndBeepFrequency = settings.end_beep_frequency !== undefined ? parseInt(settings.end_beep_frequency, 10) : 500;

        const startBeepSwitch = this.querySelector('#switch-start-beep');
        const startBeepTestContainer = this.querySelector('#container-start-beep-test');
        const startBeepDurationContainer = this.querySelector('#container-start-beep-duration');
        const startBeepFrequencyContainer = this.querySelector('#container-start-beep-frequency');
        const startBeepDurationInput = this.querySelector('#input-start-beep-duration');
        const startBeepFrequencyInput = this.querySelector('#input-start-beep-frequency');
        if (startBeepSwitch) {
          startBeepSwitch.checked = settings.start_beep !== false;
          if (startBeepTestContainer) {
            startBeepTestContainer.style.display = startBeepSwitch.checked ? 'block' : 'none';
          }
          if (startBeepDurationContainer) {
            startBeepDurationContainer.style.display = startBeepSwitch.checked ? 'flex' : 'none';
          }
          if (startBeepFrequencyContainer) {
            startBeepFrequencyContainer.style.display = startBeepSwitch.checked ? 'flex' : 'none';
          }
        }
        if (startBeepDurationInput) {
          startBeepDurationInput.value = this._savedStartBeepDuration.toFixed(1) + 's';
        }
        if (startBeepFrequencyInput) {
          startBeepFrequencyInput.value = this._savedStartBeepFrequency + ' Hz';
        }

        const lapBeepSwitch = this.querySelector('#switch-lap-beep');
        const lapBeepTestContainer = this.querySelector('#container-lap-beep-test');
        const lapBeepDurationContainer = this.querySelector('#container-lap-beep-duration');
        const lapBeepFrequencyContainer = this.querySelector('#container-lap-beep-frequency');
        const lapBeepDurationInput = this.querySelector('#input-lap-beep-duration');
        const lapBeepFrequencyInput = this.querySelector('#input-lap-beep-frequency');
        if (lapBeepSwitch) {
          lapBeepSwitch.checked = settings.lap_beep !== false;
          if (lapBeepTestContainer) {
            lapBeepTestContainer.style.display = lapBeepSwitch.checked ? 'block' : 'none';
          }
          if (lapBeepDurationContainer) {
            lapBeepDurationContainer.style.display = lapBeepSwitch.checked ? 'flex' : 'none';
          }
          if (lapBeepFrequencyContainer) {
            lapBeepFrequencyContainer.style.display = lapBeepSwitch.checked ? 'flex' : 'none';
          }
        }
        if (lapBeepDurationInput) {
          lapBeepDurationInput.value = this._savedLapBeepDuration.toFixed(2) + 's';
        }
        if (lapBeepFrequencyInput) {
          lapBeepFrequencyInput.value = this._savedLapBeepFrequency + ' Hz';
        }

        const endBeepSwitch = this.querySelector('#switch-end-beep');
        const endBeepTestContainer = this.querySelector('#container-end-beep-test');
        const endBeepDurationContainer = this.querySelector('#container-end-beep-duration');
        const endBeepFrequencyContainer = this.querySelector('#container-end-beep-frequency');
        const endBeepDurationInput = this.querySelector('#input-end-beep-duration');
        const endBeepFrequencyInput = this.querySelector('#input-end-beep-frequency');
        if (endBeepSwitch) {
          endBeepSwitch.checked = settings.end_beep !== false;
          if (endBeepTestContainer) {
            endBeepTestContainer.style.display = endBeepSwitch.checked ? 'block' : 'none';
          }
          if (endBeepDurationContainer) {
            endBeepDurationContainer.style.display = endBeepSwitch.checked ? 'flex' : 'none';
          }
          if (endBeepFrequencyContainer) {
            endBeepFrequencyContainer.style.display = endBeepSwitch.checked ? 'flex' : 'none';
          }
        }
        if (endBeepDurationInput) {
          endBeepDurationInput.value = this._savedEndBeepDuration.toFixed(1) + 's';
        }
        if (endBeepFrequencyInput) {
          endBeepFrequencyInput.value = this._savedEndBeepFrequency + ' Hz';
        }
      }
    }).catch(err => {
      console.error('Failed to load sound signals settings from database:', err);
    });

    this._langListener = () => {
      const startBeepEl = this.querySelector('#switch-start-beep');
      const lapBeepEl = this.querySelector('#switch-lap-beep');
      const endBeepEl = this.querySelector('#switch-end-beep');
      const startBeepDurationEl = this.querySelector('#input-start-beep-duration');
      const lapBeepDurationEl = this.querySelector('#input-lap-beep-duration');
      const endBeepDurationEl = this.querySelector('#input-end-beep-duration');
      const startBeepFrequencyEl = this.querySelector('#input-start-beep-frequency');
      const lapBeepFrequencyEl = this.querySelector('#input-lap-beep-frequency');
      const endBeepFrequencyEl = this.querySelector('#input-end-beep-frequency');
      
      const currentStartBeep = startBeepEl ? startBeepEl.checked : true;
      const currentLapBeep = lapBeepEl ? lapBeepEl.checked : true;
      const currentEndBeep = endBeepEl ? endBeepEl.checked : true;
      const currentStartBeepDuration = startBeepDurationEl ? startBeepDurationEl.value : '0.5s';
      const currentLapBeepDuration = lapBeepDurationEl ? lapBeepDurationEl.value : '0.50s';
      const currentEndBeepDuration = endBeepDurationEl ? endBeepDurationEl.value : '0.5s';
      const currentStartBeepFrequency = startBeepFrequencyEl ? startBeepFrequencyEl.value : '1000 Hz';
      const currentLapBeepFrequency = lapBeepFrequencyEl ? lapBeepFrequencyEl.value : '1300 Hz';
      const currentEndBeepFrequency = endBeepFrequencyEl ? endBeepFrequencyEl.value : '500 Hz';
      
      this.render();
      
      const newStartBeepEl = this.querySelector('#switch-start-beep');
      const newLapBeepEl = this.querySelector('#switch-lap-beep');
      const newEndBeepEl = this.querySelector('#switch-end-beep');
      const newStartBeepDurationEl = this.querySelector('#input-start-beep-duration');
      const newLapBeepDurationEl = this.querySelector('#input-lap-beep-duration');
      const newEndBeepDurationEl = this.querySelector('#input-end-beep-duration');
      const newStartBeepFrequencyEl = this.querySelector('#input-start-beep-frequency');
      const newLapBeepFrequencyEl = this.querySelector('#input-lap-beep-frequency');
      const newEndBeepFrequencyEl = this.querySelector('#input-end-beep-frequency');
      
      const startBeepTestContainer = this.querySelector('#container-start-beep-test');
      const startBeepDurationContainer = this.querySelector('#container-start-beep-duration');
      const startBeepFrequencyContainer = this.querySelector('#container-start-beep-frequency');
      const lapBeepTestContainer = this.querySelector('#container-lap-beep-test');
      const lapBeepDurationContainer = this.querySelector('#container-lap-beep-duration');
      const lapBeepFrequencyContainer = this.querySelector('#container-lap-beep-frequency');
      const endBeepTestContainer = this.querySelector('#container-end-beep-test');
      const endBeepDurationContainer = this.querySelector('#container-end-beep-duration');
      const endBeepFrequencyContainer = this.querySelector('#container-end-beep-frequency');
      
      if (newStartBeepEl) {
        newStartBeepEl.checked = currentStartBeep;
        if (startBeepTestContainer) {
          startBeepTestContainer.style.display = currentStartBeep ? 'block' : 'none';
        }
        if (startBeepDurationContainer) {
          startBeepDurationContainer.style.display = currentStartBeep ? 'flex' : 'none';
        }
        if (startBeepFrequencyContainer) {
          startBeepFrequencyContainer.style.display = currentStartBeep ? 'flex' : 'none';
        }
      }
      if (newLapBeepEl) {
        newLapBeepEl.checked = currentLapBeep;
        if (lapBeepTestContainer) {
          lapBeepTestContainer.style.display = currentLapBeep ? 'block' : 'none';
        }
        if (lapBeepDurationContainer) {
          lapBeepDurationContainer.style.display = currentLapBeep ? 'flex' : 'none';
        }
        if (lapBeepFrequencyContainer) {
          lapBeepFrequencyContainer.style.display = currentLapBeep ? 'flex' : 'none';
        }
      }
      if (newEndBeepEl) {
        newEndBeepEl.checked = currentEndBeep;
        if (endBeepTestContainer) {
          endBeepTestContainer.style.display = currentEndBeep ? 'block' : 'none';
        }
        if (endBeepDurationContainer) {
          endBeepDurationContainer.style.display = currentEndBeep ? 'flex' : 'none';
        }
        if (endBeepFrequencyContainer) {
          endBeepFrequencyContainer.style.display = currentEndBeep ? 'flex' : 'none';
        }
      }
      if (newStartBeepDurationEl) newStartBeepDurationEl.value = currentStartBeepDuration;
      if (newLapBeepDurationEl) newLapBeepDurationEl.value = currentLapBeepDuration;
      if (newEndBeepDurationEl) newEndBeepDurationEl.value = currentEndBeepDuration;
      if (newStartBeepFrequencyEl) newStartBeepFrequencyEl.value = currentStartBeepFrequency;
      if (newLapBeepFrequencyEl) newLapBeepFrequencyEl.value = currentLapBeepFrequency;
      if (newEndBeepFrequencyEl) newEndBeepFrequencyEl.value = currentEndBeepFrequency;
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    this._clearTooltips();
  }

  _clearTooltips() {
    if (this._tooltips) {
      this._tooltips.forEach(t => {
        try {
          t.dispose();
        } catch (_) {}
      });
    }
    this._tooltips = [];
  }

  render() {
    // Clear any previous tooltips before rewriting innerHTML
    this._clearTooltips();

    this.innerHTML = `
      <style>
        #form-sound-signals .form-check-input {
          width: 2.8em !important;
          height: 1.4em !important;
          cursor: pointer;
        }
      </style>
      <slotrace-settings-header title="${window.t('settings.menu.sound_signals') || 'Sinais Sonoros'}" icon="mdi-volume-high"></slotrace-settings-header>
      
      <form id="form-sound-signals" class="needs-validation fade-in" novalidate>
        <!-- Start Beep Switch -->
        <div class="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label for="switch-start-beep" class="form-label fw-semibold fs-5 mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.start_beep_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.start_beep_help')}"></i>
            </label>
          </div>
          <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="switch-start-beep" style="cursor: pointer;">
          </div>
        </div>

        <!-- Start Beep Duration Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-start-beep-duration" style="display: none;">
          <div>
            <label for="input-start-beep-duration" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.start_beep_duration_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.start_beep_duration_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-start-beep-duration-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-start-beep-duration" value="${(this._savedStartBeepDuration || 0.5).toFixed(1)}s" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-start-beep-duration-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Start Beep Frequency Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-start-beep-frequency" style="display: none;">
          <div>
            <label for="input-start-beep-frequency" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.start_beep_frequency_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.start_beep_frequency_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-start-beep-frequency-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-start-beep-frequency" value="${this._savedStartBeepFrequency || 1000} Hz" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-start-beep-frequency-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Start Beep Test Button Control -->
        <div class="mb-4 text-end" id="container-start-beep-test" style="display: none;">
          <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2 px-3" id="btn-test-start-beep">
            <i class="mdi mdi-volume-high fs-6"></i>
            <span>${window.t('settings.preferences.test_beep_button') || 'Testar'}</span>
          </button>
        </div>

        <hr class="border-secondary-subtle opacity-25 my-4">

        <!-- Lap Beep Switch -->
        <div class="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label for="switch-lap-beep" class="form-label fw-semibold fs-5 mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.lap_beep_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.lap_beep_help')}"></i>
            </label>
          </div>
          <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="switch-lap-beep" style="cursor: pointer;">
          </div>
        </div>

        <!-- Lap Beep Duration Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-lap-beep-duration" style="display: none;">
          <div>
            <label for="input-lap-beep-duration" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.lap_beep_duration_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.lap_beep_duration_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-duration-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-lap-beep-duration" value="${(this._savedLapBeepDuration || 0.50).toFixed(2)}s" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-duration-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Lap Beep Frequency Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-lap-beep-frequency" style="display: none;">
          <div>
            <label for="input-lap-beep-frequency" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.lap_beep_frequency_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.lap_beep_frequency_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-frequency-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-lap-beep-frequency" value="${this._savedLapBeepFrequency || 1300} Hz" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-frequency-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Lap Beep Test Button Control -->
        <div class="mb-4 text-end" id="container-lap-beep-test" style="display: none;">
          <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2 px-3" id="btn-test-lap-beep">
            <i class="mdi mdi-volume-high fs-6"></i>
            <span>${window.t('settings.preferences.test_beep_button') || 'Testar'}</span>
          </button>
        </div>

        <hr class="border-secondary-subtle opacity-25 my-4">

        <!-- End Beep Switch -->
        <div class="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label for="switch-end-beep" class="form-label fw-semibold fs-5 mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.end_beep_label') || 'Sinal Sonoro de Término'}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.end_beep_help')}"></i>
            </label>
          </div>
          <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="switch-end-beep" style="cursor: pointer;">
          </div>
        </div>

        <!-- End Beep Duration Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-end-beep-duration" style="display: none;">
          <div>
            <label for="input-end-beep-duration" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.end_beep_duration_label') || 'Duração do Sinal de Término'}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.end_beep_duration_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-end-beep-duration-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-end-beep-duration" value="${(this._savedEndBeepDuration || 0.5).toFixed(1)}s" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-end-beep-duration-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- End Beep Frequency Control -->
        <div class="mb-3 d-flex align-items-center justify-content-between" id="container-end-beep-frequency" style="display: none;">
          <div>
            <label for="input-end-beep-frequency" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.end_beep_frequency_label') || 'Frequência do Sinal de Término'}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.end_beep_frequency_help')}"></i>
            </label>
          </div>
          <div class="input-group" style="max-width: 180px;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-end-beep-frequency-down">
              <i class="mdi mdi-minus"></i>
            </button>
            <input type="text" class="form-control text-center p-2.5" id="input-end-beep-frequency" value="${this._savedEndBeepFrequency || 500} Hz" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-end-beep-frequency-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- End Beep Test Button Control -->
        <div class="mb-4 text-end" id="container-end-beep-test" style="display: none;">
          <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2 px-3" id="btn-test-end-beep">
            <i class="mdi mdi-volume-high fs-6"></i>
            <span>${window.t('settings.preferences.test_beep_button') || 'Testar'}</span>
          </button>
        </div>

        <button type="submit" id="btn-save-sound-signals" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.preferences.save_button')}
        </button>
      </form>
    `;

    // Re-bind form elements and events
    const form = this.querySelector('#form-sound-signals');

    // Initialize Bootstrap Tooltips
    const tooltipTriggerList = this.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap && window.bootstrap.Tooltip) {
      this._tooltips = Array.from(tooltipTriggerList).map(el => new window.bootstrap.Tooltip(el));
    }

    // Bind toggle events for beep duration and frequency containers
    const startBeepSwitchEl = this.querySelector('#switch-start-beep');
    const startBeepTestContainer = this.querySelector('#container-start-beep-test');
    const startBeepDurationContainer = this.querySelector('#container-start-beep-duration');
    const startBeepFrequencyContainer = this.querySelector('#container-start-beep-frequency');
    if (startBeepSwitchEl) {
      startBeepSwitchEl.addEventListener('change', () => {
        const displayVal = startBeepSwitchEl.checked ? 'flex' : 'none';
        if (startBeepTestContainer) startBeepTestContainer.style.display = startBeepSwitchEl.checked ? 'block' : 'none';
        if (startBeepDurationContainer) startBeepDurationContainer.style.display = displayVal;
        if (startBeepFrequencyContainer) startBeepFrequencyContainer.style.display = displayVal;
      });
    }
    const lapBeepSwitchEl = this.querySelector('#switch-lap-beep');
    const lapBeepTestContainer = this.querySelector('#container-lap-beep-test');
    const lapBeepDurationContainer = this.querySelector('#container-lap-beep-duration');
    const lapBeepFrequencyContainer = this.querySelector('#container-lap-beep-frequency');
    if (lapBeepSwitchEl) {
      lapBeepSwitchEl.addEventListener('change', () => {
        const displayVal = lapBeepSwitchEl.checked ? 'flex' : 'none';
        if (lapBeepTestContainer) lapBeepTestContainer.style.display = lapBeepSwitchEl.checked ? 'block' : 'none';
        if (lapBeepDurationContainer) lapBeepDurationContainer.style.display = displayVal;
        if (lapBeepFrequencyContainer) lapBeepFrequencyContainer.style.display = displayVal;
      });
    }
    const endBeepSwitchEl = this.querySelector('#switch-end-beep');
    const endBeepTestContainer = this.querySelector('#container-end-beep-test');
    const endBeepDurationContainer = this.querySelector('#container-end-beep-duration');
    const endBeepFrequencyContainer = this.querySelector('#container-end-beep-frequency');
    if (endBeepSwitchEl) {
      endBeepSwitchEl.addEventListener('change', () => {
        const displayVal = endBeepSwitchEl.checked ? 'flex' : 'none';
        if (endBeepTestContainer) endBeepTestContainer.style.display = endBeepSwitchEl.checked ? 'block' : 'none';
        if (endBeepDurationContainer) endBeepDurationContainer.style.display = displayVal;
        if (endBeepFrequencyContainer) endBeepFrequencyContainer.style.display = displayVal;
      });
    }

    // Bind beep test buttons
    const btnTestStartBeep = this.querySelector('#btn-test-start-beep');
    if (btnTestStartBeep) {
      btnTestStartBeep.addEventListener('click', () => {
        const inputStartBeep = this.querySelector('#input-start-beep-duration');
        const inputStartBeepFreq = this.querySelector('#input-start-beep-frequency');
        const duration = inputStartBeep ? parseFloat(inputStartBeep.value) : 0.5;
        const frequency = inputStartBeepFreq ? parseInt(inputStartBeepFreq.value, 10) : 1000;
        window.speechService.playStartBeep(duration, frequency);
      });
    }
    const btnTestLapBeep = this.querySelector('#btn-test-lap-beep');
    if (btnTestLapBeep) {
      btnTestLapBeep.addEventListener('click', () => {
        const inputLapBeep = this.querySelector('#input-lap-beep-duration');
        const inputLapBeepFreq = this.querySelector('#input-lap-beep-frequency');
        const duration = inputLapBeep ? parseFloat(inputLapBeep.value) : 0.50;
        const frequency = inputLapBeepFreq ? parseInt(inputLapBeepFreq.value, 10) : 1300;
        window.speechService.playLapBeep(duration, frequency);
      });
    }
    const btnTestEndBeep = this.querySelector('#btn-test-end-beep');
    if (btnTestEndBeep) {
      btnTestEndBeep.addEventListener('click', () => {
        const inputEndBeep = this.querySelector('#input-end-beep-duration');
        const inputEndBeepFreq = this.querySelector('#input-end-beep-frequency');
        const duration = inputEndBeep ? parseFloat(inputEndBeep.value) : 0.5;
        const frequency = inputEndBeepFreq ? parseInt(inputEndBeepFreq.value, 10) : 500;
        window.speechService.playEndBeep(duration, frequency);
      });
    }

    // Bind start beep duration buttons
    const btnStartBeepDown = this.querySelector('#btn-start-beep-duration-down');
    const btnStartBeepUp = this.querySelector('#btn-start-beep-duration-up');
    const inputStartBeep = this.querySelector('#input-start-beep-duration');
    if (btnStartBeepDown && btnStartBeepUp && inputStartBeep) {
      btnStartBeepDown.addEventListener('click', () => {
        let val = parseFloat(inputStartBeep.value) || 0.5;
        val = Math.max(0.1, val - 0.1);
        inputStartBeep.value = val.toFixed(1) + 's';
      });
      btnStartBeepUp.addEventListener('click', () => {
        let val = parseFloat(inputStartBeep.value) || 0.5;
        val = Math.min(2.0, val + 0.1);
        inputStartBeep.value = val.toFixed(1) + 's';
      });
    }

    // Bind start beep frequency buttons
    const btnStartBeepFreqDown = this.querySelector('#btn-start-beep-frequency-down');
    const btnStartBeepFreqUp = this.querySelector('#btn-start-beep-frequency-up');
    const inputStartBeepFreq = this.querySelector('#input-start-beep-frequency');
    if (btnStartBeepFreqDown && btnStartBeepFreqUp && inputStartBeepFreq) {
      btnStartBeepFreqDown.addEventListener('click', () => {
        let val = parseInt(inputStartBeepFreq.value, 10) || 1000;
        val = Math.max(300, val - 100);
        inputStartBeepFreq.value = val + ' Hz';
      });
      btnStartBeepFreqUp.addEventListener('click', () => {
        let val = parseInt(inputStartBeepFreq.value, 10) || 1000;
        val = Math.min(3000, val + 100);
        inputStartBeepFreq.value = val + ' Hz';
      });
    }

    // Bind lap beep duration buttons
    const btnLapBeepDown = this.querySelector('#btn-lap-beep-duration-down');
    const btnLapBeepUp = this.querySelector('#btn-lap-beep-duration-up');
    const inputLapBeep = this.querySelector('#input-lap-beep-duration');
    if (btnLapBeepDown && btnLapBeepUp && inputLapBeep) {
      btnLapBeepDown.addEventListener('click', () => {
        let val = parseFloat(inputLapBeep.value) || 0.50;
        val = Math.max(0.01, val - 0.05);
        inputLapBeep.value = val.toFixed(2) + 's';
      });
      btnLapBeepUp.addEventListener('click', () => {
        let val = parseFloat(inputLapBeep.value) || 0.50;
        val = Math.min(1.00, val + 0.05);
        inputLapBeep.value = val.toFixed(2) + 's';
      });
    }

    // Bind lap beep frequency buttons
    const btnLapBeepFreqDown = this.querySelector('#btn-lap-beep-frequency-down');
    const btnLapBeepFreqUp = this.querySelector('#btn-lap-beep-frequency-up');
    const inputLapBeepFreq = this.querySelector('#input-lap-beep-frequency');
    if (btnLapBeepFreqDown && btnLapBeepFreqUp && inputLapBeepFreq) {
      btnLapBeepFreqDown.addEventListener('click', () => {
        let val = parseInt(inputLapBeepFreq.value, 10) || 1300;
        val = Math.max(300, val - 100);
        inputLapBeepFreq.value = val + ' Hz';
      });
      btnLapBeepFreqUp.addEventListener('click', () => {
        let val = parseInt(inputLapBeepFreq.value, 10) || 1300;
        val = Math.min(3000, val + 100);
        inputLapBeepFreq.value = val + ' Hz';
      });
    }

    // Bind end beep duration buttons
    const btnEndBeepDown = this.querySelector('#btn-end-beep-duration-down');
    const btnEndBeepUp = this.querySelector('#btn-end-beep-duration-up');
    const inputEndBeep = this.querySelector('#input-end-beep-duration');
    if (btnEndBeepDown && btnEndBeepUp && inputEndBeep) {
      btnEndBeepDown.addEventListener('click', () => {
        let val = parseFloat(inputEndBeep.value) || 0.5;
        val = Math.max(0.1, val - 0.1);
        inputEndBeep.value = val.toFixed(1) + 's';
      });
      btnEndBeepUp.addEventListener('click', () => {
        let val = parseFloat(inputEndBeep.value) || 0.5;
        val = Math.min(2.0, val + 0.1);
        inputEndBeep.value = val.toFixed(1) + 's';
      });
    }

    // Bind end beep frequency buttons
    const btnEndBeepFreqDown = this.querySelector('#btn-end-beep-frequency-down');
    const btnEndBeepFreqUp = this.querySelector('#btn-end-beep-frequency-up');
    const inputEndBeepFreq = this.querySelector('#input-end-beep-frequency');
    if (btnEndBeepFreqDown && btnEndBeepFreqUp && inputEndBeepFreq) {
      btnEndBeepFreqDown.addEventListener('click', () => {
        let val = parseInt(inputEndBeepFreq.value, 10) || 500;
        val = Math.max(300, val - 100);
        inputEndBeepFreq.value = val + ' Hz';
      });
      btnEndBeepFreqUp.addEventListener('click', () => {
        let val = parseInt(inputEndBeepFreq.value, 10) || 500;
        val = Math.min(3000, val + 100);
        inputEndBeepFreq.value = val + ' Hz';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const startBeepSwitch = this.querySelector('#switch-start-beep');
        const startBeepValue = startBeepSwitch ? startBeepSwitch.checked : true;
        const lapBeepSwitch = this.querySelector('#switch-lap-beep');
        const lapBeepValue = lapBeepSwitch ? lapBeepSwitch.checked : true;
        const endBeepSwitch = this.querySelector('#switch-end-beep');
        const endBeepValue = endBeepSwitch ? endBeepSwitch.checked : true;

        const startBeepDurationInput = this.querySelector('#input-start-beep-duration');
        const startBeepDurationValue = startBeepDurationInput ? parseFloat(startBeepDurationInput.value) : 0.5;
        const lapBeepDurationInput = this.querySelector('#input-lap-beep-duration');
        const lapBeepDurationValue = lapBeepDurationInput ? parseFloat(lapBeepDurationInput.value) : 0.50;
        const endBeepDurationInput = this.querySelector('#input-end-beep-duration');
        const endBeepDurationValue = endBeepDurationInput ? parseFloat(endBeepDurationInput.value) : 0.5;

        const startBeepFrequencyInput = this.querySelector('#input-start-beep-frequency');
        const startBeepFrequencyValue = startBeepFrequencyInput ? parseInt(startBeepFrequencyInput.value, 10) : 1000;
        const lapBeepFrequencyInput = this.querySelector('#input-lap-beep-frequency');
        const lapBeepFrequencyValue = lapBeepFrequencyInput ? parseInt(lapBeepFrequencyInput.value, 10) : 1300;
        const endBeepFrequencyInput = this.querySelector('#input-end-beep-frequency');
        const endBeepFrequencyValue = endBeepFrequencyInput ? parseInt(endBeepFrequencyInput.value, 10) : 500;

        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.start_beep = startBeepValue;
          updatedSettings.lap_beep = lapBeepValue;
          updatedSettings.end_beep = endBeepValue;
          updatedSettings.start_beep_duration = startBeepDurationValue;
          updatedSettings.lap_beep_duration = lapBeepDurationValue;
          updatedSettings.end_beep_duration = endBeepDurationValue;
          updatedSettings.start_beep_frequency = startBeepFrequencyValue;
          updatedSettings.lap_beep_frequency = lapBeepFrequencyValue;
          updatedSettings.end_beep_frequency = endBeepFrequencyValue;

          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            this._savedStartBeepDuration = startBeepDurationValue;
            this._savedLapBeepDuration = lapBeepDurationValue;
            this._savedEndBeepDuration = endBeepDurationValue;
            this._savedStartBeepFrequency = startBeepFrequencyValue;
            this._savedLapBeepFrequency = lapBeepFrequencyValue;
            this._savedEndBeepFrequency = endBeepFrequencyValue;

            const btn = this.querySelector('#btn-save-sound-signals');
            if (btn) {
              const originalHtml = btn.innerHTML;
              btn.innerHTML = `<i class="mdi mdi-check-circle-outline fs-5"></i> ${window.t('settings.feedback.saved')}`;
              btn.classList.remove('btn-primary');
              btn.classList.add('btn-success');
              btn.disabled = true;
 
              setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
                btn.disabled = false;
              }, 2000);
            }
          }
        }).catch(err => {
          console.error('Failed to save sound signals settings:', err);
        });
      });
    }
  }
}

customElements.define('slotrace-settings-sound-signals', SlotRaceSettingsSoundSignals);

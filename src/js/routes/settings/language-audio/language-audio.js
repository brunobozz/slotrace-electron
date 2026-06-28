class SlotRaceSettingsLanguageAudio extends HTMLElement {
  connectedCallback() {
    this._savedVoiceName = ""; // Memory of selected voice
    this._savedSpeechRate = 1.0; // Memory of speech rate
    this._tooltips = []; // Active tooltips registry
    this.render();
    
    // Fetch and initialize the preferences from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        const langSelect = this.querySelector('#select-language');
        const rateInput = this.querySelector('#input-speech-rate');
        
        if (settings.language && langSelect) {
          langSelect.value = settings.language;
        }
        if (settings.speech_voice) {
          this._savedVoiceName = settings.speech_voice;
        }
        if (settings.speech_rate !== undefined) {
          this._savedSpeechRate = parseFloat(settings.speech_rate) || 1.0;
          if (rateInput) {
            rateInput.value = this._savedSpeechRate.toFixed(1);
          }
        }
        this._savedStartBeepDuration = settings.start_beep_duration !== undefined ? parseFloat(settings.start_beep_duration) : 0.5;
        this._savedLapBeepDuration = settings.lap_beep_duration !== undefined ? parseFloat(settings.lap_beep_duration) : 0.08;
        this._savedStartBeepFrequency = settings.start_beep_frequency !== undefined ? parseInt(settings.start_beep_frequency, 10) : 800;
        this._savedLapBeepFrequency = settings.lap_beep_frequency !== undefined ? parseInt(settings.lap_beep_frequency, 10) : 1200;

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
        
        // Populate voice options after loading settings
        this._populateVoices(this._savedVoiceName);
      }
    }).catch(err => {
      console.error('Failed to load language/audio settings from database:', err);
    });

    this._langListener = () => {
      const langEl = this.querySelector('#select-language');
      const speechTestEl = this.querySelector('#input-speech-test');
      const voiceSelect = this.querySelector('#select-speech-voice');
      const speechRateEl = this.querySelector('#input-speech-rate');
      const startBeepEl = this.querySelector('#switch-start-beep');
      const lapBeepEl = this.querySelector('#switch-lap-beep');
      const startBeepDurationEl = this.querySelector('#input-start-beep-duration');
      const lapBeepDurationEl = this.querySelector('#input-lap-beep-duration');
      const startBeepFrequencyEl = this.querySelector('#input-start-beep-frequency');
      const lapBeepFrequencyEl = this.querySelector('#input-lap-beep-frequency');
      
      const currentLang = langEl ? langEl.value : 'pt';
      const currentSpeechText = speechTestEl ? speechTestEl.value : '';
      const currentVoice = voiceSelect ? voiceSelect.value : '';
      const currentSpeechRate = speechRateEl ? speechRateEl.value : '1.0';
      const currentStartBeep = startBeepEl ? startBeepEl.checked : true;
      const currentLapBeep = lapBeepEl ? lapBeepEl.checked : true;
      const currentStartBeepDuration = startBeepDurationEl ? startBeepDurationEl.value : '0.5s';
      const currentLapBeepDuration = lapBeepDurationEl ? lapBeepDurationEl.value : '0.08s';
      const currentStartBeepFrequency = startBeepFrequencyEl ? startBeepFrequencyEl.value : '800 Hz';
      const currentLapBeepFrequency = lapBeepFrequencyEl ? lapBeepFrequencyEl.value : '1200 Hz';
      
      this.render();
      
      const newLangEl = this.querySelector('#select-language');
      const newSpeechTestEl = this.querySelector('#input-speech-test');
      const newSpeechRateEl = this.querySelector('#input-speech-rate');
      const newStartBeepEl = this.querySelector('#switch-start-beep');
      const newLapBeepEl = this.querySelector('#switch-lap-beep');
      const newStartBeepDurationEl = this.querySelector('#input-start-beep-duration');
      const newLapBeepDurationEl = this.querySelector('#input-lap-beep-duration');
      const newStartBeepFrequencyEl = this.querySelector('#input-start-beep-frequency');
      const newLapBeepFrequencyEl = this.querySelector('#input-lap-beep-frequency');
      const startBeepTestContainer = this.querySelector('#container-start-beep-test');
      const startBeepDurationContainer = this.querySelector('#container-start-beep-duration');
      const startBeepFrequencyContainer = this.querySelector('#container-start-beep-frequency');
      const lapBeepTestContainer = this.querySelector('#container-lap-beep-test');
      const lapBeepDurationContainer = this.querySelector('#container-lap-beep-duration');
      const lapBeepFrequencyContainer = this.querySelector('#container-lap-beep-frequency');
      
      if (newLangEl) newLangEl.value = currentLang;
      if (newSpeechTestEl) newSpeechTestEl.value = currentSpeechText;
      if (newSpeechRateEl) newSpeechRateEl.value = currentSpeechRate;
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
      if (newStartBeepDurationEl) newStartBeepDurationEl.value = currentStartBeepDuration;
      if (newLapBeepDurationEl) newLapBeepDurationEl.value = currentLapBeepDuration;
      if (newStartBeepFrequencyEl) newStartBeepFrequencyEl.value = currentStartBeepFrequency;
      if (newLapBeepFrequencyEl) newLapBeepFrequencyEl.value = currentLapBeepFrequency;
      
      this._populateVoices(currentVoice || this._savedVoiceName);
    };
    window.addEventListener('languageChanged', this._langListener);

    // Listen to OS voice loading events (Web Speech API voices are async)
    this._voicesChangedListener = () => {
      this._populateVoices(this._savedVoiceName);
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', this._voicesChangedListener);
    }
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._voicesChangedListener && window.speechSynthesis) {
      window.speechSynthesis.removeEventListener('voiceschanged', this._voicesChangedListener);
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

  _populateVoices(savedVoiceName = "") {
    const voiceSelect = this.querySelector('#select-speech-voice');
    if (!voiceSelect) return;

    // Keep the default option and clear others
    voiceSelect.innerHTML = `<option value="">${window.t('settings.preferences.speech_voice_default')}</option>`;

    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();

      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name === savedVoiceName) {
          option.selected = true;
        }
        voiceSelect.appendChild(option);
      });
    }
  }

  render() {
    const isWindows = navigator.userAgent.toLowerCase().includes('win');
    
    // Clear any previous tooltips before rewriting innerHTML
    this._clearTooltips();

    this.innerHTML = `
      <style>
        #form-language-audio .form-check-input {
          width: 2.8em !important;
          height: 1.4em !important;
          cursor: pointer;
        }
      </style>
      <slotrace-settings-header title="${window.t('settings.menu.language_audio')}" icon="mdi-volume-high"></slotrace-settings-header>
      
      <form id="form-language-audio" class="needs-validation fade-in" novalidate>
        <!-- Language Select -->
        <div class="mb-4">
          <label for="select-language" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
            <span>${window.t('settings.preferences.language_label')}</span>
            <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.language_help')}"></i>
          </label>
          <select class="form-select p-2.5" id="select-language" required>
            <option value="pt">Português</option>
          </select>
        </div>

        <hr class="border-secondary-subtle opacity-25 my-4">

        <!-- Speech Synthesis Controls Row -->
        <div class="row g-3 mb-2">
          <!-- Voice Select (50% width) -->
          <div class="col-6">
            <label for="select-speech-voice" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
              <span>${window.t('settings.preferences.speech_voice_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.speech_voice_help')}"></i>
            </label>
            <select class="form-select p-2.5" id="select-speech-voice">
              <option value="">${window.t('settings.preferences.speech_voice_default')}</option>
            </select>
          </div>

          <!-- Speech Rate Picker (25% width) -->
          <div class="col-3">
            <label for="input-speech-rate" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
              <span>${window.t('settings.preferences.speech_rate_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.speech_rate_help')}"></i>
            </label>
            <div class="input-group">
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-speech-rate-down">
                <i class="mdi mdi-minus"></i>
              </button>
              <input type="text" class="form-control text-center p-2.5" id="input-speech-rate" value="${(this._savedSpeechRate || 1.0).toFixed(1)}" readonly style="cursor: default; font-weight: 500;">
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-speech-rate-up">
                <i class="mdi mdi-plus"></i>
              </button>
            </div>
          </div>

          <!-- Add Windows Voices Button (25% width) -->
          <div class="col-3 d-flex flex-column justify-content-end">
            ${isWindows ? `
              <button class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 px-3 text-nowrap p-2.5" type="button" id="btn-open-windows-speech" title="Abrir Configurações do Windows para adicionar vozes">
                <i class="mdi mdi-cog-outline"></i>
                <span>${window.t('settings.preferences.speech_add_voices_button')}</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Speech Synthesis Audio Test -->
        <div class="mb-3">
          <label for="input-speech-test" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
            <span>${window.t('settings.preferences.speech_test_label')}</span>
            <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.speech_test_help')}"></i>
          </label>
          <div class="input-group">
            <input type="text" class="form-control p-2.5" id="input-speech-test" placeholder="${window.t('settings.preferences.speech_test_placeholder')}" value="Melhor Volta Fenda Amarela">
            <button class="btn btn-primary d-flex align-items-center gap-2 px-3" type="button" id="btn-speech-test">
              <i class="mdi mdi-volume-high"></i>
              <span>${window.t('settings.preferences.speech_test_button')}</span>
            </button>
          </div>
        </div>

        <hr class="border-secondary-subtle opacity-25 my-4">

        <!-- Start Beep Switch -->
        <div class="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label for="switch-start-beep" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.start_beep_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.start_beep_help')}"></i>
            </label>
          </div>
          <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="switch-start-beep" style="cursor: pointer;">
          </div>
        </div>

        <!-- Start Beep Test Button Control -->
        <div class="mb-3 ps-3 border-start border-secondary border-opacity-25 d-flex justify-content-end" id="container-start-beep-test" style="display: none;">
          <button type="button" class="btn btn-primary d-flex align-items-center gap-2 px-3" id="btn-test-start-beep">
            <i class="mdi mdi-volume-high fs-6"></i>
            <span>${window.t('settings.preferences.test_beep_button') || 'Testar'}</span>
          </button>
        </div>

        <!-- Start Beep Duration Control -->
        <div class="mb-3 ps-3 border-start border-secondary border-opacity-25 d-flex align-items-center justify-content-between" id="container-start-beep-duration" style="display: none;">
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
        <div class="mb-4 ps-3 border-start border-secondary border-opacity-25 d-flex align-items-center justify-content-between" id="container-start-beep-frequency" style="display: none;">
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
            <input type="text" class="form-control text-center p-2.5" id="input-start-beep-frequency" value="${this._savedStartBeepFrequency || 800} Hz" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-start-beep-frequency-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Lap Beep Switch -->
        <div class="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label for="switch-lap-beep" class="form-label fw-semibold text-secondary small mb-0 d-flex align-items-center gap-1.5" style="cursor: pointer;">
              <span>${window.t('settings.preferences.lap_beep_label')}</span>
              <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.lap_beep_help')}"></i>
            </label>
          </div>
          <div class="form-check form-switch fs-5">
            <input class="form-check-input" type="checkbox" role="switch" id="switch-lap-beep" style="cursor: pointer;">
          </div>
        </div>

        <!-- Lap Beep Test Button Control -->
        <div class="mb-3 ps-3 border-start border-secondary border-opacity-25 d-flex justify-content-end" id="container-lap-beep-test" style="display: none;">
          <button type="button" class="btn btn-primary d-flex align-items-center gap-2 px-3" id="btn-test-lap-beep">
            <i class="mdi mdi-volume-high fs-6"></i>
            <span>${window.t('settings.preferences.test_beep_button') || 'Testar'}</span>
          </button>
        </div>

        <!-- Lap Beep Duration Control -->
        <div class="mb-3 ps-3 border-start border-secondary border-opacity-25 d-flex align-items-center justify-content-between" id="container-lap-beep-duration" style="display: none;">
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
            <input type="text" class="form-control text-center p-2.5" id="input-lap-beep-duration" value="${(this._savedLapBeepDuration || 0.08).toFixed(2)}s" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-duration-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <!-- Lap Beep Frequency Control -->
        <div class="mb-4 ps-3 border-start border-secondary border-opacity-25 d-flex align-items-center justify-content-between" id="container-lap-beep-frequency" style="display: none;">
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
            <input type="text" class="form-control text-center p-2.5" id="input-lap-beep-frequency" value="${this._savedLapBeepFrequency || 1200} Hz" readonly style="cursor: default; font-weight: 500;">
            <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-lap-beep-frequency-up">
              <i class="mdi mdi-plus"></i>
            </button>
          </div>
        </div>

        <button type="submit" id="btn-save-language-audio" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.preferences.save_button')}
        </button>
      </form>
    `;

    // Re-bind form elements and events
    const form = this.querySelector('#form-language-audio');
    const langSelect = this.querySelector('#select-language');
    const voiceSelect = this.querySelector('#select-speech-voice');
    const btnSpeechTest = this.querySelector('#btn-speech-test');
    const inputSpeechTest = this.querySelector('#input-speech-test');
    const btnRateDown = this.querySelector('#btn-speech-rate-down');
    const btnRateUp = this.querySelector('#btn-speech-rate-up');
    const inputRate = this.querySelector('#input-speech-rate');

    // Populate voice dropdown initially
    this._populateVoices(this._savedVoiceName);

    // Initialize Bootstrap Tooltips
    const tooltipTriggerList = this.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap && window.bootstrap.Tooltip) {
      this._tooltips = Array.from(tooltipTriggerList).map(el => new window.bootstrap.Tooltip(el));
    }

    // Refresh voice list when language is changed in select
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        this._populateVoices(voiceSelect ? voiceSelect.value : this._savedVoiceName);
      });
    }

    // Bind rate controls
    if (btnRateDown && btnRateUp && inputRate) {
      btnRateDown.addEventListener('click', () => {
        let val = parseFloat(inputRate.value) || 1.0;
        val = Math.max(0.5, val - 0.1);
        inputRate.value = val.toFixed(1);
      });

      btnRateUp.addEventListener('click', () => {
        let val = parseFloat(inputRate.value) || 1.0;
        val = Math.min(3.0, val + 0.1);
        inputRate.value = val.toFixed(1);
      });
    }

    // Bind open windows settings
    const btnOpenWindowsSpeech = this.querySelector('#btn-open-windows-speech');
    if (btnOpenWindowsSpeech) {
      btnOpenWindowsSpeech.addEventListener('click', () => {
        if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
          window.electronAPI.openExternal('ms-settings:speech');
        }
      });
    }

    // Bind speech test button
    if (btnSpeechTest && inputSpeechTest) {
      btnSpeechTest.addEventListener('click', () => {
        const text = inputSpeechTest.value.trim();
        const selectedVoice = voiceSelect ? voiceSelect.value : "";
        const selectedRate = inputRate ? parseFloat(inputRate.value) : 1.0;
        if (text) {
          const previousVoice = window.speechService._voiceName;
          const previousRate = window.speechService._rate;
          window.speechService.setVoice(selectedVoice);
          window.speechService.setRate(selectedRate);
          window.speechService.speakText(text);
          window.speechService.setVoice(previousVoice);
          window.speechService.setRate(previousRate);
        }
      });
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

    // Bind beep test buttons
    const btnTestStartBeep = this.querySelector('#btn-test-start-beep');
    if (btnTestStartBeep) {
      btnTestStartBeep.addEventListener('click', () => {
        const inputStartBeep = this.querySelector('#input-start-beep-duration');
        const inputStartBeepFreq = this.querySelector('#input-start-beep-frequency');
        const duration = inputStartBeep ? parseFloat(inputStartBeep.value) : 0.5;
        const frequency = inputStartBeepFreq ? parseInt(inputStartBeepFreq.value, 10) : 800;
        window.speechService.playStartBeep(duration, frequency);
      });
    }
    const btnTestLapBeep = this.querySelector('#btn-test-lap-beep');
    if (btnTestLapBeep) {
      btnTestLapBeep.addEventListener('click', () => {
        const inputLapBeep = this.querySelector('#input-lap-beep-duration');
        const inputLapBeepFreq = this.querySelector('#input-lap-beep-frequency');
        const duration = inputLapBeep ? parseFloat(inputLapBeep.value) : 0.08;
        const frequency = inputLapBeepFreq ? parseInt(inputLapBeepFreq.value, 10) : 1200;
        window.speechService.playLapBeep(duration, frequency);
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
        let val = parseInt(inputStartBeepFreq.value, 10) || 800;
        val = Math.max(300, val - 100);
        inputStartBeepFreq.value = val + ' Hz';
      });
      btnStartBeepFreqUp.addEventListener('click', () => {
        let val = parseInt(inputStartBeepFreq.value, 10) || 800;
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
        let val = parseFloat(inputLapBeep.value) || 0.08;
        val = Math.max(0.01, val - 0.01);
        inputLapBeep.value = val.toFixed(2) + 's';
      });
      btnLapBeepUp.addEventListener('click', () => {
        let val = parseFloat(inputLapBeep.value) || 0.08;
        val = Math.min(1.00, val + 0.01);
        inputLapBeep.value = val.toFixed(2) + 's';
      });
    }

    // Bind lap beep frequency buttons
    const btnLapBeepFreqDown = this.querySelector('#btn-lap-beep-frequency-down');
    const btnLapBeepFreqUp = this.querySelector('#btn-lap-beep-frequency-up');
    const inputLapBeepFreq = this.querySelector('#input-lap-beep-frequency');
    if (btnLapBeepFreqDown && btnLapBeepFreqUp && inputLapBeepFreq) {
      btnLapBeepFreqDown.addEventListener('click', () => {
        let val = parseInt(inputLapBeepFreq.value, 10) || 1200;
        val = Math.max(300, val - 100);
        inputLapBeepFreq.value = val + ' Hz';
      });
      btnLapBeepFreqUp.addEventListener('click', () => {
        let val = parseInt(inputLapBeepFreq.value, 10) || 1200;
        val = Math.min(3000, val + 100);
        inputLapBeepFreq.value = val + ' Hz';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const langValue = langSelect ? langSelect.value : 'pt';
        const voiceValue = voiceSelect ? voiceSelect.value : '';
        const rateValue = inputRate ? parseFloat(inputRate.value) : 1.0;
        const startBeepSwitch = this.querySelector('#switch-start-beep');
        const startBeepValue = startBeepSwitch ? startBeepSwitch.checked : true;
        const lapBeepSwitch = this.querySelector('#switch-lap-beep');
        const lapBeepValue = lapBeepSwitch ? lapBeepSwitch.checked : true;
        const startBeepDurationInput = this.querySelector('#input-start-beep-duration');
        const startBeepDurationValue = startBeepDurationInput ? parseFloat(startBeepDurationInput.value) : 0.5;
        const lapBeepDurationInput = this.querySelector('#input-lap-beep-duration');
        const lapBeepDurationValue = lapBeepDurationInput ? parseFloat(lapBeepDurationInput.value) : 0.08;
        const startBeepFrequencyInput = this.querySelector('#input-start-beep-frequency');
        const startBeepFrequencyValue = startBeepFrequencyInput ? parseInt(startBeepFrequencyInput.value, 10) : 800;
        const lapBeepFrequencyInput = this.querySelector('#input-lap-beep-frequency');
        const lapBeepFrequencyValue = lapBeepFrequencyInput ? parseInt(lapBeepFrequencyInput.value, 10) : 1200;

        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.language = langValue;
          updatedSettings.speech_voice = voiceValue;
          updatedSettings.speech_rate = rateValue;
          updatedSettings.start_beep = startBeepValue;
          updatedSettings.lap_beep = lapBeepValue;
          updatedSettings.start_beep_duration = startBeepDurationValue;
          updatedSettings.lap_beep_duration = lapBeepDurationValue;
          updatedSettings.start_beep_frequency = startBeepFrequencyValue;
          updatedSettings.lap_beep_frequency = lapBeepFrequencyValue;

          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            this._savedStartBeepDuration = startBeepDurationValue;
            this._savedLapBeepDuration = lapBeepDurationValue;
            this._savedStartBeepFrequency = startBeepFrequencyValue;
            this._savedLapBeepFrequency = lapBeepFrequencyValue;

            window.currentLanguage = langValue;
            window.speechService.setVoice(voiceValue);
            window.speechService.setRate(rateValue);
            this._savedVoiceName = voiceValue;
            this._savedSpeechRate = rateValue;

            window.dispatchEvent(new CustomEvent('languageChanged', { detail: langValue }));

            const btn = this.querySelector('#btn-save-language-audio');
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
          console.error('Failed to save language and audio settings:', err);
        });
      });
    }
  }
}

customElements.define('slotrace-settings-language-audio', SlotRaceSettingsLanguageAudio);

class SlotRaceSettingsLanguageVoice extends HTMLElement {
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
        
        // Populate voice options after loading settings
        this._populateVoices(this._savedVoiceName);
      }
    }).catch(err => {
      console.error('Failed to load language/voice settings from database:', err);
    });

    this._langListener = () => {
      const langEl = this.querySelector('#select-language');
      const speechTestEl = this.querySelector('#input-speech-test');
      const voiceSelect = this.querySelector('#select-speech-voice');
      const speechRateEl = this.querySelector('#input-speech-rate');
      
      const currentLang = langEl ? langEl.value : 'pt';
      const currentSpeechText = speechTestEl ? speechTestEl.value : '';
      const currentVoice = voiceSelect ? voiceSelect.value : '';
      const currentSpeechRate = speechRateEl ? speechRateEl.value : '1.0';
      
      this.render();
      
      const newLangEl = this.querySelector('#select-language');
      const newSpeechTestEl = this.querySelector('#input-speech-test');
      const newSpeechRateEl = this.querySelector('#input-speech-rate');
      
      if (newLangEl) newLangEl.value = currentLang;
      if (newSpeechTestEl) newSpeechTestEl.value = currentSpeechText;
      if (newSpeechRateEl) newSpeechRateEl.value = currentSpeechRate;
      
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
      <slotrace-settings-header title="${window.t('settings.menu.language_voice') || 'Idioma e Voz'}" icon="mdi-translate"></slotrace-settings-header>
      
      <form id="form-language-voice" class="needs-validation fade-in" novalidate>
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

        <button type="submit" id="btn-save-language-voice" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2 mt-4">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.preferences.save_button')}
        </button>
      </form>
    `;

    // Re-bind form elements and events
    const form = this.querySelector('#form-language-voice');
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

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const langValue = langSelect ? langSelect.value : 'pt';
        const voiceValue = voiceSelect ? voiceSelect.value : '';
        const rateValue = inputRate ? parseFloat(inputRate.value) : 1.0;

        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.language = langValue;
          updatedSettings.speech_voice = voiceValue;
          updatedSettings.speech_rate = rateValue;

          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            window.currentLanguage = langValue;
            window.speechService.setVoice(voiceValue);
            window.speechService.setRate(rateValue);
            this._savedVoiceName = voiceValue;
            this._savedSpeechRate = rateValue;

            window.dispatchEvent(new CustomEvent('languageChanged', { detail: langValue }));

            const btn = this.querySelector('#btn-save-language-voice');
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
          console.error('Failed to save language and voice settings:', err);
        });
      });
    }
  }
}

customElements.define('slotrace-settings-language-voice', SlotRaceSettingsLanguageVoice);

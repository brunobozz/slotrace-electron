class SlotRaceSettingsPreferences extends HTMLElement {
  connectedCallback() {
    this._savedVoiceName = ""; // Memory of selected voice
    this._savedSpeechRate = 1.0; // Memory of speech rate
    this.render();
    
    // Fetch and initialize the preferences from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        const input = this.querySelector('#input-main-color');
        const themeSelect = this.querySelector('#select-theme');
        const langSelect = this.querySelector('#select-language');
        const rateInput = this.querySelector('#input-speech-rate');
        
        if (settings.main_color && input) {
          input.value = settings.main_color;
        }
        if (settings.theme && themeSelect) {
          themeSelect.value = settings.theme;
        }
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
      console.error('Failed to load preferences from database:', err);
    });

    this._langListener = () => {
      const inputEl = this.querySelector('#input-main-color');
      const themeEl = this.querySelector('#select-theme');
      const langEl = this.querySelector('#select-language');
      const speechTestEl = this.querySelector('#input-speech-test');
      const voiceSelect = this.querySelector('#select-speech-voice');
      const speechRateEl = this.querySelector('#input-speech-rate');
      
      const currentVal = inputEl ? inputEl.value : '#dc3545';
      const currentTheme = themeEl ? themeEl.value : 'dark';
      const currentLang = langEl ? langEl.value : 'pt';
      const currentSpeechText = speechTestEl ? speechTestEl.value : '';
      const currentVoice = voiceSelect ? voiceSelect.value : '';
      const currentSpeechRate = speechRateEl ? speechRateEl.value : '1.0';
      
      this.render();
      
      const newInputEl = this.querySelector('#input-main-color');
      const newThemeEl = this.querySelector('#select-theme');
      const newLangEl = this.querySelector('#select-language');
      const newSpeechTestEl = this.querySelector('#input-speech-test');
      const newSpeechRateEl = this.querySelector('#input-speech-rate');
      
      if (newInputEl) newInputEl.value = currentVal;
      if (newThemeEl) newThemeEl.value = currentTheme;
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
  }

  _populateVoices(savedVoiceName = "") {
    const voiceSelect = this.querySelector('#select-speech-voice');
    if (!voiceSelect) return;

    // Keep the default option and clear others
    voiceSelect.innerHTML = `<option value="">${window.t('settings.preferences.speech_voice_default')}</option>`;

    // Filter voices matching current language selection
    const langSelect = this.querySelector('#select-language');
    const currentLang = langSelect ? langSelect.value : (window.currentLanguage || 'pt');

    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const filteredVoices = voices.filter(v => v.lang.startsWith(currentLang));

      filteredVoices.forEach(voice => {
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
    this.innerHTML = `
      <slotrace-settings-header title="${window.t('settings.menu.preferences')}" icon="mdi-tune"></slotrace-settings-header>
      
      <form id="form-preferences" class="needs-validation fade-in" novalidate>
        <!-- Language Select -->
        <div class="mb-4">
          <label for="select-language" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.language_label')}</label>
          <select class="form-select p-2.5" id="select-language" required>
            <option value="pt">Português</option>
          </select>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.language_help')}</span>
        </div>

        <!-- Synthesizer Voice Select & Speed -->
        <div class="mb-4">
          <label for="select-speech-voice" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.speech_voice_label')}</label>
          <div class="d-flex gap-2">
            <select class="form-select p-2.5" id="select-speech-voice">
              <option value="">${window.t('settings.preferences.speech_voice_default')}</option>
            </select>
            
            <!-- Speech Rate (Speed) Controls -->
            <div class="input-group" style="max-width: 135px;" title="Velocidade da voz">
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-speech-rate-down">
                <i class="mdi mdi-minus"></i>
              </button>
              <input type="text" class="form-control text-center p-2.5" id="input-speech-rate" value="${(this._savedSpeechRate || 1.0).toFixed(1)}" readonly style="cursor: default; font-weight: 500;">
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2.5" type="button" id="btn-speech-rate-up">
                <i class="mdi mdi-plus"></i>
              </button>
            </div>

            ${isWindows ? `
              <button class="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 text-nowrap" type="button" id="btn-open-windows-speech" title="Abrir Configurações do Windows para adicionar vozes">
                <i class="mdi mdi-cog-outline"></i>
                <span>${window.t('settings.preferences.speech_add_voices_button')}</span>
              </button>
            ` : ''}
          </div>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.speech_voice_help')}</span>
        </div>

        <!-- Speech Synthesis Audio Test -->
        <div class="mb-4">
          <label for="input-speech-test" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.speech_test_label')}</label>
          <div class="input-group">
            <input type="text" class="form-control p-2.5" id="input-speech-test" placeholder="${window.t('settings.preferences.speech_test_placeholder')}" value="Melhor Volta Fenda Amarela">
            <button class="btn btn-primary d-flex align-items-center gap-2 px-3" type="button" id="btn-speech-test">
              <i class="mdi mdi-volume-high"></i>
              <span>${window.t('settings.preferences.speech_test_button')}</span>
            </button>
          </div>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.speech_test_help')}</span>
        </div>

        <!-- Theme Select -->
        <div class="mb-4">
          <label for="select-theme" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.theme_label')}</label>
          <select class="form-select p-2.5" id="select-theme" required>
            <option value="dark">${window.t('settings.preferences.theme_bootstrap_dark') || 'Bootstrap Dark'}</option>
            <option value="light">${window.t('settings.preferences.theme_bootstrap_light') || 'Bootstrap Light'}</option>
          </select>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.theme_help')}</span>
        </div>

        <!-- Main Color Select -->
        <div class="mb-4">
          <label for="input-main-color" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.color_label')}</label>
          <div class="d-flex align-items-center gap-3">
            <input type="color" class="form-control form-control-color p-1" id="input-main-color" value="#dc3545" title="${window.t('settings.preferences.color_help')}" style="width: 60px; height: 45px; cursor: pointer;">
            <span class="text-secondary small">${window.t('settings.preferences.color_help')}</span>
          </div>
        </div>
        
        <button type="submit" id="btn-save-preferences" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.preferences.save_button')}
        </button>
      </form>
    `;

    // Re-bind form elements and events
    const form = this.querySelector('#form-preferences');
    const input = this.querySelector('#input-main-color');
    const themeSelect = this.querySelector('#select-theme');
    const langSelect = this.querySelector('#select-language');
    const voiceSelect = this.querySelector('#select-speech-voice');
    const btnSpeechTest = this.querySelector('#btn-speech-test');
    const inputSpeechTest = this.querySelector('#input-speech-test');
    const btnRateDown = this.querySelector('#btn-speech-rate-down');
    const btnRateUp = this.querySelector('#btn-speech-rate-up');
    const inputRate = this.querySelector('#input-speech-rate');

    // Populate voice dropdown initially
    this._populateVoices(this._savedVoiceName);

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

    const btnOpenWindowsSpeech = this.querySelector('#btn-open-windows-speech');
    if (btnOpenWindowsSpeech) {
      btnOpenWindowsSpeech.addEventListener('click', () => {
        if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
          window.electronAPI.openExternal('ms-settings:speech');
        }
      });
    }

    if (btnSpeechTest && inputSpeechTest) {
      btnSpeechTest.addEventListener('click', () => {
        const text = inputSpeechTest.value.trim();
        const selectedVoice = voiceSelect ? voiceSelect.value : "";
        const selectedRate = inputRate ? parseFloat(inputRate.value) : 1.0;
        if (text) {
          // Temporarily set active voice and rate on service for testing
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
        const colorValue = input ? input.value : '#dc3545';
        const themeValue = themeSelect ? themeSelect.value : 'dark';
        const langValue = langSelect ? langSelect.value : 'pt';
        const voiceValue = voiceSelect ? voiceSelect.value : '';
        const rateValue = inputRate ? parseFloat(inputRate.value) : 1.0;
        
        // Load current settings, update color, theme, language, voice, and rate, then save
        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.main_color = colorValue;
          updatedSettings.theme = themeValue;
          updatedSettings.language = langValue;
          updatedSettings.speech_voice = voiceValue;
          updatedSettings.speech_rate = rateValue;
          
          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            // Apply changes dynamically immediately
            if (typeof window.applyMainColor === 'function') {
              window.applyMainColor(colorValue);
            }
            if (typeof window.applyTheme === 'function') {
              window.applyTheme(themeValue);
            }
            
            // Set global currentLanguage and broadcast translation change
            window.currentLanguage = langValue;
            window.speechService.setVoice(voiceValue);
            window.speechService.setRate(rateValue);
            this._savedVoiceName = voiceValue;
            this._savedSpeechRate = rateValue;
            
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: langValue }));
            
            // Premium visual feedback directly on the save button
            const btn = this.querySelector('#btn-save-preferences');
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
          console.error('Failed to save preferences:', err);
        });
      });
    }
  }
}

// Define the custom element <slotrace-settings-preferences>
customElements.define('slotrace-settings-preferences', SlotRaceSettingsPreferences);

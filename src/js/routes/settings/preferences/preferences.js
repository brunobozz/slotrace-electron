class SlotRaceSettingsPreferences extends HTMLElement {
  connectedCallback() {
    this.render();
    
    // Fetch and initialize the preferences from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        const input = this.querySelector('#input-main-color');
        const themeSelect = this.querySelector('#select-theme');
        const langSelect = this.querySelector('#select-language');
        
        if (settings.main_color && input) {
          input.value = settings.main_color;
        }
        if (settings.theme && themeSelect) {
          themeSelect.value = settings.theme;
        }
        if (settings.language && langSelect) {
          langSelect.value = settings.language;
        }
      }
    }).catch(err => {
      console.error('Failed to load preferences from database:', err);
    });

    this._langListener = () => {
      const inputEl = this.querySelector('#input-main-color');
      const themeEl = this.querySelector('#select-theme');
      const langEl = this.querySelector('#select-language');
      
      const currentVal = inputEl ? inputEl.value : '#dc3545';
      const currentTheme = themeEl ? themeEl.value : 'dark';
      const currentLang = langEl ? langEl.value : 'en';
      
      this.render();
      
      const newInputEl = this.querySelector('#input-main-color');
      const newThemeEl = this.querySelector('#select-theme');
      const newLangEl = this.querySelector('#select-language');
      
      if (newInputEl) newInputEl.value = currentVal;
      if (newThemeEl) newThemeEl.value = currentTheme;
      if (newLangEl) newLangEl.value = currentLang;
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <slotrace-settings-header title="${window.t('settings.menu.preferences')}" icon="mdi-tune"></slotrace-settings-header>
      
      <form id="form-preferences" class="needs-validation fade-in" novalidate>
        <div class="mb-4">
          <label for="select-language" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.language_label')}</label>
          <select class="form-select p-2.5" id="select-language" required>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
          </select>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.language_help')}</span>
        </div>

        <div class="mb-4">
          <label for="select-theme" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.theme_label')}</label>
          <select class="form-select p-2.5" id="select-theme" required>
            <option value="dark">${window.t('settings.preferences.theme_bootstrap_dark') || 'Bootstrap Dark'}</option>
            <option value="light">${window.t('settings.preferences.theme_bootstrap_light') || 'Bootstrap Light'}</option>
            <option value="tailwind_dark">${window.t('settings.preferences.theme_tailwind_dark') || 'Tailwind Dark'}</option>
            <option value="tailwind_light">${window.t('settings.preferences.theme_tailwind_light') || 'Tailwind Light'}</option>
          </select>
          <span class="text-secondary small d-block mt-1">${window.t('settings.preferences.theme_help')}</span>
        </div>

        <div class="mb-4">
          <label for="input-main-color" class="form-label fw-semibold text-secondary small">${window.t('settings.preferences.color_label')}</label>
          <div class="d-flex align-items-center gap-3">
            <input type="color" class="form-control form-control-color p-1" id="input-main-color" value="#dc3545" title="${window.t('settings.preferences.color_help')}" style="width: 60px; height: 45px; cursor: pointer;">
            <span class="text-secondary small">${window.t('settings.preferences.color_help')}</span>
          </div>
        </div>
        
        <button type="submit" id="btn-save-preferences" class="btn btn-primary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.preferences.save_button')}
        </button>
      </form>
    `;

    // Re-bind form submission
    const form = this.querySelector('#form-preferences');
    const input = this.querySelector('#input-main-color');
    const themeSelect = this.querySelector('#select-theme');
    const langSelect = this.querySelector('#select-language');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const colorValue = input ? input.value : '#dc3545';
        const themeValue = themeSelect ? themeSelect.value : 'dark';
        const langValue = langSelect ? langSelect.value : 'en';
        
        // Load current settings, update main_color, theme, and language, and save
        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.main_color = colorValue;
          updatedSettings.theme = themeValue;
          updatedSettings.language = langValue;
          
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

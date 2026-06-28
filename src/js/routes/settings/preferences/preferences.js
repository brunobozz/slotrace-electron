class SlotRaceSettingsPreferences extends HTMLElement {
  connectedCallback() {
    this._tooltips = []; // Active tooltips registry
    this.render();
    
    // Fetch and initialize the preferences from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        const input = this.querySelector('#input-main-color');
        const themeSelect = this.querySelector('#select-theme');
        
        if (settings.main_color && input) {
          input.value = settings.main_color;
        }
        if (settings.theme && themeSelect) {
          themeSelect.value = settings.theme;
        }
      }
    }).catch(err => {
      console.error('Failed to load preferences from database:', err);
    });

    this._langListener = () => {
      const inputEl = this.querySelector('#input-main-color');
      const themeEl = this.querySelector('#select-theme');
      
      const currentVal = inputEl ? inputEl.value : '#dc3545';
      const currentTheme = themeEl ? themeEl.value : 'dark';
      
      this.render();
      
      const newInputEl = this.querySelector('#input-main-color');
      const newThemeEl = this.querySelector('#select-theme');
      
      if (newInputEl) newInputEl.value = currentVal;
      if (newThemeEl) newThemeEl.value = currentTheme;
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
      <slotrace-settings-header title="${window.t('settings.menu.preferences')}" icon="mdi-tune"></slotrace-settings-header>
      
      <form id="form-preferences" class="needs-validation fade-in" novalidate>
        <!-- Theme Select -->
        <div class="mb-4">
          <label for="select-theme" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
            <span>${window.t('settings.preferences.theme_label')}</span>
            <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.theme_help')}"></i>
          </label>
          <select class="form-select p-2.5" id="select-theme" required>
            <option value="dark">${window.t('settings.preferences.theme_bootstrap_dark') || 'Bootstrap Dark'}</option>
            <option value="light">${window.t('settings.preferences.theme_bootstrap_light') || 'Bootstrap Light'}</option>
          </select>
        </div>

        <!-- Main Color Select -->
        <div class="mb-4">
          <label for="input-main-color" class="form-label fw-semibold text-secondary small d-flex align-items-center gap-1.5">
            <span>${window.t('settings.preferences.color_label')}</span>
            <i class="mdi mdi-information-outline text-secondary opacity-75 fs-6 ms-1" style="cursor: help;" data-bs-toggle="tooltip" data-bs-placement="top" title="${window.t('settings.preferences.color_help')}"></i>
          </label>
          <div class="d-flex align-items-center gap-3">
            <input type="color" class="form-control form-control-color p-1" id="input-main-color" value="#dc3545" title="${window.t('settings.preferences.color_help')}" style="width: 60px; height: 45px; cursor: pointer;">
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

    // Initialize Bootstrap Tooltips
    const tooltipTriggerList = this.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap && window.bootstrap.Tooltip) {
      this._tooltips = Array.from(tooltipTriggerList).map(el => new window.bootstrap.Tooltip(el));
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const colorValue = input ? input.value : '#dc3545';
        const themeValue = themeSelect ? themeSelect.value : 'dark';
        
        // Load current settings, update color and theme, then save
        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.main_color = colorValue;
          updatedSettings.theme = themeValue;
          
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

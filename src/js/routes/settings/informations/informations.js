class SlotRaceSettingsInformations extends HTMLElement {
  connectedCallback() {
    this.render();
    
    // Initialize input value asynchronously from the Node.js database on first load
    const input = this.querySelector("#input-local-name");
    if (input) {
      window.electronAPI.db.get('settings').then(settings => {
        if (settings && settings.local_name) {
          input.value = settings.local_name;
        }
      }).catch(err => {
        console.error('Failed to load settings from database:', err);
      });
    }

    this._langListener = () => {
      const inputEl = this.querySelector("#input-local-name");
      const currentVal = inputEl ? inputEl.value : '';
      
      this.render();
      
      const newInputEl = this.querySelector("#input-local-name");
      if (newInputEl) {
        newInputEl.value = currentVal;
      }
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
      <slotrace-settings-header title="${window.t('settings.menu.informations')}" icon="mdi-information-outline"></slotrace-settings-header>
      
      <form id="form-local-name" class="needs-validation fade-in" novalidate>
        <div class="mb-4">
          <label for="input-local-name" class="form-label fw-semibold text-secondary small">${window.t('settings.informations.local_name_label')}</label>
          <input type="text" class="form-control p-2.5" id="input-local-name" placeholder="${window.t('settings.informations.local_name_placeholder')}" required>
          <div class="invalid-feedback">${window.t('settings.informations.validation_error')}</div>
        </div>
        
        <button type="submit" id="btn-save-location" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-content-save-outline fs-5"></i>
          ${window.t('settings.informations.save_button')}
        </button>
      </form>

      <!-- App Metadata / Version Details -->
      <div class="mt-5 pt-3 border-top border-secondary-subtle fade-in">
        <div class="d-flex align-items-center gap-2 text-secondary mb-1" style="font-size: 0.8rem;">
          <i class="mdi mdi-developer-board"></i>
          <span>SlotRace Control Panel</span>
        </div>
        <div class="text-body-secondary small" style="font-size: 0.75rem;">
          <div>Versão / Version: <strong class="text-body-emphasis">v${window.electronAPI.appVersion || '0.0.1'}</strong></div>
          <div>Ambiente / Environment: <strong class="text-body-emphasis">Offline Desktop (Electron)</strong></div>
        </div>
      </div>
    `;

    // Re-bind form submission and validation
    const form = this.querySelector("#form-local-name");
    const input = this.querySelector("#input-local-name");
    
    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        const value = input.value.trim();
        
        // Save asynchronously by merging with existing settings in local database
        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.local_name = value;
          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            // Dispatch custom event to notify navbar reatively
            window.dispatchEvent(new CustomEvent('localNameChanged', { detail: value }));

            // Premium visual feedback directly on the save button
            const btn = this.querySelector("#btn-save-location");
            if (btn) {
              const originalHtml = btn.innerHTML;
              btn.innerHTML = `<i class="mdi mdi-check-circle-outline fs-5"></i> ${window.t('settings.feedback.saved')}`;
              btn.classList.remove("btn-primary");
              btn.classList.add("btn-success");
              btn.disabled = true;

              setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove("btn-success");
                btn.classList.add("btn-primary");
                btn.disabled = false;
              }, 2000);
            }
          } else {
            console.error('Failed to write settings to database.');
          }
        }).catch(err => {
          console.error('Database write error:', err);
        });
      });
    }
  }
}

// Define the custom element <slotrace-settings-informations>
customElements.define("slotrace-settings-informations", SlotRaceSettingsInformations);

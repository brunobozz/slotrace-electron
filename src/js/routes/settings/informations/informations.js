class SlotRaceSettingsInformations extends HTMLElement {
  connectedCallback() {
    this._localLogo = ""; // Store Base64 string for the logo
    this.render();
    this.setupEvents();
    
    // Initialize input values asynchronously from the Node.js database on first load
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        const nameInput = this.querySelector("#input-local-name");
        if (nameInput) {
          nameInput.value = settings.local_name || "";
        }
        if (settings.local_logo) {
          this._localLogo = settings.local_logo;
          this._updateLogoPreview();
        }
      }
    }).catch(err => {
      console.error('Failed to load settings from database:', err);
    });

    this._langListener = () => {
      const nameInput = this.querySelector("#input-local-name");
      const currentNameVal = nameInput ? nameInput.value : '';
      
      this.render();
      this.setupEvents();
      this._updateLogoPreview();
      
      const newNameInput = this.querySelector("#input-local-name");
      if (newNameInput) {
        newNameInput.value = currentNameVal;
      }
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  _updateLogoPreview() {
    const previewContainer = this.querySelector("#logo-preview-container");
    if (!previewContainer) return;

    if (this._localLogo) {
      previewContainer.innerHTML = `
        <div class="position-relative d-inline-block border border-secondary-subtle rounded p-2 bg-dark-subtle mb-3">
          <img src="${this._localLogo}" style="max-height: 100px; max-width: 200px; object-fit: contain;" alt="Preview Logo">
          <button type="button" id="btn-remove-logo" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 20px; height: 20px; min-width: 20px; min-height: 20px;" title="Remover Logo">
            <i class="mdi mdi-close" style="font-size: 12px; line-height: 1;"></i>
          </button>
        </div>
      `;

      // Bind remove logo action
      const btnRemove = this.querySelector("#btn-remove-logo");
      if (btnRemove) {
        btnRemove.addEventListener("click", () => {
          this._localLogo = "";
          this._updateLogoPreview();
          const fileInput = this.querySelector("#input-local-logo");
          if (fileInput) {
            fileInput.value = "";
          }
        });
      }
    } else {
      previewContainer.innerHTML = `
        <div class="text-secondary small mb-3 border border-secondary-subtle rounded p-3 text-center bg-dark-subtle" style="border-style: dashed !important; max-width: 200px;">
          Nenhum logo customizado
        </div>
      `;
    }
  }

  render() {
    this.innerHTML = `
      <slotrace-settings-header title="${window.t('settings.menu.informations')}" icon="mdi-information-outline"></slotrace-settings-header>
      
      <form id="form-local-name" class="needs-validation fade-in" novalidate>
        <!-- Club Logo Field -->
        <div class="mb-4">
          <label for="input-local-logo" class="form-label fw-semibold text-secondary small">Logo do Local (PNG transparente)</label>
          <div id="logo-preview-container"></div>
          <input type="file" id="input-local-logo" class="form-control p-2.5" accept="image/png">
        </div>

        <!-- Local Name Field -->
        <div class="mb-4">
          <label for="input-local-name" class="form-label fw-semibold text-secondary small">${window.t('settings.informations.local_name_label')}</label>
          <input type="text" class="form-control p-2.5" id="input-local-name" placeholder="${window.t('settings.informations.local_name_placeholder')}">
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
    this._updateLogoPreview();
  }

  setupEvents() {
    const form = this.querySelector("#form-local-name");
    const nameInput = this.querySelector("#input-local-name");
    const fileInput = this.querySelector("#input-local-logo");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.type !== "image/png") {
            alert("Por favor, selecione apenas imagens no formato PNG com fundo transparente.");
            fileInput.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this._localLogo = event.target.result;
            this._updateLogoPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (form && nameInput) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        const nameValue = nameInput.value.trim();
        
        // Save asynchronously by merging with existing settings in local database
        window.electronAPI.db.get('settings').then(settings => {
          const updatedSettings = settings || {};
          updatedSettings.local_name = nameValue;
          updatedSettings.local_logo = this._localLogo; // Save Base64 logo
          return window.electronAPI.db.set('settings', updatedSettings);
        }).then(success => {
          if (success) {
            // Dispatch custom events to notify sidebar/navbar reactively
            window.dispatchEvent(new CustomEvent('localNameChanged', { detail: nameValue }));
            window.dispatchEvent(new CustomEvent('localLogoChanged', { detail: this._localLogo }));

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

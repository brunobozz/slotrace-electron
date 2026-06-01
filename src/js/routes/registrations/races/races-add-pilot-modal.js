class SlotRaceRegistrationsRacesAddPilotModal extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.racePilots = [];

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._openAddPilotListener = (e) => {
      const { race, drivers } = e.detail;
      this.race = race;
      this.drivers = drivers || [];
      this.racePilots = race ? (race.pilots || []) : [];

      this.populateAvailablePilotsList();

      const modalEl = this.querySelector('#modal-race-add-pilot');
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };

    this._pilotsUpdatedListener = (e) => {
      const { pilots } = e.detail;
      this.racePilots = pilots || [];
      this.populateAvailablePilotsList();
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestOpenAddPilot', this._openAddPilotListener);
    window.addEventListener('racePilotsUpdated', this._pilotsUpdatedListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._openAddPilotListener) {
      window.removeEventListener('requestOpenAddPilot', this._openAddPilotListener);
    }
    if (this._pilotsUpdatedListener) {
      window.removeEventListener('racePilotsUpdated', this._pilotsUpdatedListener);
    }
  }

  populateAvailablePilotsList() {
    const listContainer = this.querySelector('#race-add-pilot-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // Filter drivers that are not already in the race
    const availableDrivers = this.drivers.filter(driver => {
      return !this.racePilots.some(p => {
        const id = typeof p === 'object' ? p.id : p;
        return id === driver.id;
      });
    });

    if (availableDrivers.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center text-secondary small py-4">
          <i class="mdi mdi-account-multiple fs-4 d-block mb-1"></i>
          Todos os pilotos cadastrados já foram adicionados
        </div>
      `;
      return;
    }

    availableDrivers.forEach(driver => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'list-group-item list-group-item-action d-flex align-items-center gap-2.5 py-2 px-2.5 border-0 rounded text-start mb-1';
      btn.innerHTML = `
        <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 shadow-sm" style="width: 32px; height: 32px; border: 1px solid var(--bs-border-color);">
          ${driver.photo ? `
            <img src="${driver.photo}" class="w-100 h-100 object-fit-cover">
          ` : `
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
              <i class="mdi mdi-account text-secondary fs-5"></i>
            </div>
          `}
        </div>
        <div class="text-truncate">
          <div class="fw-bold text-body-emphasis small text-truncate" style="font-size: 0.85rem;">${driver.nickname || driver.name}</div>
        </div>
      `;

      btn.addEventListener('click', () => {
        // Dispatch selected driver ID
        window.dispatchEvent(new CustomEvent('racePilotSelected', {
          detail: { driverId: driver.id }
        }));
      });

      listContainer.appendChild(btn);
    });
  }

  setupEvents() {
    // Events setup if needed
  }

  render() {
    this.innerHTML = `
      <!-- Mini Modal to Add Pilots -->
      <div class="modal fade" id="modal-race-add-pilot" tabindex="-1" aria-labelledby="modal-race-add-pilot-title" aria-hidden="true" style="background: rgba(0,0,0,0.45);">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-secondary-subtle shadow-lg">
            <div class="modal-header border-secondary-subtle bg-body-tertiary py-2 px-3">
              <h6 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-1.5" id="modal-race-add-pilot-title" style="font-size: 0.9rem;">
                <i class="mdi mdi-account-plus text-primary"></i>
                Adicionar Piloto
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="font-size: 0.7rem;"></button>
            </div>
            <div class="modal-body p-2" style="max-height: 280px; overflow-y: auto;">
              <div id="race-add-pilot-list" class="list-group list-group-flush rounded border-0">
                <!-- Available pilots rendered dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-races-add-pilot-modal', SlotRaceRegistrationsRacesAddPilotModal);

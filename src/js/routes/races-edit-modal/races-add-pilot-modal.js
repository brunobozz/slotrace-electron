class SlotRaceRegistrationsRacesAddPilotModal extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.racePilots = [];
    this.cars = [];
    this.selectedDriverId = null;
    this.selectedCarId = null;

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
      this.populateLists();
    };

    this._openAddPilotListener = (e) => {
      const { race, drivers } = e.detail;
      this.race = race;
      this.drivers = drivers || [];
      this.racePilots = race ? race.pilots || [] : [];
      this.selectedDriverId = null;
      this.selectedCarId = null;

      // Load cars list dynamically from database
      window.electronAPI.db
        .get("cars")
        .then((cars) => {
          this.cars = cars || [];
          this.populateLists();

          const modalEl = this.querySelector("#modal-race-add-pilot");
          if (modalEl) {
            let modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (!modalInstance) {
              modalInstance = new bootstrap.Modal(modalEl);
            }
            modalInstance.show();
          }
        })
        .catch((err) => {
          console.error("Failed to load cars list in add-pilot modal:", err);
        });
    };

    this._pilotsUpdatedListener = (e) => {
      const { pilots } = e.detail;
      this.racePilots = pilots || [];
      this.populateLists();
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("requestOpenAddPilot", this._openAddPilotListener);
    window.addEventListener("racePilotsUpdated", this._pilotsUpdatedListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._openAddPilotListener) {
      window.removeEventListener(
        "requestOpenAddPilot",
        this._openAddPilotListener,
      );
    }
    if (this._pilotsUpdatedListener) {
      window.removeEventListener(
        "racePilotsUpdated",
        this._pilotsUpdatedListener,
      );
    }
  }

  populateLists() {
    this.populateAvailablePilotsList();
    this.populateAvailableCarsList();
    this.updateConfirmButtonState();
  }

  populateAvailablePilotsList() {
    const listContainer = this.querySelector("#race-add-pilot-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    // Filter drivers that are not already in the race
    const availableDrivers = this.drivers.filter((driver) => {
      return !this.racePilots.some((p) => {
        const id = typeof p === "object" ? p.id : p;
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

    availableDrivers.forEach((driver) => {
      const btn = document.createElement("button");
      btn.type = "button";

      const isSelected = this.selectedDriverId === driver.id;
      btn.className = `list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-2.5 border rounded text-start mb-1 transition-all ${
        isSelected
          ? "bg-primary bg-opacity-10 border-primary text-primary fw-bold shadow-sm"
          : "border-transparent text-body"
      }`;

      btn.innerHTML = `
        <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 shadow-sm" style="width: 32px; height: 32px; border: 2px solid ${isSelected ? "var(--bs-primary)" : "var(--bs-border-color)"};">
          ${
            driver.photo
              ? `
            <img src="${driver.photo}" class="w-100 h-100 object-fit-cover">
          `
              : `
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
              <i class="mdi mdi-account text-secondary fs-5"></i>
            </div>
          `
          }
        </div>
        <div class="text-truncate">
          <div class="small text-truncate" style="font-size: 0.85rem;">${driver.nickname || driver.name}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        if (this.selectedDriverId === driver.id) {
          this.selectedDriverId = null;
        } else {
          this.selectedDriverId = driver.id;
        }
        this.populateAvailablePilotsList();
        this.updateConfirmButtonState();
      });

      listContainer.appendChild(btn);
    });
  }

  populateAvailableCarsList() {
    const listContainer = this.querySelector("#race-add-car-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (!this.cars || this.cars.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center text-secondary small py-4">
          <i class="mdi mdi-car-multiple fs-4 d-block mb-1"></i>
          Nenhum carro cadastrado ainda.
        </div>
      `;
      return;
    }

    this.cars.forEach((car) => {
      const btn = document.createElement("button");
      btn.type = "button";

      const isSelected = this.selectedCarId === car.id;
      btn.className = `list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-2.5 border rounded text-start mb-1 transition-all ${
        isSelected
          ? "bg-primary bg-opacity-10 border-primary text-primary fw-bold shadow-sm"
          : "border-transparent text-body"
      }`;

      btn.innerHTML = `
        <div class="rounded overflow-hidden bg-body-secondary flex-shrink-0 shadow-sm" style="width: 42px; height: 28px; border: 1px solid ${isSelected ? "var(--bs-primary)" : "var(--bs-border-color)"};">
          ${
            car.photo
              ? `
            <img src="${car.photo}" class="w-100 h-100 object-fit-cover">
          `
              : `
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
              <i class="mdi mdi-car text-secondary fs-6"></i>
            </div>
          `
          }
        </div>
        <div class="text-truncate">
          <div class="small text-truncate" style="font-size: 0.85rem;">${car.name}</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        if (this.selectedCarId === car.id) {
          this.selectedCarId = null;
        } else {
          this.selectedCarId = car.id;
        }
        this.populateAvailableCarsList();
        this.updateConfirmButtonState();
      });

      listContainer.appendChild(btn);
    });
  }

  updateConfirmButtonState() {
    const btn = this.querySelector("#btn-confirm-add-pilot");
    if (btn) {
      btn.disabled = !this.selectedDriverId;
    }
  }

  setupEvents() {
    const confirmBtn = this.querySelector("#btn-confirm-add-pilot");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (!this.selectedDriverId) return;

        window.dispatchEvent(
          new CustomEvent("racePilotSelected", {
            detail: {
              driverId: this.selectedDriverId,
              carId: this.selectedCarId,
            },
          }),
        );

        const modalEl = this.querySelector("#modal-race-add-pilot");
        if (modalEl) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) {
            modalInstance.hide();
          }
        }
      });
    }
  }

  render() {
    this.innerHTML = `
      <!-- Modal to Add Pilots with Cars -->
      <div class="modal fade" id="modal-race-add-pilot" tabindex="-1" aria-labelledby="modal-race-add-pilot-title" aria-hidden="true" style="background: rgba(0,0,0,0.45);">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-secondary-subtle shadow-lg">
            <div class="modal-header border-secondary-subtle bg-body-tertiary py-2 px-3">
              <h6 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-1" id="modal-race-add-pilot-title" style="font-size: 0.95rem;">
                <i class="mdi mdi-account-plus text-primary fs-5"></i>
                Adicionar Piloto
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="font-size: 0.7rem;"></button>
            </div>
            <div class="modal-body p-3">
              <div class="row g-3">
                <!-- Left Column: Pilots -->
                <div class="col-6 border-end border-secondary-subtle pe-3">
                  <div class="fw-semibold text-secondary small mb-2.5 d-flex align-items-center gap-1">
                    <i class="mdi mdi-account text-primary"></i>
                    Selecione o Piloto
                  </div>
                  <div id="race-add-pilot-list" class="list-group list-group-flush rounded overflow-y-auto" style="max-height: 280px; padding-right: 4px;">
                    <!-- Available pilots rendered dynamically -->
                  </div>
                </div>
                
                <!-- Right Column: Cars -->
                <div class="col-6 ps-3">
                  <div class="fw-semibold text-secondary small mb-2.5 d-flex align-items-center gap-1">
                    <i class="mdi mdi-car text-primary"></i>
                    Selecione o Carro (Opcional)
                  </div>
                  <div id="race-add-car-list" class="list-group list-group-flush rounded overflow-y-auto" style="max-height: 280px; padding-right: 4px;">
                    <!-- Available cars rendered dynamically -->
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-secondary-subtle py-2 px-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" id="btn-confirm-add-pilot" class="btn btn-sm btn-primary fw-semibold px-3 d-flex align-items-center gap-1" disabled>
                <i class="mdi mdi-check"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-registrations-races-add-pilot-modal",
  SlotRaceRegistrationsRacesAddPilotModal,
);

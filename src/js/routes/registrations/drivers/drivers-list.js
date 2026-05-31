class SlotRaceRegistrationsDriversList extends HTMLElement {
  connectedCallback() {
    this.drivers = [];

    // Load drivers on connect
    this.loadDrivers();

    this._langListener = () => this.render();
    this._addedListener = () => this.loadDrivers();

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("driverAdded", this._addedListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._addedListener) {
      window.removeEventListener("driverAdded", this._addedListener);
    }
  }

  loadDrivers() {
    window.electronAPI.db
      .get("drivers")
      .then((drivers) => {
        this.drivers = drivers || [];
        this.render();
      })
      .catch((err) => {
        console.error("Failed to load drivers for list:", err);
      });
  }

  render() {
    if (this.drivers.length === 0) {
      this.innerHTML = `
        <div class="alert alert-dark bg-body-secondary border-secondary-subtle py-4 text-center fade-in">
          <i class="mdi mdi-account-multiple-outline text-secondary fs-2 mb-3 d-block"></i>
          <h6 class="fw-bold text-body-emphasis mb-0">${window.t("registrations.no_drivers_listed")}</h6>
        </div>
      `;
      return;
    }

    let cardsHtml = "";
    this.drivers.forEach((driver) => {
      const name = driver.name || "";
      const nickname = driver.nickname || "";
      const photoUrl = driver.photo || "";

      const gpsCount = driver.gps !== undefined ? driver.gps : 0;
      const lapsCount = driver.laps !== undefined ? driver.laps : 0;
      const bestLapsCount =
        driver.best_laps !== undefined ? driver.best_laps : 0;

      cardsHtml += `
        <div class="col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in">
          <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              
              <!-- Top Section: Avatar + Driver Info -->
              <div class="d-flex align-items-center gap-3 mb-2">
                <!-- Avatar Container -->
                <div class="rounded-circle border border-secondary-subtle shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-body-secondary flex-shrink-0" style="width: 80px; height: 80px; border-width: 2px !important;">
                  ${
                    photoUrl
                      ? `
                    <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
                  `
                      : `
                    <i class="mdi mdi-account text-secondary" style="font-size: 48px; line-height: 1;"></i>
                  `
                  }
                </div>
                
                <!-- Info Section -->
                <div class="text-start overflow-hidden">
                  <div class="text-secondary fw-semibold small text-uppercase tracking-wider" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                    ${window.t("registrations.modal.driver_caps_label") || "PILOTO"}
                  </div>
                  <h4 class="fw-bold text-body-emphasis mb-1 text-truncate" title="${name}" style="font-size: 1.25rem;">${name}</h4>
                  ${
                    nickname
                      ? `
                    <div class="small text-truncate fw-semibold" style="color: var(--bs-primary);" title="${nickname}">
                      ${window.t("registrations.modal.nickname_label") || "Apelido"}: ${nickname}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
              
              <!-- Divider Line -->
              <hr class="my-2 border-secondary-subtle opacity-25">
              
              <!-- Bottom Section: Stats + Action Icons -->
              <div class="d-flex align-items-center justify-content-between mt-1">
                <!-- Stats Left -->
                <div class="d-flex align-items-center gap-3 text-secondary" style="font-size: 0.75rem;">
                  <div class="d-flex align-items-center gap-1" title="GPs">
                    <i class="mdi mdi-flag-checkered text-secondary" style="font-size: 0.85rem;"></i>
                    <span>GPs: <strong class="text-body-emphasis" style="font-size: 0.75rem;">${gpsCount}</strong></span>
                  </div>
                  <div class="d-flex align-items-center gap-1" title="${window.t("registrations.modal.laps_label") || "Voltas"}">
                    <i class="mdi mdi-reload text-secondary" style="font-size: 0.85rem;"></i>
                    <span>${window.t("registrations.modal.laps_label") || "Voltas"}: <strong class="text-body-emphasis" style="font-size: 0.75rem;">${lapsCount}</strong></span>
                  </div>
                  <div class="d-flex align-items-center gap-1" title="${window.t("registrations.modal.best_laps_label") || "Melhores Voltas"}">
                    <i class="mdi mdi-flash text-secondary" style="font-size: 0.85rem;"></i>
                    <span>${window.t("registrations.modal.best_laps_abbr") || "M. Voltas"}: <strong class="text-body-emphasis" style="font-size: 0.75rem;">${bestLapsCount}</strong></span>
                  </div>
                </div>
                
                <!-- Actions Right -->
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-5 hover-scale-btn btn-edit-driver" style="cursor: pointer; color: var(--bs-primary);" data-id="${driver.id}" title="${window.t("registrations.modal.edit_button") || "Editar"}">
                    <i class="mdi mdi-pencil-outline"></i>
                  </span>
                  <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-driver" style="cursor: pointer;" data-id="${driver.id}" data-name="${name}" title="${window.t("registrations.modal.delete_button") || "Excluir"}">
                    <i class="mdi mdi-trash-can-outline"></i>
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      `;
    });

    this.innerHTML = `
      <div class="row">
        ${cardsHtml}
      </div>
    `;

    // Bind delete confirmation modal request events
    this.querySelectorAll(".btn-delete-driver").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        window.dispatchEvent(
          new CustomEvent("requestDeleteDriver", {
            detail: { id, name },
          }),
        );
      });
    });

    // Bind edit request events
    this.querySelectorAll(".btn-edit-driver").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const driver = this.drivers.find((d) => d.id === id);
        if (driver) {
          window.dispatchEvent(
            new CustomEvent("requestEditDriver", {
              detail: { driver },
            }),
          );
        }
      });
    });
  }
}

// Define the custom element <slotrace-registrations-drivers-list>
customElements.define(
  "slotrace-registrations-drivers-list",
  SlotRaceRegistrationsDriversList,
);

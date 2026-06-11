class SlotRaceRegistrationsRacesEditModal extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.tracks = [];
    this.drivers = [];
    this.expandedPilotIds = new Set();
    this.initialRaceSnapshot = null;

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
      if (this.initialRaceSnapshot) {
        this.checkPendingChanges();
      }
    };

    this._editRequestListener = (e) => {
      const { race } = e.detail;
      // Deep clone the race object to avoid mutating the list's in-memory model unless saved
      this.race = JSON.parse(JSON.stringify(race));
      if (!this.race.pilots) this.race.pilots = [];
      if (!this.race.quali) this.race.quali = [];
      if (!this.race.raceSession) this.race.raceSession = [];

      // Load tracks, drivers, and cars from the DB first, then populate the dropdowns
      Promise.all([
        window.electronAPI.db.get("tracks"),
        window.electronAPI.db.get("drivers"),
        window.electronAPI.db.get("cars"),
      ])
        .then(([tracks, drivers, cars]) => {
          this.tracks = tracks || [];
          this.drivers = drivers || [];
          this.cars = cars || [];

          this.populateDropdowns();

          // Populate type field
          const typeSelect = this.querySelector("#select-race-edit-type");
          if (typeSelect) {
            typeSelect.value = this.race.type || "grand_prix";
          }

          // Populate name field
          const nameInput = this.querySelector("#input-race-edit-name");
          if (nameInput) {
            nameInput.value = this.race.name || "";
          }

          // Populate date field
          const dateInput = this.querySelector("#input-race-edit-date");
          if (dateInput) {
            const d = this.race.date ? new Date(this.race.date) : new Date();
            const pad = (num) => String(num).padStart(2, "0");
            const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            dateInput.value = dateVal;
          }

          // Initialize the initial snapshot after all modal fields have been populated
          this.initialRaceSnapshot = this.getCurrentStateSnapshot();
          this.checkPendingChanges();

          // Show the Bootstrap modal
          const modalEl = this.querySelector("#modal-edit-race");
          if (modalEl) {
            let modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (!modalInstance) {
              modalInstance = new bootstrap.Modal(modalEl);
            }
            modalInstance.show();
          }
        })
        .catch((err) => {
          console.error("Failed to load data for edit modal:", err);
        });
    };

    this._pilotSelectedListener = (e) => {
      const { driverId, carId } = e.detail;
      if (!this.race) return;
      if (!this.race.pilots) this.race.pilots = [];

      this.race.pilots.push({ id: driverId, carId: carId || null });

      this.populatePilots();

      // Notify the separate add-pilot modal of the update
      window.dispatchEvent(
        new CustomEvent("racePilotsUpdated", {
          detail: { pilots: this.race.pilots },
        }),
      );

      this.checkPendingChanges();
    };

    this._qualiUpdatedListener = (e) => {
      if (!this.race) return;
      if (e && e.detail && e.detail.race) {
        this.race.quali = JSON.parse(JSON.stringify(e.detail.race.quali || []));
        this.populatePilots();
        if (this.initialRaceSnapshot) {
          try {
            const snapshotObj = JSON.parse(this.initialRaceSnapshot);
            snapshotObj.quali = this.race.quali;
            this.initialRaceSnapshot = JSON.stringify(snapshotObj);
          } catch (err) {
            console.error("Error updating initial race snapshot:", err);
          }
        }
      }
      this.checkPendingChanges();
    };

    this._listChangedListener = async () => {
      if (!this.race) return;
      const modalEl = this.querySelector("#modal-edit-race");
      if (modalEl && modalEl.classList.contains("show")) {
        try {
          const races = (await window.electronAPI.db.get("races")) || [];
          const updatedRace = races.find((r) => String(r.id) === String(this.race.id));
          if (updatedRace) {
            this.race.raceSession = updatedRace.raceSession || [];
            this.race.quali = updatedRace.quali || [];
            this.race.pilots = updatedRace.pilots || [];

            this.populatePilots();

            this.initialRaceSnapshot = this.getCurrentStateSnapshot();
            this.checkPendingChanges();
          }
        } catch (err) {
          console.error("Failed to reload race data on raceListChanged:", err);
        }
      }
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("requestEditRaceName", this._editRequestListener);
    window.addEventListener("racePilotSelected", this._pilotSelectedListener);
    window.addEventListener("raceQualiUpdated", this._qualiUpdatedListener);
    window.addEventListener("raceListChanged", this._listChangedListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._editRequestListener) {
      window.removeEventListener(
        "requestEditRaceName",
        this._editRequestListener,
      );
    }
    if (this._pilotSelectedListener) {
      window.removeEventListener(
        "racePilotSelected",
        this._pilotSelectedListener,
      );
    }
    if (this._qualiUpdatedListener) {
      window.removeEventListener(
        "raceQualiUpdated",
        this._qualiUpdatedListener,
      );
    }
    if (this._listChangedListener) {
      window.removeEventListener("raceListChanged", this._listChangedListener);
    }
  }

  populateDropdowns() {
    const trackSelect = this.querySelector("#select-race-edit-track");

    if (trackSelect) {
      trackSelect.innerHTML = "";

      // Default option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent =
        window.t("registrations.default_track") || "Pista Padrão";
      trackSelect.appendChild(defaultOption);

      this.tracks.forEach((track) => {
        const option = document.createElement("option");
        option.value = track.id;
        option.textContent = track.name;
        trackSelect.appendChild(option);
      });

      // Select active track
      if (this.race && this.race.trackId) {
        trackSelect.value = this.race.trackId;
      } else {
        trackSelect.value = "";
      }
    }

    // Populate pilots avatars list
    this.populatePilots();
  }

  populatePilots() {
    const pilotsContainer = this.querySelector("#race-edit-pilots-list");
    if (!pilotsContainer) return;

    pilotsContainer.innerHTML = "";
    const racePilots = this.race && this.race.pilots ? this.race.pilots : [];

    // Render all current pilots in the race as horizontal capsule pills
    racePilots.forEach((pilot) => {
      const pilotId = typeof pilot === "object" ? pilot.id : pilot;
      const carId = typeof pilot === "object" ? pilot.carId : null;

      const driverObj = this.drivers.find((d) => d.id === pilotId);
      const carObj =
        carId && this.cars ? this.cars.find((c) => c.id === carId) : null;

      const name = driverObj
        ? driverObj.nickname || driverObj.name
        : pilot.nickname || pilot.name || pilot;
      const photoUrl = driverObj ? driverObj.photo : pilot.photo || "";
      const carName = carObj ? carObj.name : "";

      // Create pill capsule using shared SlotRaceDriverPill component
      const pill = document.createElement("slotrace-driver-pill");
      pill.setParams({
        pilotId: pilotId,
        name: name,
        photoUrl: photoUrl,
        carName: carName,
        onRemove: () => {
          const confirmModalEl = this.querySelector(
            "#modal-confirm-remove-pilot",
          );
          if (confirmModalEl) {
            const nameEl = confirmModalEl.querySelector(
              "#remove-pilot-confirm-name",
            );
            if (nameEl) {
              nameEl.textContent = name;
            }

            let confirmModalInstance =
              bootstrap.Modal.getInstance(confirmModalEl);
            if (!confirmModalInstance) {
              confirmModalInstance = new bootstrap.Modal(confirmModalEl);
            }
            confirmModalInstance.show();

            const actionBtn = confirmModalEl.querySelector(
              "#btn-confirm-remove-pilot-action",
            );
            if (actionBtn) {
              const newActionBtn = actionBtn.cloneNode(true);
              actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

              newActionBtn.addEventListener("click", () => {
                // Remove from race pilots list
                this.race.pilots = this.race.pilots.filter((p) => {
                  const id = typeof p === "object" ? p.id : p;
                  return id !== pilotId;
                });

                // Re-render circular list and qualifying table
                this.populatePilots();

                // Notify the separate add-pilot modal of the update
                window.dispatchEvent(
                  new CustomEvent("racePilotsUpdated", {
                    detail: { pilots: this.race.pilots },
                  }),
                );

                this.checkPendingChanges();

                confirmModalInstance.hide();
              });
            }
          }
        },
      });

      pilotsContainer.appendChild(pill);
    });

    // Add the circular "+" button to add more pilots at the end
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.id = "btn-race-edit-add-pilot";
    addButton.className =
      "rounded-circle border border-secondary-subtle d-flex align-items-center justify-content-center bg-body-secondary shadow-sm text-primary mb-1";
    addButton.style.width = "48px";
    addButton.style.height = "48px";
    addButton.style.borderWidth = "2px";
    addButton.style.borderStyle = "dashed";
    addButton.style.fontSize = "1.3rem";
    addButton.title =
      window.t("registrations.new_driver") || "Adicionar Piloto";
    addButton.innerHTML = `<i class="mdi mdi-plus"></i>`;

    addButton.addEventListener("click", () => {
      // Dispatches event to launch the separate mini modal component
      window.dispatchEvent(
        new CustomEvent("requestOpenAddPilot", {
          detail: { race: this.race, drivers: this.drivers },
        }),
      );
    });

    pilotsContainer.appendChild(addButton);

    // Call qualifying table population
    const qualiTableComponent = this.querySelector(
      "#race-edit-quali-table-component",
    );
    if (qualiTableComponent) {
      if (racePilots.length === 0) {
        qualiTableComponent.classList.add("d-none");
      } else {
        qualiTableComponent.classList.remove("d-none");
        qualiTableComponent.setParams(this.race, this.drivers, this.cars);
      }
    }

    // Call race table population
    const raceTableComponent = this.querySelector(
      "#race-edit-race-table-component",
    );
    if (raceTableComponent) {
      if (racePilots.length === 0) {
        raceTableComponent.classList.add("d-none");
      } else {
        raceTableComponent.classList.remove("d-none");
        raceTableComponent.setParams(this.race, this.drivers, this.cars);
      }
    }
  }

  setupEvents() {
    const form = this.querySelector("#form-edit-race");
    const modalEl = this.querySelector("#modal-edit-race");
    const trackSelect = this.querySelector("#select-race-edit-track");

    if (form && modalEl) {
      // Prevent form submission on Enter keypress
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      });

      // Bind input/change listeners to detect changes to inputs
      form.addEventListener("input", () => this.checkPendingChanges());
      form.addEventListener("change", () => this.checkPendingChanges());

      // Close button on header
      const closeBtn = this.querySelector("#btn-close-edit-race");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.handleCloseAttempt();
        });
      }

      // Cancel button on footer
      const cancelBtn = this.querySelector("#btn-cancel-edit-race");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.handleCloseAttempt();
        });
      }

      // Discard changes confirmation button
      const discardBtn = this.querySelector("#btn-confirm-discard-changes");
      if (discardBtn) {
        discardBtn.addEventListener("click", () => {
          const confirmCloseModalEl = this.querySelector(
            "#modal-confirm-close-edit",
          );
          if (confirmCloseModalEl) {
            const confirmCloseInstance =
              bootstrap.Modal.getInstance(confirmCloseModalEl);
            if (confirmCloseInstance) {
              confirmCloseInstance.hide();
            }
          }
          this.closeEditModal();
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.race) return;

        const typeSelect = this.querySelector("#select-race-edit-type");
        const selectedType = typeSelect ? typeSelect.value : "grand_prix";

        const nameInput = this.querySelector("#input-race-edit-name");
        const trackSelectElement = this.querySelector(
          "#select-race-edit-track",
        );
        const selectedTrackId = trackSelectElement
          ? trackSelectElement.value
          : "";
        const dateInput = this.querySelector("#input-race-edit-date");

        const newName = nameInput ? nameInput.value.trim() : "";

        let selectedDateISO = this.race.date || new Date().toISOString();
        if (dateInput && dateInput.value) {
          const origDate = this.race.date
            ? new Date(this.race.date)
            : new Date();
          const [year, month, day] = dateInput.value.split("-").map(Number);
          origDate.setFullYear(year);
          origDate.setMonth(month - 1);
          origDate.setDate(day);
          selectedDateISO = origDate.toISOString();
        }

        // Find selected track name
        let selectedTrackName =
          window.t("registrations.default_track") || "Pista Padrão";
        if (selectedTrackId) {
          const trackObj = this.tracks.find((t) => t.id === selectedTrackId);
          if (trackObj) {
            selectedTrackName = trackObj.name;
          }
        }

        window.electronAPI.db
          .get("races")
          .then((races) => {
            const racesList = races || [];
            const updatedList = racesList.map((r) => {
              if (r.id === this.race.id) {
                return {
                  ...r,
                  name: newName || r.name,
                  type: selectedType,
                  trackId: selectedTrackId,
                  trackName: selectedTrackName,
                  date: selectedDateISO,
                  pilots: this.race.pilots || [],
                  quali: this.race.quali || [],
                  raceSession: this.race.raceSession || [],
                };
              }
              return r;
            });
            return window.electronAPI.db.set("races", updatedList);
          })
          .then((success) => {
            if (success) {
              window.recalculateDriversRacesCount();
              const modalInstance = bootstrap.Modal.getInstance(modalEl);
              if (modalInstance) {
                modalInstance.hide();
              }
              window.dispatchEvent(new CustomEvent("raceListChanged"));
            }
          })
          .catch((err) => {
            console.error("Failed to update race details in database:", err);
          });
      });
    }
  }

  getCurrentStateSnapshot() {
    if (!this.race) return "";

    const typeSelect = this.querySelector("#select-race-edit-type");
    const selectedType = typeSelect ? typeSelect.value : "grand_prix";

    const nameInput = this.querySelector("#input-race-edit-name");
    const newName = nameInput ? nameInput.value.trim() : "";

    const trackSelect = this.querySelector("#select-race-edit-track");
    const selectedTrackId = trackSelect ? trackSelect.value : "";

    const dateInput = this.querySelector("#input-race-edit-date");
    let selectedDateISO = this.race.date || new Date().toISOString();
    if (dateInput && dateInput.value) {
      try {
        const origDate = this.race.date ? new Date(this.race.date) : new Date();
        const [year, month, day] = dateInput.value.split("-").map(Number);
        origDate.setFullYear(year);
        origDate.setMonth(month - 1);
        origDate.setDate(day);
        selectedDateISO = origDate.toISOString();
      } catch (e) {
        // Fallback
      }
    }

    const pilots = this.race.pilots || [];
    const quali = this.race.quali || [];
    const raceSession = this.race.raceSession || [];

    return JSON.stringify({
      name: newName,
      type: selectedType,
      trackId: selectedTrackId,
      date: selectedDateISO,
      pilots: pilots,
      quali: quali,
      raceSession: raceSession,
    });
  }

  checkPendingChanges() {
    const submitBtn = this.querySelector("#btn-submit-edit-race");
    if (!submitBtn) return;

    const currentSnapshot = this.getCurrentStateSnapshot();
    const hasChanges = currentSnapshot !== this.initialRaceSnapshot;
    submitBtn.disabled = !hasChanges;
  }

  handleCloseAttempt() {
    const currentSnapshot = this.getCurrentStateSnapshot();
    const hasChanges = currentSnapshot !== this.initialRaceSnapshot;

    if (hasChanges) {
      const confirmCloseModalEl = this.querySelector(
        "#modal-confirm-close-edit",
      );
      if (confirmCloseModalEl) {
        let confirmCloseModalInstance =
          bootstrap.Modal.getInstance(confirmCloseModalEl);
        if (!confirmCloseModalInstance) {
          confirmCloseModalInstance = new bootstrap.Modal(confirmCloseModalEl);
        }
        confirmCloseModalInstance.show();
      }
    } else {
      this.closeEditModal();
    }
  }

  closeEditModal() {
    const modalEl = this.querySelector("#modal-edit-race");
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  render() {
    this.innerHTML = `
      <style>
        .pilot-pill-wrapper {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .pilot-pill-wrapper:hover {
          background-color: var(--bs-tertiary-bg) !important;
          border-color: var(--bs-primary-border-subtle) !important;
        }
        .pilot-pill-wrapper:hover .delete-badge {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        #form-edit-race {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow: hidden;
        }
      </style>

      <div class="modal fade" id="modal-edit-race" tabindex="-1" aria-labelledby="modal-edit-race-title" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-edit-race-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
                ${window.t("registrations.races_modal.edit_title") || "Editar Corrida"}
              </h5>
            </div>
            
            <form id="form-edit-race">
              <div class="modal-body text-start py-4 fs-6">
                <!-- 4 Inputs in 1 Row: Tipo (col-3), Nome (col-4), Pista (col-3), Data (col-2) -->
                <div class="row g-3">
                  <!-- Tipo col-3 -->
                  <div class="col-3">
                    <label for="select-race-edit-type" class="form-label fw-semibold text-secondary small">
                      Tipo de Corrida
                    </label>
                    <select id="select-race-edit-type" class="form-select">
                      <option value="grand_prix">Grande Prêmio</option>
                    </select>
                  </div>

                  <!-- Nome col-4 -->
                  <div class="col-4">
                    <label for="input-race-edit-name" class="form-label fw-semibold text-secondary small">
                      ${window.t("registrations.modal.name_label") || "Nome"}
                    </label>
                    <input type="text" id="input-race-edit-name" class="form-control" required placeholder="${window.t("registrations.new_race") || "Nome da Corrida"}">
                  </div>

                  <!-- Pista col-3 -->
                  <div class="col-3">
                    <label for="select-race-edit-track" class="form-label fw-semibold text-secondary small">
                      ${window.t("registrations.races_modal.track_label") || "Pista Utilizada"}
                    </label>
                    <select id="select-race-edit-track" class="form-select">
                      <!-- Options loaded dynamically -->
                    </select>
                  </div>

                  <!-- Data col-2 -->
                  <div class="col-2">
                    <label for="input-race-edit-date" class="form-label fw-semibold text-secondary small">
                      ${window.t("registrations.races_modal.date_label") || "Data"}
                    </label>
                    <input type="date" id="input-race-edit-date" class="form-control" required>
                  </div>
                </div>

                <!-- Pilots list col-12 -->
                <div class="row mt-4">
                  <div class="col-12">
                    <label class="form-label fw-semibold text-secondary small mb-2">
                      ${window.t("registrations.drivers") || "Pilotos"}
                    </label>
                    <div id="race-edit-pilots-list" class="d-flex align-items-center gap-2 flex-wrap py-1">
                      <!-- Rendered dynamically -->
                    </div>
                  </div>
                </div>

                <!-- Qualifying Standings Table Row -->
                <slotrace-registrations-races-quali-table id="race-edit-quali-table-component" class="d-block mt-4 d-none"></slotrace-registrations-races-quali-table>

                <!-- Race Standings Table Row -->
                <slotrace-registrations-races-race-table id="race-edit-race-table-component" class="d-block mt-4 d-none"></slotrace-registrations-races-race-table>
              </div>
              
              <div class="d-flex justify-content-end gap-2 p-3 border-top border-secondary-subtle">
                <button type="button" id="btn-cancel-edit-race" class="btn btn-secondary px-3 fw-semibold">
                  ${window.t("registrations.modal.cancel_button") || "Cancelar"}
                </button>
                <button type="submit" id="btn-submit-edit-race" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
                  <i class="mdi mdi-content-save-outline fs-5"></i>
                  ${window.t("registrations.races_modal.save_button") || "Salvar Alterações"}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      </div>

      <!-- Confirmation Modal for Removing a Pilot -->
      <div class="modal fade" id="modal-confirm-remove-pilot" tabindex="-1" aria-labelledby="modal-confirm-remove-pilot-title" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1065; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-md">
          <div class="modal-content border-danger-subtle">
            <div class="modal-header bg-danger bg-opacity-10 border-danger-subtle py-2.5">
              <h6 class="modal-title fw-bold text-danger d-flex align-items-center gap-2" id="modal-confirm-remove-pilot-title" style="font-size: 0.95rem;">
                <i class="mdi mdi-alert-circle-outline fs-5"></i>
                Confirmar Remoção de Piloto
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              <p class="mb-0 text-body-emphasis small">
                Tem certeza de que deseja remover o piloto <strong id="remove-pilot-confirm-name" class="text-primary"></strong> desta corrida? Todos os tempos das voltas dele também serão permanentemente excluídos.
              </p>
            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="btn-confirm-remove-pilot-action" class="btn btn-sm btn-danger fw-semibold px-3">Remover</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal for Closing Edit Modal with Unsaved Changes -->
      <div class="modal fade" id="modal-confirm-close-edit" tabindex="-1" aria-labelledby="modal-confirm-close-edit-title" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1065; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-md">
          <div class="modal-content border-warning-subtle">
            <div class="modal-header bg-warning bg-opacity-10 border-warning-subtle py-2.5">
              <h6 class="modal-title fw-bold text-warning d-flex align-items-center gap-2" id="modal-confirm-close-edit-title" style="font-size: 0.95rem;">
                <i class="mdi mdi-alert-circle-outline fs-5"></i>
                Descartar Alterações?
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              <p class="mb-0 text-body-emphasis small">
                Você possui alterações pendentes nesta corrida. Tem certeza de que deseja fechar o modal? Todas as modificações não salvas serão permanentemente perdidas.
              </p>
            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Continuar Editando</button>
              <button type="button" id="btn-confirm-discard-changes" class="btn btn-sm btn-warning text-dark fw-semibold px-3">Descartar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-registrations-races-edit-modal",
  SlotRaceRegistrationsRacesEditModal,
);

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
      if (this.race) {
        const formComponent = this.querySelector("#race-edit-form-component");
        if (formComponent) {
          formComponent.setParams(this.race, this.tracks);
        }
        this.populateDropdowns();
      }
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

      // Clear expanded pilot drawers when loading a new race edit request
      const qualiTableComponent = this.querySelector(
        "#race-edit-quali-table-component",
      );
      if (
        qualiTableComponent &&
        typeof qualiTableComponent.collapseAll === "function"
      ) {
        qualiTableComponent.collapseAll();
      }

      const raceTableComponent = this.querySelector(
        "#race-edit-race-table-component",
      );
      if (
        raceTableComponent &&
        typeof raceTableComponent.collapseAll === "function"
      ) {
        raceTableComponent.collapseAll();
      }

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

          const formComponent = this.querySelector("#race-edit-form-component");
          if (formComponent) {
            formComponent.setParams(this.race, this.tracks);
          }

          this.populateDropdowns();

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
          const updatedRace = races.find(
            (r) => String(r.id) === String(this.race.id),
          );
          if (updatedRace) {
            this.race.raceSession = updatedRace.raceSession || [];
            this.race.quali = updatedRace.quali || [];
            this.race.pilots = updatedRace.pilots || [];

            this.populatePilots();

            this.initialRaceSnapshot = this.getCurrentStateSnapshot();
            this.checkPendingChanges();
          } else {
            // The race was deleted from the DB, close the edit modal now
            this.closeEditModal();
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
    // Populate pilots avatars list
    this.populatePilots();
  }

  populatePilots() {
    const pilotsContainer = this.querySelector("#race-edit-pilots-list");
    if (!pilotsContainer) return;

    const pills = pilotsContainer.querySelectorAll("slotrace-driver-pill");
    pills.forEach((p) => p.remove());

    const addButton = pilotsContainer.querySelector("#btn-race-edit-add-pilot");
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

      if (addButton) {
        pilotsContainer.insertBefore(pill, addButton);
      } else {
        pilotsContainer.appendChild(pill);
      }
    });

    const tablesContainer = this.querySelector(
      "#race-edit-tables-tab-container",
    );
    const emptyStateContainer = this.querySelector(
      "#race-edit-tables-empty-state",
    );
    const qualiTableComponent = this.querySelector(
      "#race-edit-quali-table-component",
    );
    const raceTableComponent = this.querySelector(
      "#race-edit-race-table-component",
    );

    if (tablesContainer && emptyStateContainer) {
      if (racePilots.length === 0) {
        tablesContainer.classList.add("d-none");
        emptyStateContainer.classList.remove("d-none");
      } else {
        tablesContainer.classList.remove("d-none");
        emptyStateContainer.classList.add("d-none");

        if (qualiTableComponent) {
          qualiTableComponent.setParams(this.race, this.drivers, this.cars);
        }
        if (raceTableComponent) {
          raceTableComponent.setParams(this.race, this.drivers, this.cars);
        }
      }
    }
  }

  setupEvents() {
    const form = this.querySelector("#form-edit-race");
    const modalEl = this.querySelector("#modal-edit-race");

    if (form && modalEl) {
      // Clear expanded pilot drawers when modal closes
      const handleModalClose = () => {
        const qualiTableComponent = this.querySelector(
          "#race-edit-quali-table-component",
        );
        if (
          qualiTableComponent &&
          typeof qualiTableComponent.collapseAll === "function"
        ) {
          qualiTableComponent.collapseAll();
        }

        const raceTableComponent = this.querySelector(
          "#race-edit-race-table-component",
        );
        if (
          raceTableComponent &&
          typeof raceTableComponent.collapseAll === "function"
        ) {
          raceTableComponent.collapseAll();
        }
      };

      modalEl.addEventListener("hide.bs.modal", handleModalClose);
      modalEl.addEventListener("hidden.bs.modal", handleModalClose);

      // Prevent form submission on Enter keypress
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      });

      // Bind input/change listeners to detect changes to inputs
      form.addEventListener("input", () => this.checkPendingChanges());
      form.addEventListener("change", () => this.checkPendingChanges());

      // Bind custom form input event
      const formComponent = this.querySelector("#race-edit-form-component");
      if (formComponent) {
        formComponent.addEventListener("raceFormInput", () =>
          this.checkPendingChanges(),
        );
      }

      // Bind static add pilot button click listener
      const addPilotBtn = this.querySelector("#btn-race-edit-add-pilot");
      if (addPilotBtn) {
        addPilotBtn.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent("requestOpenAddPilot", {
              detail: { race: this.race, drivers: this.drivers },
            }),
          );
        });
      }

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

      // Delete button on footer
      const deleteBtn = this.querySelector("#btn-delete-race");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          if (!this.race) return;
          window.dispatchEvent(
            new CustomEvent("requestDeleteRace", {
              detail: { id: this.race.id, name: this.race.name },
            }),
          );
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

        const formComponent = this.querySelector("#race-edit-form-component");
        const formValues = formComponent
          ? formComponent.getValues()
          : {
              type: "grand_prix",
              name: "",
              trackId: "",
              date: this.race.date || new Date().toISOString(),
            };

        const selectedType = formValues.type;
        const newName = formValues.name;
        const selectedTrackId = formValues.trackId;
        const selectedDateISO = formValues.date;

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

    const formComponent = this.querySelector("#race-edit-form-component");
    const formValues = formComponent
      ? formComponent.getValues()
      : {
          type: "grand_prix",
          name: "",
          trackId: "",
          date: this.race.date || new Date().toISOString(),
        };

    const pilots = this.race.pilots || [];
    const quali = this.race.quali || [];
    const raceSession = this.race.raceSession || [];

    return JSON.stringify({
      name: formValues.name,
      type: formValues.type,
      trackId: formValues.trackId,
      date: formValues.date,
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

    const qualiTableComponent = this.querySelector(
      "#race-edit-quali-table-component",
    );
    if (
      qualiTableComponent &&
      typeof qualiTableComponent.collapseAll === "function"
    ) {
      qualiTableComponent.collapseAll();
    }

    const raceTableComponent = this.querySelector(
      "#race-edit-race-table-component",
    );
    if (
      raceTableComponent &&
      typeof raceTableComponent.collapseAll === "function"
    ) {
      raceTableComponent.collapseAll();
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
        <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-edit-race-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
                Corrida
              </h5>
              <button type="button" id="btn-close-edit-race" class="btn-close" aria-label="Close"></button>
            </div>
            
            <form id="form-edit-race">
              <div class="modal-body text-start fs-6 p-0">
                <div class="d-flex h-100">
                  <div class="bg-body-tertiary h-100 d-flex flex-column gap-3 p-3 overflow-y-auto" style="min-width: 350px; max-width: 350px;">
                    <!-- FORM -->
                    <slotrace-registrations-races-form id="race-edit-form-component"></slotrace-registrations-races-form>
                    <!-- Pilots list -->
                    <div>
                      <label class="form-label fw-semibold text-secondary small mb-2">
                        ${window.t("registrations.drivers") || "Pilotos"}
                      </label>
                      <div id="race-edit-pilots-list" class="d-flex align-items-center gap-2 flex-wrap py-1">
                        <!-- Rendered dynamically -->
                        <button type="button" id="btn-race-edit-add-pilot" class="btn btn-primary rounded-pill w-100" style="height: 48px;" title="${window.t("registrations.races_modal.add_driver") || "Adicionar Piloto"}">
                          <i class="mdi mdi-plus"></i>
                          <span>${window.t("registrations.races_modal.add_driver") || "Adicionar Piloto"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- TABLES AREA -->
                  <div class="flex-grow-1 p-3 overflow-y-auto">
                    <!-- Tab System Container (visible when pilots > 0) -->
                    <div id="race-edit-tables-tab-container" class="d-none h-100 d-flex flex-column">
                      <!-- Navigation Tabs -->
                      <ul class="nav nav-tabs nav-fill border-secondary-subtle mb-3" id="race-edit-tabs" role="tablist">
                        <li class="nav-item" role="presentation">
                          <button class="nav-link active fw-semibold text-secondary-emphasis" id="quali-tab" data-bs-toggle="tab" data-bs-target="#tab-content-quali" type="button" role="tab" aria-controls="tab-content-quali" aria-selected="true">
                            Classificação
                          </button>
                        </li>
                        <li class="nav-item" role="presentation">
                          <button class="nav-link fw-semibold text-secondary-emphasis" id="race-tab" data-bs-toggle="tab" data-bs-target="#tab-content-race" type="button" role="tab" aria-controls="tab-content-race" aria-selected="false">
                            Corrida
                          </button>
                        </li>
                      </ul>
                      
                      <!-- Tab Content Container -->
                      <div class="tab-content flex-grow-1" id="race-edit-tabs-content">
                        <!-- Tab 1: Qualifying -->
                        <div class="tab-pane fade show active h-100" id="tab-content-quali" role="tabpanel" aria-labelledby="quali-tab">
                          <slotrace-registrations-races-quali-table id="race-edit-quali-table-component" class="d-block mb-4"></slotrace-registrations-races-quali-table>
                        </div>
                        
                        <!-- Tab 2: Race -->
                        <div class="tab-pane fade h-100" id="tab-content-race" role="tabpanel" aria-labelledby="race-tab">
                          <slotrace-registrations-races-race-table id="race-edit-race-table-component" class="d-block"></slotrace-registrations-races-race-table>
                        </div>
                      </div>
                    </div>

                    <!-- Empty State (visible when pilots == 0) -->
                    <div id="race-edit-tables-empty-state" class="d-flex flex-column align-items-center justify-content-center h-100 text-secondary gap-3 py-5">
                      <i class="mdi mdi-table-alert text-secondary" style="font-size: 64px; opacity: 0.65;"></i>
                      <div class="text-center">
                        <h6 class="fw-bold text-body-emphasis mb-1">Nenhum Piloto Adicionado</h6>
                        <p class="small text-secondary mb-0">Adicione pilotos para configurar a Classificação e Resultados da Corrida.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between align-items-center p-3 border-top border-secondary-subtle">
                <button type="button" id="btn-delete-race" class="btn text-danger px-3 fw-semibold d-flex align-items-center gap-2" title="${window.t("registrations.modal.delete_button") || "Excluir"}">
                  <i class="mdi mdi-trash-can-outline fs-5"></i>
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

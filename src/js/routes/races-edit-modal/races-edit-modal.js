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

          // Reset active tab to Qualifying
          const qualiTab = this.querySelector("#quali-tab");
          if (qualiTab) {
            const tabTrigger = new bootstrap.Tab(qualiTab);
            tabTrigger.show();
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
          window.confirmModal({
            title: "Confirmar Remoção de Piloto",
            message: `Tem certeza de que deseja remover o piloto <strong class="text-danger">${name}</strong> desta corrida? Todos os tempos das voltas dele também serão permanentemente excluídos.`,
            theme: "danger",
            icon: "mdi-alert-circle-outline",
            confirmBtnText: "Remover",
            confirmBtnIcon: "mdi-trash-can-outline"
          }).then((confirmed) => {
            if (confirmed) {
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
            }
          });
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

        // Populate results tab
        this.populateResultsTab();
      }
    }
  }

  _formatPodiumTime(seconds) {
    if (seconds == null || isNaN(seconds) || seconds === 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    const paddedSecs = secs.padStart(6, "0");
    return mins > 0
      ? `${String(mins).padStart(2, "0")}:${paddedSecs}`
      : `00:${paddedSecs}`;
  }

  populateResultsTab() {
    const podiumComponent = this.querySelector("#race-edit-podium-component");
    const fastestLapsComponent = this.querySelector(
      "#race-edit-fastest-laps-component",
    );
    if (!podiumComponent) return;

    if (!this.race || !this.race.pilots || this.race.pilots.length === 0) {
      podiumComponent.setParams({ drivers: [] });
      if (fastestLapsComponent) {
        fastestLapsComponent.setParams({ race: null });
      }
      return;
    }

    const activePilotIds = new Set(
      this.race.pilots.map((p) =>
        String(p && typeof p === "object" ? p.id : p),
      ),
    );

    // Determine the top 3 drivers from the race session
    let topDrivers = [];
    if (this.race.raceSession && this.race.raceSession.length > 0) {
      const racePilots = this.race.pilots || [];
      const filteredSession = this.race.raceSession.filter((r) =>
        activePilotIds.has(String(r.pilotId)),
      );

      const sortedRace = [...filteredSession].sort((a, b) => {
        const lapsA = parseInt(a.laps) || 0;
        const lapsB = parseInt(b.laps) || 0;

        if (lapsA !== lapsB) {
          return lapsB - lapsA;
        }

        const zoneA = parseFloat(a.finalZone) || 0;
        const zoneB = parseFloat(b.finalZone) || 0;
        if (zoneA !== zoneB) {
          return zoneB - zoneA;
        }

        // Tie breaker: qualifying best lap time (fastest first, zeros at bottom)
        const qA = this.race.quali
          ? this.race.quali.find((q) => String(q.pilotId) === String(a.pilotId))
          : null;
        const qB = this.race.quali
          ? this.race.quali.find((q) => String(q.pilotId) === String(b.pilotId))
          : null;
        const qTimeA =
          qA && parseFloat(qA.bestLapTime) > 0
            ? parseFloat(qA.bestLapTime)
            : Infinity;
        const qTimeB =
          qB && parseFloat(qB.bestLapTime) > 0
            ? parseFloat(qB.bestLapTime)
            : Infinity;

        if (qTimeA !== qTimeB) {
          return qTimeA - qTimeB;
        }

        // Tie-breaker for identical qualifying best lap times: who did it first
        const setAtA = (qA && qA.bestLapTimeSetAt) || 0;
        const setAtB = (qB && qB.bestLapTimeSetAt) || 0;
        if (setAtA !== setAtB) {
          if (setAtA === 0) return 1;
          if (setAtB === 0) return -1;
          return setAtA - setAtB;
        }

        const idxA = racePilots.findIndex(
          (p) => (typeof p === "object" ? p.id : p) === a.pilotId,
        );
        const idxB = racePilots.findIndex(
          (p) => (typeof p === "object" ? p.id : p) === b.pilotId,
        );
        return idxA - idxB;
      });

      const leaderLaps = sortedRace[0] ? parseInt(sortedRace[0].laps) || 0 : 0;

      topDrivers = sortedRace
        .slice(0, 3)
        .map((r, index) => {
          const driverObj = this.drivers.find((d) => d.id === r.pilotId);
          if (!driverObj) return null;

          const pilotConfig = this.race.pilots.find((p) => {
            const pId = typeof p === "object" ? p.id : p;
            return String(pId) === String(r.pilotId);
          });
          const carId =
            pilotConfig && typeof pilotConfig === "object"
              ? pilotConfig.carId
              : null;
          const carObj =
            carId && this.cars
              ? this.cars.find((c) => String(c.id) === String(carId))
              : null;

          let lapsText = r.laps === 1 ? "1 VOLTA" : `${r.laps || 0} VOLTAS`;
          let subtext = "";

          if (index === 0) {
            subtext = "";
          } else {
            const currentLaps = parseInt(r.laps) || 0;
            const diffLaps = leaderLaps - currentLaps;
            if (diffLaps > 0) {
              subtext = `+${diffLaps} VOLTA${diffLaps > 1 ? "S" : ""}`;
            } else {
              const leaderZone = sortedRace[0]
                ? parseFloat(sortedRace[0].finalZone) || 0
                : 0;
              const currentZone = parseFloat(r.finalZone) || 0;
              const diffZones = leaderZone - currentZone;
              if (diffZones > 0) {
                subtext = `+${diffZones}z`;
              }
            }
          }

          return {
            driver: driverObj,
            car: carObj,
            laps: lapsText,
            subtext: subtext,
          };
        })
        .filter(Boolean);
    } else if (this.race.quali && this.race.quali.length > 0) {
      // Fallback: sort by bestLapTime ascending (excluding 0/empty times)
      const racePilots = this.race.pilots || [];
      const filteredQuali = this.race.quali.filter((q) =>
        activePilotIds.has(String(q.pilotId)),
      );

      const sortedQuali = [...filteredQuali]
        .filter((q) => (parseFloat(q.bestLapTime) || 0) > 0)
        .sort((a, b) => {
          const timeA = parseFloat(a.bestLapTime) || 0;
          const timeB = parseFloat(b.bestLapTime) || 0;

          if (timeA === timeB) {
            const setAtA = a.bestLapTimeSetAt || 0;
            const setAtB = b.bestLapTimeSetAt || 0;
            if (setAtA !== setAtB) {
              if (setAtA === 0) return 1;
              if (setAtB === 0) return -1;
              return setAtA - setAtB;
            }
            const idxA = racePilots.findIndex(
              (p) => (typeof p === "object" ? p.id : p) === a.pilotId,
            );
            const idxB = racePilots.findIndex(
              (p) => (typeof p === "object" ? p.id : p) === b.pilotId,
            );
            return idxA - idxB;
          }
          return timeA - timeB;
        });

      const leaderTime = sortedQuali[0]
        ? parseFloat(sortedQuali[0].bestLapTime) || 0
        : 0;

      topDrivers = sortedQuali
        .slice(0, 3)
        .map((q, index) => {
          const driverObj = this.drivers.find((d) => d.id === q.pilotId);
          if (!driverObj) return null;

          const pilotConfig = this.race.pilots.find((p) => {
            const pId = typeof p === "object" ? p.id : p;
            return String(pId) === String(q.pilotId);
          });
          const carId =
            pilotConfig && typeof pilotConfig === "object"
              ? pilotConfig.carId
              : null;
          const carObj =
            carId && this.cars
              ? this.cars.find((c) => String(c.id) === String(carId))
              : null;

          const totalLaps = q.laps || (q.lapTimes ? q.lapTimes.length : 0);
          let lapsText = totalLaps === 1 ? "1 VOLTA" : `${totalLaps} VOLTAS`;
          let subtext = "";

          if (index === 0) {
            subtext = "";
          } else {
            const currentTime = parseFloat(q.bestLapTime) || 0;
            const diffTime = currentTime - leaderTime;
            if (diffTime > 0) {
              subtext = `+${diffTime.toFixed(3)}s`;
            }
          }

          return {
            driver: driverObj,
            car: carObj,
            laps: lapsText,
            subtext: subtext,
          };
        })
        .filter(Boolean);
    }

    podiumComponent.setParams({ drivers: topDrivers });

    if (fastestLapsComponent) {
      fastestLapsComponent.setParams({
        race: this.race,
        drivers: this.drivers,
        cars: this.cars,
        tracks: this.tracks,
      });
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

      const deleteBtn = this.querySelector("#btn-delete-race");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          if (!this.race) return;
          window.confirmModal({
            title: window.t('registrations.races_modal.delete_title') || 'Excluir Corrida',
            message: `${window.t('registrations.races_modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir a corrida '}<strong class="text-danger fw-bold">${this.race.name}</strong>${window.t('registrations.races_modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita e removerá o registro do histórico.'}`,
            theme: 'danger',
            icon: 'mdi-alert-circle',
            cancelBtnText: window.t('registrations.modal.cancel_button') || 'Cancelar',
            confirmBtnText: window.t('registrations.modal.delete_button_confirm') || 'Excluir',
            confirmBtnIcon: 'mdi-trash-can-outline'
          }).then((confirmed) => {
            if (confirmed) {
              const raceId = this.race.id;
              window.electronAPI.db.get('races').then(races => {
                const racesList = races || [];
                const updatedList = racesList.filter(r => r.id !== raceId);
                return window.electronAPI.db.set('races', updatedList);
              }).then(success => {
                if (success) {
                  window.recalculateDriversRacesCount();
                  window.dispatchEvent(new CustomEvent('raceListChanged'));
                }
              }).catch(err => {
                console.error('Failed to delete race from database:', err);
              });
            }
          });
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.race) return;

        window.confirmModal({
          title: "Confirmar Salvamento",
          message: "Deseja realmente salvar as alterações feitas nesta corrida?",
          theme: "success",
          icon: "mdi-content-save-outline",
          cancelBtnText: "Cancelar",
          confirmBtnText: "Confirmar",
          confirmBtnIcon: "mdi-check-circle-outline"
        }).then((confirmed) => {
          if (confirmed) {
            this.saveRaceChanges();
          }
        });
      });
    }
  }

  saveRaceChanges() {
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
            this.race.name = newName || r.name;
            this.race.type = selectedType;
            this.race.trackId = selectedTrackId;
            this.race.trackName = selectedTrackName;
            this.race.date = selectedDateISO;

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
          this.initialRaceSnapshot = this.getCurrentStateSnapshot();
          this.checkPendingChanges();
          window.dispatchEvent(new CustomEvent("raceListChanged"));
        }
      })
      .catch((err) => {
        console.error("Failed to update race details in database:", err);
      });
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
    
    if (hasChanges) {
      submitBtn.classList.remove("d-none");
    } else {
      submitBtn.classList.add("d-none");
    }

    const qualiTable = this.querySelector("#race-edit-quali-table-component");
    if (qualiTable && typeof qualiTable.setHasPendingChanges === "function") {
      qualiTable.setHasPendingChanges(hasChanges);
    }
    const raceTable = this.querySelector("#race-edit-race-table-component");
    if (raceTable && typeof raceTable.setHasPendingChanges === "function") {
      raceTable.setHasPendingChanges(hasChanges);
    }
  }

  handleCloseAttempt() {
    const currentSnapshot = this.getCurrentStateSnapshot();
    const hasChanges = currentSnapshot !== this.initialRaceSnapshot;

    if (hasChanges) {
      window.confirmModal({
        title: "Descartar Alterações?",
        message: "Você possui alterações pendentes nesta corrida. Tem certeza de que deseja fechar o modal? Todas as modificações não salvas serão permanentemente perdidas.",
        theme: "warning",
        icon: "mdi-alert-circle-outline",
        cancelBtnText: "Continuar Editando",
        confirmBtnText: "Descartar",
        confirmBtnIcon: "mdi-close-circle-outline"
      }).then((confirmed) => {
        if (confirmed) {
          this.closeEditModal();
        }
      });
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
        @keyframes pulse-save-btn {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(25, 135, 84, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(25, 135, 84, 0);
          }
        }
        .pulse-save {
          animation: pulse-save-btn 1.8s infinite;
        }
      </style>

      <div class="modal fade" id="modal-edit-race" tabindex="-1" aria-labelledby="modal-edit-race-title" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
          <div class="modal-content border-secondary-subtle">
            <form id="form-edit-race">
              <div class="modal-body text-start fs-6 p-0">
                <div class="d-flex h-100">
                  <div class="bg-body-tertiary h-100 d-flex flex-column gap-3 p-3" style="min-width: 350px; max-width: 350px;">
                    <div class="d-flex align-items-center gap-2 w-100">
                      <button type="button" id="btn-close-edit-race" class="btn border-0 p-0 text-body-secondary me-2 d-flex align-items-center justify-content-center" aria-label="Close" style="background: none; border: none; box-shadow: none; width: 32px; height: 32px;">
                      <i class="mdi mdi-arrow-left fs-3"></i>
                      </button>
                      <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2 mb-0" id="modal-edit-race-title" style="font-size: 1.1rem;">
                        <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
                        Corrida
                      </h5>
                      <div class="ms-auto"></div>
                      <button type="submit" id="btn-submit-edit-race" class="btn btn-success rounded-circle p-0 d-flex align-items-center justify-content-center d-none pulse-save" title="${window.t("registrations.races_modal.save_button") || "Salvar Alterações"}" style="width: 32px; height: 32px; min-width: 32px;">
                        <i class="mdi mdi-content-save-outline fs-5"></i>
                      </button>
                      <button type="button" id="btn-delete-race" class="btn border-0 text-danger rounded-circle p-0 d-flex align-items-center justify-content-center" title="${window.t("registrations.modal.delete_button") || "Excluir"}" style="background: none; box-shadow: none; width: 32px; height: 32px; min-width: 32px;">
                        <i class="mdi mdi-trash-can-outline fs-4"></i>
                      </button>
                    </div>
                    <!-- FORM -->
                    <slotrace-registrations-races-form id="race-edit-form-component"></slotrace-registrations-races-form>
                    <!-- Pilots list -->
                    <div class="d-flex flex-column flex-grow-1 overflow-hidden" style="min-height: 0;">
                      <label class="form-label fw-semibold text-secondary small mb-2">
                        ${window.t("registrations.drivers") || "Pilotos"}
                      </label>
                      <div id="race-edit-pilots-list" class="d-flex flex-column gap-2 py-1 overflow-y-auto overflow-x-hidden" style="min-height: 0;">
                        <!-- Rendered dynamically -->
                        <button type="button" id="btn-race-edit-add-pilot" class="btn btn-primary rounded-pill w-100 flex-shrink-0" style="height: 48px;" title="${window.t("registrations.races_modal.add_driver") || "Adicionar Piloto"}">
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
                        <li class="nav-item" role="presentation">
                          <button class="nav-link fw-semibold text-secondary-emphasis" id="results-tab" data-bs-toggle="tab" data-bs-target="#tab-content-results" type="button" role="tab" aria-controls="tab-content-results" aria-selected="false">
                            Resultados
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

                        <!-- Tab 3: Results -->
                        <div class="tab-pane fade h-100 overflow-y-auto" id="tab-content-results" role="tabpanel" aria-labelledby="results-tab">
                          <div class="d-flex justify-content-center align-items-center gap-4 h-100 flex-wrap">
                            <slotrace-podium id="race-edit-podium-component" style="min-width: 700px;"></slotrace-podium>
                            <slotrace-fastest-laps id="race-edit-fastest-laps-component" style="width: 500px;"></slotrace-fastest-laps>
                          </div>
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
              
            </form>
            
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

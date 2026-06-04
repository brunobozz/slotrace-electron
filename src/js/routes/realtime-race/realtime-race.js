class SlotRaceRealtimeRace extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.cars = [];

    this._goRaceListener = (e) => {
      const { race } = e.detail;
      this.race = race;
      this.loadDataAndRender();
    };
    window.addEventListener("requestGoRace", this._goRaceListener);

    // Header Event Listeners
    this._startListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.setColor("#adff2f");
        timer.start();
      }
      const header = this.querySelector("slotrace-realtime-race-header");
      if (header) {
        header.setState("running");
      }
    };

    this._pauseListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.pause();
      }
      const header = this.querySelector("slotrace-realtime-race-header");
      if (header) {
        header.setState("paused");
      }
    };

    this._resumeListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.resume();
      }
      const header = this.querySelector("slotrace-realtime-race-header");
      if (header) {
        header.setState("running");
      }
    };

    this._resetListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.reset();
      }
      const header = this.querySelector("slotrace-realtime-race-header");
      if (header) {
        header.setState("idle");
      }
    };

    // Configuration Saved Listener
    this._configSavedListener = async (e) => {
      const { timePerLane, interval } = e.detail;
      if (this.race) {
        this.race.timePerLane = timePerLane;
        this.race.interval = interval;

        // Persist to offline JSON database
        try {
          const races = (await window.electronAPI.db.get("races")) || [];
          const idx = races.findIndex((r) => r.id === this.race.id);
          if (idx !== -1) {
            races[idx].timePerLane = timePerLane;
            races[idx].interval = interval;
            await window.electronAPI.db.set("races", races);
            console.log(
              `[Database] Saved race configurations for ID: ${this.race.id} (Time/lane: ${timePerLane}s, Interval: ${interval}s)`,
            );
          }
        } catch (err) {
          console.error("Failed to save race configurations to database:", err);
        }
      }
    };

    window.addEventListener("raceSessionStart", this._startListener);
    window.addEventListener("raceSessionPause", this._pauseListener);
    window.addEventListener("raceSessionResume", this._resumeListener);
    window.addEventListener("raceSessionReset", this._resetListener);
    window.addEventListener("raceConfigSaved", this._configSavedListener);
  }

  disconnectedCallback() {
    window.removeEventListener("requestGoRace", this._goRaceListener);
    window.removeEventListener("raceSessionStart", this._startListener);
    window.removeEventListener("raceSessionPause", this._pauseListener);
    window.removeEventListener("raceSessionResume", this._resumeListener);
    window.removeEventListener("raceSessionReset", this._resetListener);
    window.removeEventListener("raceConfigSaved", this._configSavedListener);
  }

  async loadDataAndRender() {
    try {
      this.drivers = (await window.electronAPI.db.get("drivers")) || [];
      this.cars = (await window.electronAPI.db.get("cars")) || [];
    } catch (e) {
      this.drivers = [];
      this.cars = [];
    }

    this.render();
    this.showModal();

    // Reset timer and header states
    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.reset();
    }

    const header = this.querySelector("slotrace-realtime-race-header");
    if (header && this.race) {
      header.setData({ race: this.race });
      header.setState("idle");
    }

    // Populate configurations modal data
    const configModal = this.querySelector(
      "slotrace-realtime-race-config-modal",
    );
    if (configModal && this.race) {
      configModal.setData({
        timePerLane:
          this.race.timePerLane !== undefined ? this.race.timePerLane : 60,
        interval: this.race.interval !== undefined ? this.race.interval : 10,
      });
    }

    // Populate race session table
    const session = this.querySelector("slotrace-realtime-race-session");
    if (session && this.race) {
      session.setData({
        raceSession: this.race.raceSession || [],
        pilots: this.race.pilots || [],
        drivers: this.drivers,
        cars: this.cars,
      });
    }
  }

  showModal() {
    const modalEl = this.querySelector("#modal-realtime-race");
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }

      modalEl.addEventListener("hidden.bs.modal", () => {
        const timer = this.querySelector("slotrace-timer");
        if (timer) {
          timer.stop();
          timer.reset();
        }
        const header = this.querySelector("slotrace-realtime-race-header");
        if (header) {
          header.setState("idle");
        }
      });

      modalInstance.show();
    }
  }

  render() {
    if (!this.race) {
      this.innerHTML = "";
      return;
    }

    this.innerHTML = `
      <div class="modal fade" id="modal-realtime-race" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content border-0 text-white d-flex flex-column h-100">
            
            <!-- Header section -->
            <slotrace-realtime-race-header></slotrace-realtime-race-header>

            <!-- Content area: Race Session Table -->
            <div class="h-100 d-flex flex-column">
              <slotrace-realtime-race-session class="flex-grow-1 d-flex flex-column"></slotrace-realtime-race-session>
            </div>
          </div>
        </div>
      </div>


      <!-- Content area: 2 columns -->
      <div class="modal-body flex-grow-1 p-0 d-flex overflow-hidden">
        
        <!-- Race Config Mini Modal Component -->
        <slotrace-realtime-race-config-modal></slotrace-realtime-race-config-modal>

        <!-- Right Column: Standings + Queue -->
        <div class="d-flex flex-column h-100" style="width: 30%; min-width: 320px;">
          <!-- Aqui o race-standings vai entrar 
          <race-standings class="flex-grow-1 d-flex flex-column"></race-standings> -->
          <!-- Aqui o race-queue vai entrar 
          <race-queue class="flex-grow-1 d-flex flex-column"></race-queue> -->
        </div>

      </div>
    `;
  }
}

customElements.define("slotrace-realtime-race", SlotRaceRealtimeRace);

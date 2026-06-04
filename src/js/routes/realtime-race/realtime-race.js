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

    // Toolbar Event Listeners
    this._startListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.setColor("#adff2f");
        timer.start();
      }
      const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
      if (toolbar) {
        toolbar.setState("running");
      }
    };

    this._pauseListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.pause();
      }
      const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
      if (toolbar) {
        toolbar.setState("paused");
      }
    };

    this._resumeListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.resume();
      }
      const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
      if (toolbar) {
        toolbar.setState("running");
      }
    };

    this._resetListener = () => {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.reset();
      }
      const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
      if (toolbar) {
        toolbar.setState("idle");
      }
    };

    window.addEventListener("raceSessionStart", this._startListener);
    window.addEventListener("raceSessionPause", this._pauseListener);
    window.addEventListener("raceSessionResume", this._resumeListener);
    window.addEventListener("raceSessionReset", this._resetListener);
  }

  disconnectedCallback() {
    window.removeEventListener("requestGoRace", this._goRaceListener);
    window.removeEventListener("raceSessionStart", this._startListener);
    window.removeEventListener("raceSessionPause", this._pauseListener);
    window.removeEventListener("raceSessionResume", this._resumeListener);
    window.removeEventListener("raceSessionReset", this._resetListener);
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

    // Reset timer and toolbar states
    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.reset();
    }

    const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
    if (toolbar) {
      toolbar.setState("idle");
    }

    // Populate race standings table
    const standings = this.querySelector("slotrace-realtime-race-standings");
    if (standings && this.race) {
      standings.setData({
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
        const toolbar = this.querySelector("slotrace-realtime-race-toolbar");
        if (toolbar) {
          toolbar.setState("idle");
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
    const raceName = this.race.name || "";

    this.innerHTML = `
      <div class="modal fade" id="modal-realtime-race" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content border-0 text-white d-flex flex-column h-100">
            
            <!-- Header section -->
            <div class="modal-header border-bottom border-secondary-subtle px-4 py-0 d-flex align-items-center justify-content-between">
              <!-- Left: Logo -->
              <!-- <slotrace-logo></slotrace-logo> -->

              <!-- Center: Race Name & QUALIFICAÇÃO -->
              <div class="flex-grow-1 mx-3">
                <h2 class="fw-bold mb-0 text-uppercase text-body-secondary tracking-wider fs-2" style="letter-spacing: 0.05em;">
                  ${raceName}
                </h2>
                <div class="text-primary fw-semibold tracking-widest mt-0.5" style="font-size: 1rem; letter-spacing: 0.25em;">
                  QUALIFICAÇÃO
                </div>
              </div>

              <!-- Right: Timer & Close button -->
              <div class="d-flex align-items-center gap-3">
                <slotrace-timer></slotrace-timer>
                <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" style="outline: none; box-shadow: none;"></button>
              </div>
            </div>

            <!-- Toolbar section -->
            <slotrace-realtime-race-toolbar></slotrace-realtime-race-toolbar>

            <!-- Content area: Race Standings Table -->
            <div class="h-100 d-flex flex-column">
              <slotrace-realtime-race-standings class="flex-grow-1 d-flex flex-column"></slotrace-realtime-race-standings>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-realtime-race", SlotRaceRealtimeRace);

class SlotRaceRealtimeRaceToolbar extends HTMLElement {
  connectedCallback() {
    this._state = "idle"; // idle | running | paused | finished

    this._langListener = () => {
      this.render();
    };
    window.addEventListener("languageChanged", this._langListener);

    this.render();
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setState(state) {
    this._state = state;
    this.render();
  }

  render() {
    const isIdle = this._state === "idle";
    const isRunning = this._state === "running";
    const isPaused = this._state === "paused";
    const isFinished = this._state === "finished";

    this.innerHTML = `
      <div class="race-toolbar d-flex align-items-center justify-content-between p-2 border-bottom border-secondary-subtle" style="height: 50px;">
        
        <!-- Left Section: Future settings placeholder -->
        <div class="d-flex align-items-center gap-3">
          <div class="text-secondary small fw-semibold d-flex align-items-center gap-2">
            <i class="mdi mdi-cog-outline fs-5"></i>
            <span>${window.t("realtime_race.toolbar.config_placeholder") || "Configurações da Corrida"}</span>
          </div>
          <span class="text-secondary opacity-25">|</span>
          <div class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2.5 py-1.5 fw-medium small">
            Modo Treino / Livre
          </div>
        </div>

        <!-- Right Section: Action buttons -->
        <div class="d-flex align-items-center gap-2">
          
          <!-- Start / Resume Button -->
          ${
            isIdle || isPaused
              ? `
            <button id="btn-race-start" class="btn btn-sm fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm" style="background-color: #28a745; color: #fff; font-size: 0.8rem;">
              <i class="mdi mdi-play"></i>
              <span>${isPaused ? "Retomar" : "Iniciar"}</span>
            </button>
          `
              : ""
          }

          <!-- Pause Button -->
          ${
            isRunning
              ? `
            <button id="btn-race-pause" class="btn btn-sm fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm text-dark" style="background-color: #ffc107; font-size: 0.8rem;">
              <i class="mdi mdi-pause"></i>
              <span>Pausar</span>
            </button>
          `
              : ""
          }

          <!-- Reset / Stop Button -->
          ${
            isRunning || isPaused
              ? `
            <button id="btn-race-reset" class="btn btn-sm fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm" style="background-color: #dc3545; color: #fff; font-size: 0.8rem;">
              <i class="mdi mdi-stop"></i>
              <span>Zerar</span>
            </button>
          `
              : ""
          }

        </div>

      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const btnStart = this.querySelector("#btn-race-start");
    const btnPause = this.querySelector("#btn-race-pause");
    const btnReset = this.querySelector("#btn-race-reset");

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        if (this._state === "idle") {
          window.dispatchEvent(new CustomEvent("raceSessionStart"));
        } else if (this._state === "paused") {
          window.dispatchEvent(new CustomEvent("raceSessionResume"));
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("raceSessionPause"));
      });
    }

    if (btnReset) {
      btnReset.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("raceSessionReset"));
      });
    }
  }
}

customElements.define(
  "slotrace-realtime-race-toolbar",
  SlotRaceRealtimeRaceToolbar,
);

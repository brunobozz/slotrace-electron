class SlotRaceRealtimeRaceHeader extends HTMLElement {
  connectedCallback() {
    this._race = null;
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

  setData({ race }) {
    this._race = race;
    this.render();
  }

  setState(state) {
    this._state = state;
    this.render();
  }

  render() {
    const raceName = this._race?.name || "";
    const isIdle = this._state === "idle";
    const isRunning = this._state === "running";
    const isPaused = this._state === "paused";

    this.innerHTML = `
      <div class="modal-header border-bottom border-secondary-subtle px-4 py-0 d-flex align-items-center justify-content-between" style="min-height: 70px;">
        
        <!-- Left: Action buttons (Iniciar / Pausar / Retomar / Zerar) + Config -->
        <div class="d-flex align-items-center gap-2" style="width: 300px;">
          <!-- Iniciar / Retomar -->
          ${
            isIdle || isPaused
              ? `
            <button id="btn-race-start" class="btn btn-lg btn-success fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm">
              <i class="mdi mdi-play"></i>
              <span>${isPaused ? "Retomar" : "Iniciar"}</span>
            </button>
          `
              : ""
          }

          <!-- Pausar -->
          ${
            isRunning
              ? `
            <button id="btn-race-pause" class="btn btn-lg btn-warning text-dark fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm">
              <i class="mdi mdi-pause"></i>
              <span>Pausar</span>
            </button>
          `
              : ""
          }

          <!-- Zerar -->
          ${
            isRunning || isPaused
              ? `
            <button id="btn-race-reset" class="btn btn-lg btn-danger fw-semibold d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm">
              <i class="mdi mdi-stop"></i>
              <span>Zerar</span>
            </button>
          `
              : ""
          }

          <!-- Gear Config Button -->
          <button id="btn-race-config" class="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center justify-content-center shadow-sm" title="Configurações da Corrida" style="width: 32px; height: 32px;">
            <i class="mdi mdi-cog fs-5"></i>
          </button>
        </div>

        <!-- Center: Race Name & Subtitle -->
        <div class="flex-grow-1 text-center">
          <h2 class="fw-bold mb-0 text-uppercase text-body-secondary tracking-wider fs-2" style="letter-spacing: 0.05em;">
            ${raceName}
          </h2>
          <div class="text-primary fw-semibold tracking-widest mt-0.5" style="font-size: 1rem; letter-spacing: 0.25em;">
            CORRIDA
          </div>
        </div>

        <!-- Right: Timer & Close button -->
        <div class="d-flex align-items-center gap-3 justify-content-end" style="width: 300px;">
          <slotrace-timer></slotrace-timer>
          <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" style="outline: none; box-shadow: none;"></button>
        </div>

      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const btnStart = this.querySelector("#btn-race-start");
    const btnPause = this.querySelector("#btn-race-pause");
    const btnReset = this.querySelector("#btn-race-reset");
    const btnConfig = this.querySelector("#btn-race-config");

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

    if (btnConfig) {
      btnConfig.addEventListener("click", () => {
        const configModalEl = document.getElementById("modal-race-config");
        if (configModalEl) {
          let configModalInstance = bootstrap.Modal.getInstance(configModalEl);
          if (!configModalInstance) {
            configModalInstance = new bootstrap.Modal(configModalEl);
          }
          configModalInstance.show();
        }
      });
    }
  }
}

customElements.define(
  "slotrace-realtime-race-header",
  SlotRaceRealtimeRaceHeader,
);

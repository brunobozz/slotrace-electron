class SlotRaceRealtimeRaceControls extends HTMLElement {
  constructor() {
    super();
    this._state = "idle";
  }

  connectedCallback() {
    this.render();
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
    const isInterval = this._state === "interval";

    this.className = "d-flex align-items-center gap-2";

    this.innerHTML = `
      <!-- Iniciar / Retomar -->
      ${
        isIdle || isPaused
          ? `
        <button id="btn-race-start" class="btn btn-lg btn-success rounded-circle d-flex align-items-center justify-content-center shadow-sm" title="${isPaused ? "Retomar" : "Iniciar"}" style="width: 48px; height: 48px;">
          <i class="mdi mdi-play fs-3" style="margin-left: 2px;"></i>
        </button>
      `
          : ""
      }

      <!-- Pausar -->
      ${
        isRunning || isInterval
          ? `
        <button id="btn-race-pause" class="btn btn-lg btn-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm" title="Pausar" style="width: 48px; height: 48px;">
          <i class="mdi mdi-pause fs-3"></i>
        </button>
      `
          : ""
      }

      <!-- Reiniciar -->
      ${
        isPaused || isFinished
          ? `
        <button id="btn-race-reset" class="btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center shadow-sm" title="Reiniciar" style="width: 32px; height: 32px;">
          <i class="mdi mdi-refresh fs-5"></i>
        </button>
      `
          : ""
      }

      <!-- Gear Config Button -->
      <button id="btn-race-config" class="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center shadow-sm" title="Configurações da Corrida" style="width: 32px; height: 32px;">
        <i class="mdi mdi-cog fs-5"></i>
      </button>
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

customElements.define("slotrace-realtime-race-controls", SlotRaceRealtimeRaceControls);

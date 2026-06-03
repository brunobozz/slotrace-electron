class SlotRaceRegistrationsRacesSessionLaps extends HTMLElement {
  constructor() {
    super();
    this.item = null;
    this.onChangeCallback = null;
  }

  connectedCallback() {
    this._langListener = () => {
      if (this.item) {
        this.render();
      }
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setParams(item, onChangeCallback, isPole) {
    this.item = item;
    this.onChangeCallback = onChangeCallback;
    this.isPole = isPole || false;
    this.render();
  }

  render() {
    if (!this.item) return;

    this.innerHTML = `
      <style>
        .btn-xs {
          padding: 0.15rem 0.4rem;
          font-size: 0.75rem;
          line-height: 1.25;
          border-radius: 0.2rem;
        }
        .lap-badge {
          display: inline-flex;
          align-items: center;
          background-color: var(--bs-body-bg);
          border: 1px solid var(--bs-border-color-translucent);
          border-radius: 8px;
          padding: 3px 8px;
          gap: 6px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out, transform 0.15s ease-in-out;
          transform: translateY(0);
        }
        .lap-badge:hover {
          border-color: var(--bs-border-color);
          transform: translateY(-1px);
        }
        .lap-badge:focus-within {
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.15);
          background-color: var(--bs-body-bg);
          transform: translateY(-1px);
        }
        .lap-badge-index {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--bs-secondary-color);
          user-select: none;
          display: inline-flex;
          align-items: center;
          line-height: 1 !important;
        }
        .lap-badge.best-lap .lap-badge-index {
          color: #2ec866 !important;
        }
        .lap-badge.best-lap.pole-lap .lap-badge-index {
          color: #a855f7 !important;
        }
        html[data-bs-theme="light"] .lap-badge.best-lap.pole-lap .lap-badge-index {
          color: #6f42c1 !important;
        }
        .lap-badge-input {
          border: 0 !important;
          background: transparent !important;
          color: var(--bs-body-color) !important;
          font-weight: 600;
          font-size: 0.85rem;
          width: 54px;
          text-align: center;
          outline: none !important;
          box-shadow: none !important;
          font-family: monospace;
          padding: 0;
          height: 18px;
          line-height: 18px !important;
        }
        .lap-badge.best-lap .lap-badge-input {
          color: #2ec866 !important;
          font-weight: 700;
        }
        .lap-badge.best-lap.pole-lap .lap-badge-input {
          color: #a855f7 !important;
          font-weight: 700;
        }
        html[data-bs-theme="light"] .lap-badge.best-lap.pole-lap .lap-badge-input {
          color: #6f42c1 !important;
          font-weight: 700;
        }
        .lap-badge-input::-webkit-outer-spin-button,
        .lap-badge-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .lap-badge-input[type=number] {
          -moz-appearance: textfield;
        }
        .lap-badge-delete {
          color: var(--bs-danger);
          opacity: 0.5;
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          line-height: 1 !important;
        }
        .lap-badge-delete:hover {
          opacity: 1;
          transform: scale(1.15);
        }
      </style>

      <div class="d-flex align-items-center justify-content-between mb-2.5 px-1">
        <span class="fw-bold text-secondary small d-flex align-items-center gap-1.5" style="font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase;">
          <i class="mdi mdi-history text-primary"></i>
          ${window.t("registrations.races_modal.laps_title") || "Tempos das Voltas"}
          <span class="badge bg-secondary bg-opacity-25 text-secondary-emphasis rounded-pill px-2 py-0.5 ms-1" style="font-size: 0.65rem; font-family: monospace;">${this.item.lapTimes.length}</span>
        </span>
        <button type="button" id="btn-add-lap-${this.item.pilotId}" class="btn btn-primary btn-sm d-flex align-items-center gap-1.5 fw-semibold shadow-sm">
          <i class="mdi mdi-plus"></i>
          ${window.t("registrations.races_modal.add_lap_button") || "Adicionar Volta"}
        </button>
      </div>
      
      <div class="laps-list-container d-flex flex-wrap gap-2 align-items-center pt-2 px-1" id="laps-list-container">
        <!-- Rendered dynamically -->
      </div>
    `;

    const lapsListContainer = this.querySelector("#laps-list-container");
    if (!lapsListContainer) return;

    if (this.item.lapTimes.length === 0) {
      lapsListContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2 py-1 px-1 text-secondary" style="font-size: 0.8rem;">
          <i class="mdi mdi-information-outline fs-6 text-primary"></i>
          <span>${window.t("registrations.races_modal.no_laps_registered") || 'Nenhuma volta registrada para este piloto. Clique em "Adicionar Volta" para começar.'}</span>
        </div>
      `;
    } else {
      this.item.lapTimes.forEach((lapTime, lapIndex) => {
        const isBestLap =
          this.item.bestLapIndex === lapIndex + 1 &&
          parseFloat(this.item.bestLapTime) > 0;
        const isPoleLap = isBestLap && this.isPole;
        const pill = document.createElement("div");
        pill.className = `lap-badge shadow-sm ${isBestLap ? "best-lap" : ""} ${isPoleLap ? "pole-lap" : ""}`;
        pill.innerHTML = `
          <span class="lap-badge-index">#${lapIndex + 1}</span>
          <input type="number" step="0.001" min="0" class="lap-badge-input input-lap-time" value="${lapTime || ""}" placeholder="0.000" data-lap-index="${lapIndex}">
          <i class="mdi mdi-close lap-badge-delete btn-delete-lap" data-lap-index="${lapIndex}"></i>
        `;

        const lapInput = pill.querySelector(".input-lap-time");
        if (lapInput) {
          lapInput.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value) || 0;
            this.item.lapTimes[lapIndex] = val;
            if (this.onChangeCallback) {
              this.onChangeCallback();
            }
          });
          lapInput.addEventListener("blur", () => {
            if (this.onChangeCallback) {
              this.onChangeCallback();
            }
          });
        }

        const delBtn = pill.querySelector(".btn-delete-lap");
        if (delBtn) {
          delBtn.addEventListener("click", () => {
            this.item.lapTimes.splice(lapIndex, 1);
            this.render();
            if (this.onChangeCallback) {
              this.onChangeCallback();
            }
          });
        }

        lapsListContainer.appendChild(pill);
      });
    }

    // Add Lap button logic
    const addLapBtn = this.querySelector(`#btn-add-lap-${this.item.pilotId}`);
    if (addLapBtn) {
      addLapBtn.addEventListener("click", () => {
        this.item.lapTimes.push(0);
        this.render();
        if (this.onChangeCallback) {
          this.onChangeCallback();
        }

        setTimeout(() => {
          const inputs = this.querySelectorAll(".input-lap-time");
          if (inputs && inputs.length > 0) {
            const lastInput = inputs[inputs.length - 1];
            lastInput.focus();
            lastInput.select();
          }
        }, 50);
      });
    }
  }
}

customElements.define(
  "slotrace-registrations-races-session-laps",
  SlotRaceRegistrationsRacesSessionLaps,
);

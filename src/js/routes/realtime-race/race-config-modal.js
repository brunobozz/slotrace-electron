class SlotRaceRealtimeRaceConfigModal extends HTMLElement {
  connectedCallback() {
    this._timePerLane = 60;
    this._interval = 10;

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

  setData({ timePerLane, interval }) {
    this._timePerLane = timePerLane !== undefined ? timePerLane : 60;
    this._interval = interval !== undefined ? interval : 10;
    this.render();
  }

  getData() {
    const timeInput = this.querySelector("#race-time-per-lane");
    const intervalInput = this.querySelector("#race-interval");
    return {
      timePerLane: parseInt(timeInput?.value) || 60,
      interval: parseInt(intervalInput?.value) || 10
    };
  }

  render() {
    this.innerHTML = `
      <!-- Race Config Mini Modal -->
      <div class="modal fade" id="modal-race-config" tabindex="-1" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1060; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle py-2">
              <h6 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                <i class="mdi mdi-cog fs-5 text-primary"></i>
                Configurações da Corrida
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              
              <!-- Time per lane -->
              <div class="mb-3">
                <label for="race-time-per-lane" class="form-label text-body-secondary small fw-semibold">Tempo por Fenda</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-clock-outline"></i></span>
                  <input type="number" id="race-time-per-lane" class="form-control border-secondary-subtle text-end px-2" min="1" step="1" value="${this._timePerLane}" style="box-shadow: none; outline: none;">
                  <span class="input-group-text text-secondary border-secondary-subtle">s</span>
                </div>
              </div>

              <!-- Interval -->
              <div class="mb-0">
                <label for="race-interval" class="form-label text-body-secondary small fw-semibold">Intervalo</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-timer-sand"></i></span>
                  <input type="number" id="race-interval" class="form-control border-secondary-subtle text-end px-2" min="0" step="1" value="${this._interval}" style="box-shadow: none; outline: none;">
                  <span class="input-group-text text-secondary border-secondary-subtle">s</span>
                </div>
              </div>

            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="btn-save-race-config" class="btn btn-sm btn-primary fw-semibold px-3" data-bs-dismiss="modal">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const btnSave = this.querySelector("#btn-save-race-config");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const data = this.getData();
        window.dispatchEvent(new CustomEvent("raceConfigSaved", {
          detail: data
        }));
      });
    }
  }
}

customElements.define("slotrace-realtime-race-config-modal", SlotRaceRealtimeRaceConfigModal);

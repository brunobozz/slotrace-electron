class SlotRaceRealtimeQualiConfigModal extends HTMLElement {
  constructor() {
    super();
    this._timePerPilot = 60;
    this._interval = 10;
    this._lane = 1;
    this._track = null;
  }

  connectedCallback() {
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

  setData({ timePerPilot, interval, lane, track }) {
    this._timePerPilot = timePerPilot !== undefined ? timePerPilot : 60;
    this._interval = interval !== undefined ? interval : 10;
    this._lane = lane !== undefined ? lane : 1;
    this._track = track || null;
    this.render();
  }

  getData() {
    const timeInput = this.querySelector("#quali-config-time");
    const intervalInput = this.querySelector("#quali-config-interval");
    const laneSelect = this.querySelector("#quali-config-lane");
    return {
      timePerPilot: parseInt(timeInput?.value) || 60,
      interval: parseInt(intervalInput?.value) || 10,
      lane: parseInt(laneSelect?.value) || 1
    };
  }

  render() {
    const laneCount = parseInt(this._track?.lanes) || 0;
    const laneColors = this._track?.laneColors || [];

    const defaultColors = [
      "#ff3b30",
      "#007aff",
      "#34c759",
      "#ffcc00",
      "#ff9500",
      "#ffffff",
      "#af52de",
      "#8e8e93",
    ];

    let laneOptions = "";
    for (let i = 1; i <= laneCount; i++) {
      const colorHex =
        laneColors[i - 1] || defaultColors[(i - 1) % defaultColors.length];
      const isSelected = i === parseInt(this._lane) ? "selected" : "";
      laneOptions += `<option value="${i}" style="color: ${colorHex}; font-weight: bold;" ${isSelected}>${window.t("realtime_quali.toolbar.lane") || "Fenda"} ${i}</option>`;
    }

    this.innerHTML = `
      <!-- Quali Config Mini Modal -->
      <div class="modal fade" id="modal-quali-config" tabindex="-1" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1060; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle py-2">
              <h6 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                <i class="mdi mdi-cog fs-5 text-primary"></i>
                Configurações da Qualificação
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              
              <!-- Time per pilot -->
              <div class="mb-3">
                <label for="quali-config-time" class="form-label text-body-secondary small fw-semibold">Tempo por Piloto</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-clock-outline"></i></span>
                  <input type="number" id="quali-config-time" class="form-control border-secondary-subtle text-end px-2" min="1" step="1" value="${this._timePerPilot}" style="box-shadow: none; outline: none;">
                  <span class="input-group-text text-secondary border-secondary-subtle">s</span>
                </div>
              </div>

              <!-- Interval -->
              <div class="mb-3">
                <label for="quali-config-interval" class="form-label text-body-secondary small fw-semibold">Intervalo</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-timer-sand"></i></span>
                  <input type="number" id="quali-config-interval" class="form-control border-secondary-subtle text-end px-2" min="0" step="1" value="${this._interval}" style="box-shadow: none; outline: none;">
                  <span class="input-group-text text-secondary border-secondary-subtle">s</span>
                </div>
              </div>

              <!-- Lane -->
              <div class="mb-0">
                <label for="quali-config-lane" class="form-label text-body-secondary small fw-semibold">Fenda</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-road-variant"></i></span>
                  <select id="quali-config-lane" class="form-select border-secondary-subtle px-2" style="box-shadow: none; font-weight: bold;">
                    ${laneOptions}
                  </select>
                </div>
              </div>

            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="btn-save-quali-config" class="btn btn-sm btn-primary fw-semibold px-3" data-bs-dismiss="modal">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._updateLaneSelectColor();
  }

  _bindEvents() {
    const btnSave = this.querySelector("#btn-save-quali-config");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const data = this.getData();
        window.dispatchEvent(new CustomEvent("qualiConfigSaved", {
          detail: data
        }));
      });
    }

    const laneSelect = this.querySelector("#quali-config-lane");
    if (laneSelect) {
      laneSelect.addEventListener("change", () => {
        this._updateLaneSelectColor();
      });
    }
  }

  _updateLaneSelectColor() {
    const select = this.querySelector("#quali-config-lane");
    if (!select) return;

    const laneColors = this._track?.laneColors || [];
    const defaultColors = [
      "#ff3b30",
      "#007aff",
      "#34c759",
      "#ffcc00",
      "#ff9500",
      "#ffffff",
      "#af52de",
      "#8e8e93",
    ];

    const val = parseInt(select.value) || 1;
    const activeColor =
      laneColors[val - 1] ||
      defaultColors[(val - 1) % defaultColors.length] ||
      "#ffffff";
    select.style.color = activeColor;
  }
}

customElements.define("slotrace-realtime-quali-config-modal", SlotRaceRealtimeQualiConfigModal);

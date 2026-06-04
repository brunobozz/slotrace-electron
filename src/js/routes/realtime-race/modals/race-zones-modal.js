class SlotRaceRealtimeRaceZonesModal extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <!-- Stopped Zone Modal (for pilot exiting to DECK) -->
      <div class="modal fade text-white" id="modal-stopped-zone" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="z-index: 1070; background: rgba(0,0,0,0.55);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary" style="background-color: var(--bs-body-bg);">
            <div class="modal-header border-secondary-subtle">
              <h5 class="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                <i class="mdi mdi-ray-start-arrow fs-4"></i>
                Piloto Deixando a Pista (DECK)
              </h5>
            </div>
            <div class="modal-body">
              <div class="text-body-emphasis mb-3">
                O piloto <strong id="stopped-pilot-name" class="text-white fs-5"></strong> na 
                <strong id="stopped-pilot-lane" class="text-warning fs-5"></strong> está saindo para o DECK. 
                Por favor, informe a zona onde o carro parou para que ele volte na mesma posição posteriormente:
              </div>
              <div class="mb-3">
                <label for="stopped-pilot-zone-input" class="form-label text-body-secondary small fw-semibold">Zona de Parada (Número)</label>
                <div class="input-group">
                  <span class="input-group-text bg-body-secondary border-secondary-subtle text-secondary">
                    <i class="mdi mdi-flag-triangle"></i>
                  </span>
                  <input type="number" id="stopped-pilot-zone-input" class="form-control text-end fs-4 fw-bold border-secondary-subtle bg-body-tertiary text-white shadow-none" min="0" value="0">
                </div>
              </div>
            </div>
            <div class="modal-footer border-secondary-subtle">
              <button type="button" id="btn-confirm-stopped-zone" class="btn btn-warning text-dark fw-bold px-4 rounded-pill">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Zone Modal (for individual pilot completing race) -->
      <div class="modal fade text-white" id="modal-final-zone-single" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="z-index: 1070; background: rgba(0,0,0,0.55);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary" style="background-color: var(--bs-body-bg);">
            <div class="modal-header border-secondary-subtle">
              <h5 class="modal-title fw-bold text-success d-flex align-items-center gap-2">
                <i class="mdi mdi-trophy-outline fs-4"></i>
                Piloto Concluiu a Corrida
              </h5>
            </div>
            <div class="modal-body">
              <div class="text-body-emphasis mb-3">
                O piloto <strong id="final-pilot-name-single" class="text-white fs-5"></strong> na 
                <strong id="final-pilot-lane-single" class="text-success fs-5"></strong> concluiu sua última fenda. 
                Por favor, informe a zona final onde o carro terminou a corrida (usado como critério de desempate):
              </div>
              <div class="mb-3">
                <label for="final-pilot-zone-input-single" class="form-label text-body-secondary small fw-semibold">Zona Final de Corrida</label>
                <div class="input-group">
                  <span class="input-group-text bg-body-secondary border-secondary-subtle text-secondary">
                    <i class="mdi mdi-flag-checkered"></i>
                  </span>
                  <input type="number" id="final-pilot-zone-input-single" class="form-control text-end fs-4 fw-bold border-secondary-subtle bg-body-tertiary text-white shadow-none" min="0" value="0">
                </div>
              </div>
            </div>
            <div class="modal-footer border-secondary-subtle">
              <button type="button" id="btn-confirm-final-zone-single" class="btn btn-success fw-bold px-4 rounded-pill">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Session Zones Modal (at end of last battery for all remaining pilots) -->
      <div class="modal fade text-white" id="modal-final-zones-multiple" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false" style="z-index: 1070; background: rgba(0,0,0,0.55);">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-secondary" style="background-color: var(--bs-body-bg);">
            <div class="modal-header border-secondary-subtle">
              <h5 class="modal-title fw-bold text-success d-flex align-items-center gap-2">
                <i class="mdi mdi-flag-checkered fs-4"></i>
                Fim de Corrida - Zonas de Chegada
              </h5>
            </div>
            <div class="modal-body">
              <p class="text-body-secondary mb-4 small">
                A corrida terminou! Por favor, insira a zona final de chegada de cada piloto que terminou correndo na pista para calcular a classificação final:
              </p>
              <div id="final-zones-list-container" class="d-flex flex-column gap-3">
                <!-- Dynamically populated rows -->
              </div>
            </div>
            <div class="modal-footer border-secondary-subtle">
              <button type="button" id="btn-confirm-final-zones-multiple" class="btn btn-success fw-bold px-4 rounded-pill">
                Finalizar Classificação
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showStoppedZoneModal({ pilotName, laneName, callback }) {
    const modalEl = this.querySelector("#modal-stopped-zone");
    const nameEl = this.querySelector("#stopped-pilot-name");
    const laneEl = this.querySelector("#stopped-pilot-lane");
    const inputEl = this.querySelector("#stopped-pilot-zone-input");
    const confirmBtn = this.querySelector("#btn-confirm-stopped-zone");

    if (!modalEl || !nameEl || !laneEl || !inputEl || !confirmBtn) return;

    nameEl.textContent = pilotName;
    laneEl.textContent = laneName;
    inputEl.value = 0;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Handle confirm click
    const handleConfirm = () => {
      const zone = parseFloat(inputEl.value) || 0;
      modal.hide();
      confirmBtn.removeEventListener("click", handleConfirm);
      if (callback) callback(zone);
    };

    confirmBtn.addEventListener("click", handleConfirm);
  }

  showFinalZoneModal({ pilotName, laneName, callback }) {
    const modalEl = this.querySelector("#modal-final-zone-single");
    const nameEl = this.querySelector("#final-pilot-name-single");
    const laneEl = this.querySelector("#final-pilot-lane-single");
    const inputEl = this.querySelector("#final-pilot-zone-input-single");
    const confirmBtn = this.querySelector("#btn-confirm-final-zone-single");

    if (!modalEl || !nameEl || !laneEl || !inputEl || !confirmBtn) return;

    nameEl.textContent = pilotName;
    laneEl.textContent = laneName;
    inputEl.value = 0;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const handleConfirm = () => {
      const zone = parseFloat(inputEl.value) || 0;
      modal.hide();
      confirmBtn.removeEventListener("click", handleConfirm);
      if (callback) callback(zone);
    };

    confirmBtn.addEventListener("click", handleConfirm);
  }

  showFinalSessionZonesModal({ activePilots, callback }) {
    const modalEl = this.querySelector("#modal-final-zones-multiple");
    const container = this.querySelector("#final-zones-list-container");
    const confirmBtn = this.querySelector("#btn-confirm-final-zones-multiple");

    if (!modalEl || !container || !confirmBtn) return;

    container.innerHTML = activePilots
      .map((p) => {
        return `
        <div class="row align-items-center bg-body-tertiary rounded p-3 border border-secondary-subtle mx-0" data-pilot-id="${p.pilotId}">
          <div class="col-6 d-flex align-items-center gap-3">
            <div class="rounded-circle overflow-hidden bg-body-secondary flex-shrink-0 border border-secondary-subtle" style="width: 44px; height: 44px;">
              ${
                p.photo
                  ? `<img src="${p.photo}" class="w-100 h-100 object-fit-cover">`
                  : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary fs-4"></i></div>`
              }
            </div>
            <div>
              <div class="fw-bold text-body-emphasis fs-5">${p.name}</div>
              <div class="text-secondary small fw-semibold">${p.carName || "Sem carro"}</div>
            </div>
          </div>
          <div class="col-3">
            <span class="badge px-3 py-2 fw-semibold w-100 border text-uppercase" style="border-color: ${p.laneColor} !important; color: ${p.laneColor} !important;">
              ${p.laneName}
            </span>
          </div>
          <div class="col-3">
            <input type="number" class="form-control text-end fs-5 fw-bold bg-body-secondary text-white border-secondary-subtle pilot-zone-multiple shadow-none" data-pilot-id="${p.pilotId}" min="0" value="0">
          </div>
        </div>
      `;
      })
      .join("");

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    const handleConfirm = () => {
      const inputs = container.querySelectorAll(".pilot-zone-multiple");
      const results = {};
      inputs.forEach((input) => {
        const pilotId = input.dataset.pilotId;
        const val = parseFloat(input.value) || 0;
        results[pilotId] = val;
      });
      modal.hide();
      confirmBtn.removeEventListener("click", handleConfirm);
      if (callback) callback(results);
    };

    confirmBtn.addEventListener("click", handleConfirm);
  }
}

customElements.define("slotrace-realtime-race-zones-modal", SlotRaceRealtimeRaceZonesModal);

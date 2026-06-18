class SlotRaceRealtimeRaceResetConfirmModal extends HTMLElement {
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

  render() {
    this.innerHTML = `
      <!-- Race Reset Confirm Modal -->
      <div class="modal fade" id="modal-race-reset-confirm" tabindex="-1" aria-hidden="true" data-bs-backdrop="false" style="z-index: 1065; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-danger">
            <div class="modal-header border-danger py-2 bg-danger-subtle">
              <h6 class="modal-title fw-bold text-danger d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                <i class="mdi mdi-alert-circle fs-5"></i>
                Zerar Corrida
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3">
              <p class="mb-0 text-body-secondary small">
                Tem certeza que deseja zerar a corrida? Todas as voltas e tempos acumulados serão apagados!
              </p>
            </div>
            <div class="modal-footer border-secondary-subtle py-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="btn-confirm-race-reset" class="btn btn-sm btn-danger fw-semibold px-3" data-bs-dismiss="modal">Zerar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const btnConfirm = this.querySelector("#btn-confirm-race-reset");
    if (btnConfirm) {
      btnConfirm.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("raceSessionResetConfirmed"));
      });
    }
  }
}

customElements.define("slotrace-realtime-race-reset-confirm-modal", SlotRaceRealtimeRaceResetConfirmModal);

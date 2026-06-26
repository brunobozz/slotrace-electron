class SlotRaceConfirmModal extends HTMLElement {
  constructor() {
    super();
    this.resolvePromise = null;
    this.bsModal = null;
  }

  connectedCallback() {
    this.render();
    
    const modalEl = this.querySelector(".modal");
    this.bsModal = new bootstrap.Modal(modalEl, {
      backdrop: false,
      keyboard: false
    });

    // Wire up events
    const confirmBtn = this.querySelector(".btn-confirm");
    confirmBtn.addEventListener("click", () => {
      this.bsModal.hide();
      if (this.resolvePromise) {
        this.resolvePromise(true);
        this.resolvePromise = null;
      }
    });

    const modalCloseButtons = this.querySelectorAll('[data-bs-dismiss="modal"]');
    modalCloseButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.resolvePromise) {
          this.resolvePromise(false);
          this.resolvePromise = null;
        }
      });
    });
  }

  show({
    title = "",
    message = "",
    theme = "primary",
    icon = "",
    cancelBtnText = "Cancelar",
    confirmBtnText = "Confirmar",
    confirmBtnIcon = ""
  }) {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;

      const titleEl = this.querySelector(".modal-title-text");
      const iconEl = this.querySelector(".modal-title-icon");
      const bodyEl = this.querySelector(".modal-body-content");
      const cancelBtn = this.querySelector(".btn-cancel");
      const confirmBtn = this.querySelector(".btn-confirm");

      if (titleEl) titleEl.textContent = title;
      if (iconEl) {
        iconEl.className = `modal-title-icon mdi ${icon || "mdi-help-circle"} text-${theme} fs-5`;
      }
      if (bodyEl) {
        bodyEl.innerHTML = message;
      }

      if (cancelBtn) {
        cancelBtn.textContent = cancelBtnText;
      }

      if (confirmBtn) {
        confirmBtn.className = `btn btn-sm btn-${theme} fw-semibold btn-confirm d-inline-flex align-items-center justify-content-center gap-1`;
        confirmBtn.innerHTML = `
          ${confirmBtnIcon ? `<i class="mdi ${confirmBtnIcon}" style="font-size: 1rem; line-height: 1;"></i>` : ""}
          <span>${confirmBtnText}</span>
        `;
      }

      this.bsModal.show();
    });
  }

  render() {
    this.innerHTML = `
      <style>
        slotrace-confirm-modal .modal-content {
          border: 1px solid var(--bs-border-color-translucent) !important;
          border-radius: var(--bs-modal-border-radius) !important;
        }
      </style>
      <div class="modal fade" tabindex="-1" aria-hidden="true" style="z-index: 1065; background: rgba(0, 0, 0, 0.5);">
        <div class="modal-dialog modal-dialog-centered modal-md">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle py-2.5">
              <h6 class="modal-title fw-bold text-light d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                <i class="modal-title-icon mdi fs-5"></i>
                <span class="modal-title-text"></span>
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-start py-3 text-body-emphasis small modal-body-content" style="line-height: 1.5;">
              <!-- Dynamically populated -->
            </div>
            <div class="modal-footer border-0 py-2 pt-0 justify-content-end gap-1">
              <button type="button" class="btn btn-sm btn-confirm fw-semibold d-inline-flex align-items-center justify-content-center"></button>
              <button type="button" class="btn btn-sm btn-secondary fw-semibold btn-cancel d-inline-flex align-items-center justify-content-center" data-bs-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-confirm-modal", SlotRaceConfirmModal);

// Global promise-based confirmation service
window.confirmModal = function (options) {
  let confirmModal = document.getElementById("global-confirm-modal");
  if (!confirmModal) {
    confirmModal = document.createElement("slotrace-confirm-modal");
    confirmModal.id = "global-confirm-modal";
    document.body.appendChild(confirmModal);
  }
  return confirmModal.show(options);
};

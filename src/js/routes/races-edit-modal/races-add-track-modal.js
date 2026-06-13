class SlotRaceRegistrationsRacesAddTrackModal extends HTMLElement {
  constructor() {
    super();
    this.tracks = [];
    this.selectedTrackId = null;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
      this.populateTracks();
    };

    this._openSelectTrackListener = (e) => {
      const { tracks, selectedTrackId } = e.detail;
      this.tracks = tracks || [];
      this.selectedTrackId = selectedTrackId || null;

      this.populateTracks();

      const modalEl = this.querySelector("#modal-race-select-track");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("requestOpenSelectTrack", this._openSelectTrackListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._openSelectTrackListener) {
      window.removeEventListener(
        "requestOpenSelectTrack",
        this._openSelectTrackListener,
      );
    }
  }

  populateTracks() {
    const grid = this.querySelector("#tracks-grid-container");
    if (!grid) return;

    grid.innerHTML = "";

    if (this.tracks.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center text-secondary py-5">
          <i class="mdi mdi-go-kart-track fs-1 d-block mb-2"></i>
          Nenhuma pista cadastrada
        </div>
      `;
      return;
    }

    this.tracks.forEach((track) => {
      const isSelected = String(this.selectedTrackId) === String(track.id);

      const col = document.createElement("div");
      col.className = "col";

      col.innerHTML = `
        <div class="card h-100 bg-body-tertiary border-${
          isSelected ? "primary border-3" : "secondary-subtle"
        } shadow-sm position-relative overflow-hidden cursor-pointer track-select-card" style="cursor: pointer; transition: transform 0.2s ease;">
          <div class="ratio ratio-16x9 bg-body-secondary position-relative">
            ${
              track.photo
                ? `<img src="${track.photo}" class="w-100 h-100 object-fit-cover">`
                : `<div class="w-100 h-100 d-flex align-items-center justify-content-center">
                     <i class="mdi mdi-go-kart-track text-secondary fs-1"></i>
                   </div>`
            }
            ${
              isSelected
                ? `<div class="position-absolute top-0 end-0 bg-primary text-white p-1 rounded-bottom-start shadow-sm d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; border-bottom-left-radius: 6px;">
                     <i class="mdi mdi-check fw-bold"></i>
                   </div>`
                : ""
            }
          </div>
          <div class="card-body p-2 text-center">
            <h6 class="fw-bold text-body-emphasis mb-0 text-truncate" style="font-size: 0.9rem;">${track.name}</h6>
          </div>
        </div>
      `;

      col.querySelector(".track-select-card").addEventListener("click", () => {
        if (String(this.selectedTrackId) === String(track.id)) {
          this.selectedTrackId = null;
        } else {
          this.selectedTrackId = track.id;
        }
        this.populateTracks();
      });

      grid.appendChild(col);
    });
  }

  setupEvents() {
    const confirmBtn = this.querySelector("#btn-confirm-select-track");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("raceTrackSelected", {
            detail: {
              trackId: this.selectedTrackId,
            },
          }),
        );

        const modalEl = this.querySelector("#modal-race-select-track");
        if (modalEl) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) {
            modalInstance.hide();
          }
        }
      });
    }
  }

  render() {
    this.innerHTML = `
      <!-- Modal to Select Track -->
      <div class="modal fade" id="modal-race-select-track" tabindex="-1" aria-labelledby="modal-race-select-track-title" aria-hidden="true" style="background: rgba(0,0,0,0.45); z-index: 1065;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content border-secondary-subtle shadow-lg">
            <div class="modal-header border-secondary-subtle bg-body-tertiary py-2.5 px-3">
              <h6 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-1" id="modal-race-select-track-title" style="font-size: 0.95rem;">
                <i class="mdi mdi-go-kart-track text-primary fs-5"></i>
                Selecionar Pista
              </h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="font-size: 0.7rem;"></button>
            </div>
            <div class="modal-body p-3 overflow-y-auto" style="max-height: 450px;">
              <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3" id="tracks-grid-container">
                <!-- Tracks rendered dynamically -->
              </div>
            </div>
            <div class="modal-footer border-secondary-subtle py-2 px-3 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-secondary fw-semibold" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" id="btn-confirm-select-track" class="btn btn-sm btn-primary fw-semibold px-3 d-flex align-items-center gap-1">
                <i class="mdi mdi-check"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-registrations-races-add-track-modal",
  SlotRaceRegistrationsRacesAddTrackModal,
);

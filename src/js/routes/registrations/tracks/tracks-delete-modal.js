class SlotRaceRegistrationsTracksDeleteModal extends HTMLElement {
  connectedCallback() {
    this.trackId = '';
    this.trackName = '';

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.trackId = id;
      this.trackName = name;

      const nameEl = this.querySelector('#delete-track-name');
      if (nameEl) {
        nameEl.textContent = name;
      }

      const modalEl = this.querySelector('#modal-delete-track');
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestDeleteTrack', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteTrack', this._deleteRequestListener);
    }
  }

  setupEvents() {
    const confirmBtn = this.querySelector('#btn-confirm-delete-track');
    const modalEl = this.querySelector('#modal-delete-track');

    if (confirmBtn && modalEl) {
      confirmBtn.addEventListener('click', () => {
        if (!this.trackId) return;

        window.electronAPI.db.get('tracks').then(tracks => {
          const tracksList = tracks || [];
          const updatedList = tracksList.filter(t => t.id !== this.trackId);
          return window.electronAPI.db.set('tracks', updatedList);
        }).then(success => {
          if (success) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            window.dispatchEvent(new CustomEvent('trackAdded'));
          }
        }).catch(err => {
          console.error('Failed to delete track from database:', err);
        });
      });
    }
  }

  render() {
    this.innerHTML = `
      <div class="modal fade" id="modal-delete-track" tabindex="-1" aria-labelledby="modal-delete-track-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-delete-track-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-alert-circle text-danger fs-4"></i>
                ${window.t('registrations.tracks_modal.delete_title') || 'Delete Track'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body text-start py-3 fs-6">
              <p class="mb-0 text-body-secondary">
                ${window.t('registrations.tracks_modal.delete_confirm_prefix') || 'Are you sure you want to delete the track '}<strong class="text-danger fw-bold" id="delete-track-name">${this.trackName}</strong>${window.t('registrations.tracks_modal.delete_confirm_suffix') || '? This action cannot be undone.'}
              </p>
            </div>
            
            <div class="d-flex justify-content-end gap-2 p-3">
              <button type="button" class="btn btn-secondary px-3 fw-semibold" data-bs-dismiss="modal">
                ${window.t('registrations.tracks_modal.cancel_button') || 'Cancel'}
              </button>
              <button type="button" id="btn-confirm-delete-track" class="btn btn-danger px-3 fw-semibold d-flex align-items-center gap-2">
                <i class="mdi mdi-trash-can-outline fs-5"></i>
                ${window.t('registrations.tracks_modal.delete_button_confirm') || 'Delete'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-tracks-delete-modal', SlotRaceRegistrationsTracksDeleteModal);

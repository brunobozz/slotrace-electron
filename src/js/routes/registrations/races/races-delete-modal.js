class SlotRaceRegistrationsRacesDeleteModal extends HTMLElement {
  connectedCallback() {
    this.raceId = '';
    this.raceName = '';

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.raceId = id;
      this.raceName = name;

      const nameEl = this.querySelector('#delete-race-name');
      if (nameEl) {
        nameEl.textContent = name;
      }

      const modalEl = this.querySelector('#modal-delete-race');
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestDeleteRace', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteRace', this._deleteRequestListener);
    }
  }

  setupEvents() {
    const confirmBtn = this.querySelector('#btn-confirm-delete-race');
    const modalEl = this.querySelector('#modal-delete-race');

    if (confirmBtn && modalEl) {
      confirmBtn.addEventListener('click', () => {
        if (!this.raceId) return;

        window.electronAPI.db.get('races').then(races => {
          const racesList = races || [];
          const updatedList = racesList.filter(r => r.id !== this.raceId);
          return window.electronAPI.db.set('races', updatedList);
        }).then(success => {
          if (success) {
            window.recalculateDriversRacesCount();
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            // Notify list and parent that a race has been deleted
            window.dispatchEvent(new CustomEvent('raceListChanged'));
          }
        }).catch(err => {
          console.error('Failed to delete race from database:', err);
        });
      });
    }
  }

  render() {
    this.innerHTML = `
      <div class="modal fade" id="modal-delete-race" tabindex="-1" aria-labelledby="modal-delete-race-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-delete-race-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-alert-circle text-danger fs-4"></i>
                ${window.t('registrations.races_modal.delete_title') || 'Excluir Corrida'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body text-start py-3 fs-6">
              <p class="mb-0 text-body-secondary">
                ${window.t('registrations.races_modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir a corrida '}<strong class="text-danger fw-bold" id="delete-race-name">${this.raceName}</strong>${window.t('registrations.races_modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita e removerá o registro do histórico.'}
              </p>
            </div>
            
            <div class="d-flex justify-content-end gap-2 p-3">
              <button type="button" class="btn btn-secondary px-3 fw-semibold" data-bs-dismiss="modal">
                ${window.t('registrations.modal.cancel_button') || 'Cancelar'}
              </button>
              <button type="button" id="btn-confirm-delete-race" class="btn btn-danger px-3 fw-semibold d-flex align-items-center gap-2">
                <i class="mdi mdi-trash-can-outline fs-5"></i>
                ${window.t('registrations.modal.delete_button_confirm') || 'Excluir'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-races-delete-modal', SlotRaceRegistrationsRacesDeleteModal);

class SlotRaceRegistrationsCarsDeleteModal extends HTMLElement {
  connectedCallback() {
    this.carId = '';
    this.carName = '';

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.carId = id;
      this.carName = name;

      const nameEl = this.querySelector('#delete-car-name');
      if (nameEl) {
        nameEl.textContent = name;
      }

      const modalEl = this.querySelector('#modal-delete-car');
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestDeleteCar', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteCar', this._deleteRequestListener);
    }
  }

  setupEvents() {
    const confirmBtn = this.querySelector('#btn-confirm-delete-car');
    const modalEl = this.querySelector('#modal-delete-car');

    if (confirmBtn && modalEl) {
      confirmBtn.addEventListener('click', () => {
        if (!this.carId) return;

        window.electronAPI.db.get('cars').then(cars => {
          const carsList = cars || [];
          const updatedList = carsList.filter(c => c.id !== this.carId);
          return window.electronAPI.db.set('cars', updatedList);
        }).then(success => {
          if (success) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            // Notify list to reload reactively
            window.dispatchEvent(new CustomEvent('carAdded'));
          }
        }).catch(err => {
          console.error('Failed to delete car from database:', err);
        });
      });
    }
  }

  render() {
    this.innerHTML = `
      <div class="modal fade" id="modal-delete-car" tabindex="-1" aria-labelledby="modal-delete-car-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-delete-car-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-alert-circle text-danger fs-4"></i>
                ${window.t('registrations.cars_modal.delete_title') || 'Delete Car'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body text-start py-3 fs-6">
              <p class="mb-0 text-body-secondary">
                ${window.t('registrations.cars_modal.delete_confirm_prefix') || 'Are you sure you want to delete the car '}<strong class="text-danger fw-bold" id="delete-car-name">${this.carName}</strong>${window.t('registrations.cars_modal.delete_confirm_suffix') || '? This action cannot be undone.'}
              </p>
            </div>
            
            <div class="d-flex justify-content-end gap-2 p-3">
              <button type="button" class="btn btn-secondary px-3 fw-semibold" data-bs-dismiss="modal">
                ${window.t('registrations.cars_modal.cancel_button') || 'Cancel'}
              </button>
              <button type="button" id="btn-confirm-delete-car" class="btn btn-danger px-3 fw-semibold d-flex align-items-center gap-2">
                <i class="mdi mdi-trash-can-outline fs-5"></i>
                ${window.t('registrations.cars_modal.delete_button_confirm') || 'Delete'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-cars-delete-modal', SlotRaceRegistrationsCarsDeleteModal);

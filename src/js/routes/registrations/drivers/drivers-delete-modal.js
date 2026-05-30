class SlotRaceRegistrationsDriversDeleteModal extends HTMLElement {
  connectedCallback() {
    this.driverId = '';
    this.driverName = '';
    
    this.render();
    this.setupEvents();
    
    this._langListener = () => {
      this.render();
      this.setupEvents();
    };
    
    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.driverId = id;
      this.driverName = name;
      
      const nameEl = this.querySelector('#delete-driver-name');
      if (nameEl) {
        nameEl.textContent = name;
      }
      
      const modalEl = this.querySelector('#modal-delete-driver');
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      }
    };
    
    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestDeleteDriver', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteDriver', this._deleteRequestListener);
    }
  }

  setupEvents() {
    const confirmBtn = this.querySelector('#btn-confirm-delete');
    const modalEl = this.querySelector('#modal-delete-driver');
    
    if (confirmBtn && modalEl) {
      confirmBtn.addEventListener('click', () => {
        if (!this.driverId) return;
        
        window.electronAPI.db.get('drivers').then(drivers => {
          const driversList = drivers || [];
          const updatedList = driversList.filter(d => d.id !== this.driverId);
          return window.electronAPI.db.set('drivers', updatedList);
        }).then(success => {
          if (success) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            // Notify list to reload reactively
            window.dispatchEvent(new CustomEvent('driverAdded'));
          }
        }).catch(err => {
          console.error('Failed to delete driver from database:', err);
        });
      });
    }
  }

  render() {
    this.innerHTML = `
      <div class="modal fade" id="modal-delete-driver" tabindex="-1" aria-labelledby="modal-delete-driver-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-delete-driver-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-alert-circle text-danger fs-4"></i>
                ${window.t('registrations.modal.delete_title')}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body text-start py-3 fs-6">
              <p class="mb-0 text-body-secondary">
                ${window.t('registrations.modal.delete_confirm_prefix')}<strong class="text-danger fw-bold" id="delete-driver-name">${this.driverName}</strong>${window.t('registrations.modal.delete_confirm_suffix')}
              </p>
            </div>
            
            <div class="d-flex justify-content-end gap-2 p-3">
              <button type="button" class="btn btn-secondary px-3 py-2 fw-semibold btn-sm" data-bs-dismiss="modal">
                ${window.t('registrations.modal.cancel_button')}
              </button>
              <button type="button" id="btn-confirm-delete" class="btn btn-danger px-3 py-2 fw-semibold d-flex align-items-center gap-2 btn-sm">
                <i class="mdi mdi-trash-can-outline fs-5"></i>
                ${window.t('registrations.modal.delete_button_confirm')}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-drivers-delete-modal', SlotRaceRegistrationsDriversDeleteModal);

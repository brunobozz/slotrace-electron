class SlotRaceRegistrationsCarsDeleteModal extends HTMLElement {
  connectedCallback() {
    this.carId = '';
    this.carName = '';

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.carId = id;
      this.carName = name;

      window.confirmModal({
        title: window.t('registrations.cars_modal.delete_title') || 'Excluir Carro',
        message: `${window.t('registrations.cars_modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir o carro '}<strong class="text-danger fw-bold">${name}</strong>${window.t('registrations.cars_modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita.'}`,
        theme: 'danger',
        icon: 'mdi-alert-circle',
        cancelBtnText: window.t('registrations.cars_modal.cancel_button') || 'Cancelar',
        confirmBtnText: window.t('registrations.cars_modal.delete_button_confirm') || 'Excluir',
        confirmBtnIcon: 'mdi-trash-can-outline'
      }).then((confirmed) => {
        if (confirmed) {
          this.deleteCar();
        }
      });
    };

    window.addEventListener('requestDeleteCar', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteCar', this._deleteRequestListener);
    }
  }

  deleteCar() {
    if (!this.carId) return;

    window.electronAPI.db.get('cars').then(cars => {
      const carsList = cars || [];
      const updatedList = carsList.filter(c => c.id !== this.carId);
      return window.electronAPI.db.set('cars', updatedList);
    }).then(success => {
      if (success) {
        // Notify list to reload reactively
        window.dispatchEvent(new CustomEvent('carAdded'));
      }
    }).catch(err => {
      console.error('Failed to delete car from database:', err);
    });
  }
}

customElements.define('slotrace-registrations-cars-delete-modal', SlotRaceRegistrationsCarsDeleteModal);

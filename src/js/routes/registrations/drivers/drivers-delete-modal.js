class SlotRaceRegistrationsDriversDeleteModal extends HTMLElement {
  connectedCallback() {
    this.driverId = '';
    this.driverName = '';

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.driverId = id;
      this.driverName = name;

      window.confirmModal({
        title: window.t('registrations.modal.delete_title') || 'Excluir Piloto',
        message: `${window.t('registrations.modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir o piloto '}<strong class="text-danger fw-bold">${name}</strong>${window.t('registrations.modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita.'}`,
        theme: 'danger',
        icon: 'mdi-alert-circle',
        cancelBtnText: window.t('registrations.modal.cancel_button') || 'Cancelar',
        confirmBtnText: window.t('registrations.modal.delete_button_confirm') || 'Excluir',
        confirmBtnIcon: 'mdi-trash-can-outline'
      }).then((confirmed) => {
        if (confirmed) {
          this.deleteDriver();
        }
      });
    };

    window.addEventListener('requestDeleteDriver', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteDriver', this._deleteRequestListener);
    }
  }

  deleteDriver() {
    if (!this.driverId) return;

    window.electronAPI.db.get('drivers').then(drivers => {
      const driversList = drivers || [];
      const updatedList = driversList.filter(d => d.id !== this.driverId);
      return window.electronAPI.db.set('drivers', updatedList);
    }).then(success => {
      if (success) {
        // Notify list to reload reactively
        window.dispatchEvent(new CustomEvent('driverAdded'));
      }
    }).catch(err => {
      console.error('Failed to delete driver from database:', err);
    });
  }
}

customElements.define('slotrace-registrations-drivers-delete-modal', SlotRaceRegistrationsDriversDeleteModal);

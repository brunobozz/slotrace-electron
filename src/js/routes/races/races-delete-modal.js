class SlotRaceRegistrationsRacesDeleteModal extends HTMLElement {
  connectedCallback() {
    this.raceId = '';
    this.raceName = '';

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.raceId = id;
      this.raceName = name;

      window.confirmModal({
        title: window.t('registrations.races_modal.delete_title') || 'Excluir Corrida',
        message: `${window.t('registrations.races_modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir a corrida '}<strong class="text-danger fw-bold">${name}</strong>${window.t('registrations.races_modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita e removerá o registro do histórico.'}`,
        theme: 'danger',
        icon: 'mdi-alert-circle',
        cancelBtnText: window.t('registrations.modal.cancel_button') || 'Cancelar',
        confirmBtnText: window.t('registrations.modal.delete_button_confirm') || 'Excluir',
        confirmBtnIcon: 'mdi-trash-can-outline'
      }).then((confirmed) => {
        if (confirmed) {
          this.deleteRace();
        }
      });
    };

    window.addEventListener('requestDeleteRace', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteRace', this._deleteRequestListener);
    }
  }

  deleteRace() {
    if (!this.raceId) return;

    window.electronAPI.db.get('races').then(races => {
      const racesList = races || [];
      const updatedList = racesList.filter(r => r.id !== this.raceId);
      return window.electronAPI.db.set('races', updatedList);
    }).then(success => {
      if (success) {
        window.recalculateDriversRacesCount();
        window.dispatchEvent(new CustomEvent('raceListChanged'));
      }
    }).catch(err => {
      console.error('Failed to delete race from database:', err);
    });
  }
}

customElements.define('slotrace-registrations-races-delete-modal', SlotRaceRegistrationsRacesDeleteModal);

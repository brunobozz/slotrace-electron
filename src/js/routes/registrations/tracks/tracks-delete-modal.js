class SlotRaceRegistrationsTracksDeleteModal extends HTMLElement {
  connectedCallback() {
    this.trackId = '';
    this.trackName = '';

    this._deleteRequestListener = (e) => {
      const { id, name } = e.detail;
      this.trackId = id;
      this.trackName = name;

      window.confirmModal({
        title: window.t('registrations.tracks_modal.delete_title') || 'Excluir Pista',
        message: `${window.t('registrations.tracks_modal.delete_confirm_prefix') || 'Tem certeza de que deseja excluir a pista '}<strong class="text-danger fw-bold">${name}</strong>${window.t('registrations.tracks_modal.delete_confirm_suffix') || '? Esta ação não poderá ser desfeita.'}`,
        theme: 'danger',
        icon: 'mdi-alert-circle',
        cancelBtnText: window.t('registrations.tracks_modal.cancel_button') || 'Cancelar',
        confirmBtnText: window.t('registrations.tracks_modal.delete_button_confirm') || 'Excluir',
        confirmBtnIcon: 'mdi-trash-can-outline'
      }).then((confirmed) => {
        if (confirmed) {
          this.deleteTrack();
        }
      });
    };

    window.addEventListener('requestDeleteTrack', this._deleteRequestListener);
  }

  disconnectedCallback() {
    if (this._deleteRequestListener) {
      window.removeEventListener('requestDeleteTrack', this._deleteRequestListener);
    }
  }

  deleteTrack() {
    if (!this.trackId) return;

    window.electronAPI.db.get('tracks').then(tracks => {
      const tracksList = tracks || [];
      const updatedList = tracksList.filter(t => t.id !== this.trackId);
      return window.electronAPI.db.set('tracks', updatedList);
    }).then(success => {
      if (success) {
        window.dispatchEvent(new CustomEvent('trackAdded'));
      }
    }).catch(err => {
      console.error('Failed to delete track from database:', err);
    });
  }
}

customElements.define('slotrace-registrations-tracks-delete-modal', SlotRaceRegistrationsTracksDeleteModal);

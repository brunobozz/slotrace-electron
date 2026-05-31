class SlotRaceRegistrationsTracksList extends HTMLElement {
  connectedCallback() {
    this.tracks = [];
    this.drivers = [];
    this.filterQuery = '';

    this.loadTracks();

    this._langListener = () => this.render();
    this._addedListener = () => this.loadTracks();
    this._filterListener = (e) => {
      this.filterQuery = e.detail.query;
      this.render();
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('trackAdded', this._addedListener);
    window.addEventListener('driverAdded', this._addedListener);
    window.addEventListener('trackFilterChanged', this._filterListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._addedListener) {
      window.removeEventListener('trackAdded', this._addedListener);
      window.removeEventListener('driverAdded', this._addedListener);
    }
    if (this._filterListener) {
      window.removeEventListener('trackFilterChanged', this._filterListener);
    }
  }

  loadTracks() {
    Promise.all([
      window.electronAPI.db.get('tracks'),
      window.electronAPI.db.get('drivers')
    ]).then(([tracks, drivers]) => {
      this.tracks = (tracks || []).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
      this.drivers = drivers || [];
      this.render();
    }).catch(err => {
      console.error('Failed to load tracks and drivers lists:', err);
    });
  }

  render() {
    if (this.tracks.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-flag-checkered text-secondary fs-2 mb-3 d-block"></i>
          <h6 class="fw-bold text-body-emphasis mb-0">${window.t('registrations.no_tracks_listed') || 'Nenhuma pista cadastrada ainda.'}</h6>
        </div>
      `;
      return;
    }

    let filtered = this.tracks;
    if (this.filterQuery && this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase().trim();
      filtered = this.tracks.filter(track => {
        const name = (track.name || '').toLowerCase();
        return name.includes(q);
      });
    }

    if (filtered.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-magnify-close text-secondary fs-1 mb-3 d-block text-center"></i>
          <h5 class="fw-bold text-body-emphasis mb-0 text-center">${window.t('registrations.no_tracks_found') || 'Nenhuma pista encontrada para esta pesquisa.'}</h5>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="row" id="tracks-grid-container"></div>
    `;

    const container = this.querySelector('#tracks-grid-container');
    filtered.forEach(track => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in';

      const card = document.createElement('slotrace-registrations-tracks-card');
      card.className = 'd-block h-100';
      card.track = track;
      card.drivers = this.drivers;

      col.appendChild(card);
      container.appendChild(col);
    });
  }
}

customElements.define('slotrace-registrations-tracks-list', SlotRaceRegistrationsTracksList);

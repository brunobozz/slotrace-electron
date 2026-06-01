class SlotRaceRegistrationsRacesList extends HTMLElement {
  connectedCallback() {
    this.races = [];
    this._filterQuery = '';
    this.render();

    this._filterListener = (e) => {
      this._filterQuery = e.detail.query;
      this.renderList();
    };
    window.addEventListener('raceFilterChanged', this._filterListener);

    this._listChangedListener = () => {
      this.loadRaces();
    };
    window.addEventListener('raceListChanged', this._listChangedListener);

    this._langListener = () => {
      this.renderList();
    };
    window.addEventListener('languageChanged', this._langListener);

    this._routeListener = () => {
      const hash = window.location.hash || '';
      if (hash.includes('#registrations/races')) {
        this.loadRaces();
      }
    };
    window.addEventListener('hashchange', this._routeListener);

    this.loadRaces();
  }

  disconnectedCallback() {
    if (this._filterListener) {
      window.removeEventListener('raceFilterChanged', this._filterListener);
    }
    if (this._listChangedListener) {
      window.removeEventListener('raceListChanged', this._listChangedListener);
    }
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._routeListener) {
      window.removeEventListener('hashchange', this._routeListener);
    }
  }

  loadRaces() {
    window.electronAPI.db.get('races').then(races => {
      // Sort: newest races first (descending by ID/timestamp)
      this.races = (races || []).sort((a, b) => {
        return (b.id || '').localeCompare(a.id || '');
      });
      this.renderList();
    }).catch(err => {
      console.error('Failed to load completed races history:', err);
    });
  }

  render() {
    this.innerHTML = `
      <div id="races-grid-container"></div>
    `;
  }

  renderList() {
    const container = this.querySelector('#races-grid-container');
    if (!container) return;

    // Filter races based on search query
    const query = (this._filterQuery || '').toLowerCase().trim();
    const filteredRaces = this.races.filter(race => {
      return (race.name || '').toLowerCase().includes(query) ||
             (race.trackName || '').toLowerCase().includes(query) ||
             (race.date || '').toLowerCase().includes(query);
    });

    if (this.races.length === 0) {
      container.innerHTML = `
        <div class="py-5 text-center fade-in">
          <div class="d-inline-flex p-3 bg-secondary bg-opacity-10 text-secondary rounded-circle mb-3">
            <i class="mdi mdi-flag-checkered" style="font-size: 48px; line-height: 1;"></i>
          </div>
          <h6 class="fw-bold text-body-emphasis mb-1">${window.t('registrations.no_races_listed') || 'Nenhuma corrida salva no histórico ainda.'}</h6>
          <p class="text-secondary small mb-0">${window.t('registrations.no_races_help') || 'Finalize uma corrida e clique em salvar os resultados no histórico para vê-la aqui.'}</p>
        </div>
      `;
      return;
    }

    if (filteredRaces.length === 0) {
      container.innerHTML = `
        <div class="py-5 text-center fade-in">
          <div class="d-inline-flex p-3 bg-secondary bg-opacity-10 text-secondary rounded-circle mb-3">
            <i class="mdi mdi-magnify" style="font-size: 48px; line-height: 1;"></i>
          </div>
          <h6 class="fw-bold text-body-emphasis mb-1">${window.t('registrations.no_races_found') || 'Nenhuma corrida encontrada.'}</h6>
          <p class="text-secondary small mb-0">${window.t('registrations.no_races_found_desc') || 'Tente mudar o termo da pesquisa.'}</p>
        </div>
      `;
      return;
    }

    // Render the grid structure
    container.innerHTML = `
      <div class="row fade-in" id="races-row"></div>
    `;

    const row = container.querySelector('#races-row');
    filteredRaces.forEach(race => {
      const cardCol = document.createElement('div');
      cardCol.className = 'col-12 col-md-6 col-xxl-4 mb-4';

      const cardEl = document.createElement('slotrace-registrations-races-card');
      cardEl.race = race;
      
      cardCol.appendChild(cardEl);
      row.appendChild(cardCol);
    });
  }
}

customElements.define('slotrace-registrations-races-list', SlotRaceRegistrationsRacesList);

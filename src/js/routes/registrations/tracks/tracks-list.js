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

    // Helper for clean short labels across PT, EN, and ES
    const getShortLanesLabel = () => {
      const tVal = window.t('registrations.tracks_modal.lanes_label') || 'Lanes';
      if (tVal.includes('Carriles')) return 'Carriles';
      return tVal;
    };

    const getShortLengthLabel = () => {
      const tVal = window.t('registrations.tracks_modal.length_label') || 'Length';
      if (tVal.includes('Comprimento')) return 'Comprimento';
      if (tVal.includes('Length')) return 'Length';
      if (tVal.includes('Longitud')) return 'Longitud';
      return tVal;
    };

    const getShortPowerbarsLabel = () => {
      const tVal = window.t('registrations.tracks_modal.powerbars_label') || 'Power Zones';
      if (tVal.includes('Alimentação') || tVal.includes('Alimentación')) return 'Zonas';
      if (tVal.includes('Zones')) return 'Zones';
      return tVal;
    };

    const lanesLabel = getShortLanesLabel();
    const lengthLabel = getShortLengthLabel();
    const powerbarsLabel = getShortPowerbarsLabel();

    let cardsHtml = '';
    filtered.forEach(track => {
      const name = track.name || '';
      const scale = track.scale || '';
      const photoUrl = track.photo || '';

      let recordHtml = '';
      if (track.recordTime) {
        const recordPilot = this.drivers.find(d => d.id === track.recordPilotId);
        const pilotName = recordPilot ? (recordPilot.nickname || recordPilot.name) : '';
        const pilotSuffix = pilotName ? ` (${pilotName})` : '';
        
        const recordLabelRaw = window.t('registrations.tracks_modal.record_pilot_label') || 'Record Pilot';
        const recordPrefix = recordLabelRaw
          .replace('Piloto do ', '')
          .replace('Piloto del ', '')
          .replace(' Pilot', '');
          
        recordHtml = `${recordPrefix}: <strong style="color: var(--bs-primary); font-weight: bold;">${track.recordTime}s${pilotSuffix}</strong>`;
      }

      cardsHtml += `
        <div class="col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in">
          <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
            <div class="card-body p-3 d-flex flex-column">
              
              <!-- 16:9 Widescreen Track Image -->
              <div class="rounded-3 border border-secondary-subtle shadow-sm overflow-hidden bg-body-secondary mb-3 w-100 position-relative" style="aspect-ratio: 16/9;">
                ${photoUrl ? `
                  <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
                ` : `
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center">
                    <i class="mdi mdi-go-kart-track text-secondary" style="font-size: 56px; line-height: 1;"></i>
                  </div>
                `}
              </div>
              
              <!-- Upper row: Track Name & Scale Badge side-by-side -->
              <div class="d-flex align-items-center justify-content-between mb-2 gap-2">
                <h4 class="fw-bold text-body-emphasis mb-0 text-truncate text-start" title="${name}" style="font-size: 1.25rem; line-height: 1.2;">
                  ${name}
                </h4>
                ${scale ? `
                  <div class="badge border border-secondary-subtle text-secondary px-2 py-1 flex-shrink-0" style="font-size: 0.75rem; font-weight: 600; background: rgba(0, 0, 0, 0.15);">
                    ${scale}
                  </div>
                ` : ''}
              </div>
              
              <!-- Thin divider line -->
              <hr class="my-2 border-secondary-subtle opacity-25">
              
              <!-- Bottom Row: Metadata details + Edit/Delete actions -->
              <div class="d-flex align-items-end justify-content-between mt-auto pt-1">
                <div class="text-start overflow-hidden">
                  <div class="small text-secondary text-truncate" style="font-size: 0.8rem;">
                    ${lanesLabel}: <strong class="text-body-emphasis">${track.lanes || '-'}</strong> &nbsp;|&nbsp; 
                    ${lengthLabel}: <strong class="text-body-emphasis">${track.length ? track.length + 'm' : '-'}</strong> &nbsp;|&nbsp; 
                    ${powerbarsLabel}: <strong class="text-body-emphasis">${track.powerbars || '-'}</strong>
                  </div>
                  ${recordHtml ? `
                    <div class="small text-secondary mt-1 text-truncate" style="font-size: 0.8rem;">
                      ${recordHtml}
                    </div>
                  ` : ''}
                </div>
                
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                  <span class="fs-5 hover-scale-btn btn-edit-track" style="cursor: pointer; color: var(--bs-primary);" data-id="${track.id}" title="${window.t('registrations.tracks_modal.edit_button') || 'Editar'}">
                    <i class="mdi mdi-pencil-outline"></i>
                  </span>
                  <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-track" style="cursor: pointer;" data-id="${track.id}" data-name="${name}" title="${window.t('registrations.tracks_modal.delete_button') || 'Excluir'}">
                    <i class="mdi mdi-trash-can-outline"></i>
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      `;
    });

    this.innerHTML = `
      <div class="row">
        ${cardsHtml}
      </div>
    `;

    // Bind edit request events
    this.querySelectorAll('.btn-edit-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const track = this.tracks.find(t => t.id === id);
        if (track) {
          window.dispatchEvent(new CustomEvent('requestEditTrack', {
            detail: { track }
          }));
        }
      });
    });

    // Bind delete confirmation request events
    this.querySelectorAll('.btn-delete-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        window.dispatchEvent(new CustomEvent('requestDeleteTrack', {
          detail: { id, name }
        }));
      });
    });
  }
}

customElements.define('slotrace-registrations-tracks-list', SlotRaceRegistrationsTracksList);

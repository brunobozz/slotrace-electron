class SlotRaceRegistrationsTracksCard extends HTMLElement {
  set track(value) {
    this._track = value;
    this.render();
  }

  get track() {
    return this._track;
  }

  set drivers(value) {
    this._drivers = value || [];
    this.render();
  }

  get drivers() {
    return this._drivers || [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this._track) return;
    const track = this._track;
    const drivers = this._drivers || [];

    const name = track.name || '';
    const scale = track.scale || '';
    const photoUrl = track.photo || '';

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

    let recordHtml = '';
    if (track.recordTime) {
      const recordPilot = drivers.find(d => d.id === track.recordPilotId);
      const pilotName = recordPilot ? (recordPilot.nickname || recordPilot.name) : '';
      const pilotSuffix = pilotName ? ` (${pilotName})` : '';
      
      const recordLabelRaw = window.t('registrations.tracks_modal.record_pilot_label') || 'Record Pilot';
      const recordPrefix = recordLabelRaw
        .replace('Piloto do ', '')
        .replace('Piloto del ', '')
        .replace(' Pilot', '');
        
      recordHtml = `${recordPrefix}: <strong style="color: var(--bs-primary); font-weight: bold;">${track.recordTime}s${pilotSuffix}</strong>`;
    }

    this.innerHTML = `
      <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          
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
              <span class="fs-5 hover-scale-btn text-info btn-edit-track" style="cursor: pointer;" title="${window.t('registrations.tracks_modal.edit_button') || 'Editar'}">
                <i class="mdi mdi-pencil-outline"></i>
              </span>
              <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-track" style="cursor: pointer;" title="${window.t('registrations.tracks_modal.delete_button') || 'Excluir'}">
                <i class="mdi mdi-trash-can-outline"></i>
              </span>
            </div>
          </div>
          
        </div>
      </div>
    `;

    // Bind edit request events
    const editBtn = this.querySelector('.btn-edit-track');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestEditTrack', {
          detail: { track }
        }));
      });
    }

    // Bind delete confirmation request events
    const deleteBtn = this.querySelector('.btn-delete-track');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestDeleteTrack', {
          detail: { id: track.id, name }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-tracks-card', SlotRaceRegistrationsTracksCard);

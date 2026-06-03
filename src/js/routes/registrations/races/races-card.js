class SlotRaceRegistrationsRacesCard extends HTMLElement {
  set race(value) {
    this._race = value;
    this.render();
  }

  get race() {
    return this._race;
  }

  set trackPhoto(value) {
    this._trackPhoto = value;
    this.render();
  }

  get trackPhoto() {
    return this._trackPhoto;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this._race) return;
    const race = this._race;
    const name = race.name || '';
    const trackName = race.trackName || window.t('registrations.default_track') || 'Pista Padrão';
    const dateStr = race.date ? new Date(race.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }) : '';

    const winnerName = race.winner || '';

    this.innerHTML = `
      <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover overflow-hidden">
        
        <!-- Checkered Header Banner -->
        <div class="position-relative overflow-hidden" style="height: 50px; background: repeating-conic-gradient(#1a1a1a 0% 25%, #2d2d2d 0% 50%) 50% / 20px 20px;">
          <div class="position-absolute w-100 h-100 d-flex align-items-center justify-content-between px-3" style="background: linear-gradient(to right, rgba(17,17,17,0.9), rgba(17,17,17,0.4));">
            <div class="d-flex align-items-center gap-2">
              <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
              <span class="text-primary small fw-bold" style="letter-spacing: 0.05em; text-transform: uppercase;">
                ${race.type === 'grand_prix' || !race.type ? 'Grande Prêmio' : race.type}
              </span>
            </div>
            ${dateStr ? `
              <span class="badge border border-secondary-subtle text-secondary px-2 py-1" style="font-size: 0.7rem; background: rgba(0, 0, 0, 0.35);">
                ${dateStr}
              </span>
            ` : ''}
          </div>
        </div>

        <!-- 16:9 Widescreen Track Image -->
        <div class="rounded-0 border-bottom border-secondary-subtle overflow-hidden bg-body-secondary w-100 position-relative" style="aspect-ratio: 16/9;">
          ${this._trackPhoto ? `
            <img src="${this._trackPhoto}" class="w-100 h-100 object-fit-cover">
          ` : `
            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
              <i class="mdi mdi-go-kart-track text-secondary opacity-50" style="font-size: 56px; line-height: 1;"></i>
            </div>
          `}
          
          <!-- Gradient overlay on image footer for Race and Track names -->
          <div class="position-absolute bottom-0 start-0 w-100 p-3 text-start d-flex flex-column justify-content-end" style="background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%); min-height: 60%;">
            <h4 class="fw-bold text-white mb-1 text-truncate" title="${name}" style="font-size: 1.15rem; line-height: 1.2; text-shadow: 0 1px 3px rgba(0,0,0,0.6);">
              ${name}
            </h4>
            <div class="d-flex align-items-center gap-1 text-white-50 small text-truncate" title="${trackName}">
              <i class="mdi mdi-go-kart-track fs-5 text-primary"></i>
              <span class="text-truncate fw-medium text-white" style="opacity: 0.85;">${trackName}</span>
            </div>
          </div>
        </div>

        <div class="card-body p-3 d-flex flex-column justify-content-between">
          
          <!-- Winner / Status Section -->
          ${winnerName ? `
            <div class="bg-body-secondary bg-opacity-50 border border-secondary-subtle border-opacity-10 rounded p-2.5 mb-2 text-start">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-warning bg-opacity-10 rounded-circle p-1 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; border: 1px solid rgba(255,193,7,0.25);">
                  <i class="mdi mdi-trophy text-warning fs-5"></i>
                </div>
                <div class="overflow-hidden">
                  <div class="text-secondary fw-semibold small text-uppercase" style="font-size: 0.65rem; letter-spacing: 0.05em;">Vencedor</div>
                  <div class="fw-bold text-body-emphasis text-truncate" style="font-size: 0.95rem;">${winnerName}</div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Divider Line -->
          <hr class="my-2 border-secondary-subtle opacity-25">
          
          <!-- Card Footer Actions -->
          <div class="d-flex align-items-center justify-content-end gap-2 mt-1">
            <span class="fs-5 hover-scale-btn text-info btn-edit-race" style="cursor: pointer;" title="${window.t('registrations.modal.edit_button') || 'Editar'}">
              <i class="mdi mdi-pencil-outline"></i>
            </span>
            <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-race" style="cursor: pointer;" title="${window.t('registrations.modal.delete_button') || 'Excluir'}">
              <i class="mdi mdi-trash-can-outline"></i>
            </span>
          </div>
          
        </div>
      </div>
    `;

    // Bind Edit Name Event
    const editBtn = this.querySelector('.btn-edit-race');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('requestEditRaceName', {
          detail: { race }
        }));
      });
    }

    // Bind Delete Confirmation Event
    const deleteBtn = this.querySelector('.btn-delete-race');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('requestDeleteRace', {
          detail: { id: race.id, name }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-races-card', SlotRaceRegistrationsRacesCard);

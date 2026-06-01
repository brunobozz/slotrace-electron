class SlotRaceRegistrationsRacesCard extends HTMLElement {
  set race(value) {
    this._race = value;
    this.render();
  }

  get race() {
    return this._race;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this._race) return;
    const race = this._race;
    
    const winner = race.standings && race.standings[0] ? race.standings[0] : null;
    const winnerName = winner ? (winner.pilotNickname || winner.pilotName) : 'N/A';
    
    const formatZoneVal = (zoneVal) => {
      const val = parseInt(zoneVal) || 0;
      return val.toString().padStart(2, '0');
    };
    
    const winnerLaps = winner ? `${winner.totalLaps}.${formatZoneVal(winner.finalZone)}` : '--.--';

    this.innerHTML = `
      <div class="card bg-body-tertiary border-secondary-subtle shadow-sm h-100 transition-hover race-history-card d-flex flex-column" data-race-id="${race.id}" style="cursor: pointer;">
        <div class="card-header border-secondary-subtle bg-body-secondary py-2.5 px-3">
          <div class="d-flex align-items-center justify-content-between">
            <h6 class="fw-bold text-body-emphasis mb-0 text-truncate" style="font-size: 1.05rem;" title="${race.name}">
              <i class="mdi mdi-flag-checkered text-primary me-1.5"></i>
              ${race.name}
              <span class="text-primary opacity-50 hover-opacity-100 ms-1.5" style="font-size: 0.85rem;" title="${window.t('registrations.load_race') || 'Carregar corrida'}">
                <i class="mdi mdi-open-in-new"></i>
              </span>
            </h6>
            <span class="badge border border-secondary-subtle text-secondary font-monospace px-2 py-0.5 bg-dark bg-opacity-20" style="font-size: 0.7rem;">
              ${race.date}
            </span>
          </div>
        </div>
        
        <div class="card-body p-3">
          <div class="d-flex flex-column gap-1.5 small text-secondary">
            <div class="d-flex align-items-center gap-2">
              <i class="mdi mdi-go-kart-track text-primary fs-5"></i>
              <span><strong>Pistas:</strong> ${race.trackName}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="mdi mdi-trophy text-warning fs-5"></i>
              <span><strong>Vencedor:</strong> <span class="text-warning fw-bold">${winnerName}</span> (${winnerLaps} v)</span>
            </div>
          </div>
        </div>

        <!-- Card Footer with Edit / Delete Actions -->
        <div class="card-footer border-secondary-subtle bg-body-secondary bg-opacity-50 py-2 px-3 d-flex align-items-center justify-content-between mt-auto">
          <span class="small text-secondary font-monospace" style="font-size: 0.75rem;">
            ID: ${race.id.slice(-6)}
          </span>
          <div class="d-flex align-items-center gap-3">
            <span class="fs-5 hover-scale-btn text-info btn-edit-race" style="cursor: pointer;" title="${window.t('registrations.edit_race') || 'Editar Nome'}">
              <i class="mdi mdi-pencil-outline"></i>
            </span>
            <span class="fs-5 hover-scale-btn text-danger btn-delete-race" style="cursor: pointer;" title="${window.t('registrations.delete_race') || 'Excluir Corrida'}">
              <i class="mdi mdi-trash-can-outline"></i>
            </span>
          </div>
        </div>
      </div>
    `;

    // Bind card click event to load the race results
    this.querySelector('.race-history-card').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('requestLoadRace', {
        bubbles: true,
        composed: true,
        detail: { race }
      }));
    });

    // Bind Edit button click event
    const editBtn = this.querySelector('.btn-edit-race');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card load click event
        this.dispatchEvent(new CustomEvent('requestEditRaceName', {
          bubbles: true,
          composed: true,
          detail: { id: race.id, name: race.name }
        }));
      });
    }

    // Bind Delete button click event
    const deleteBtn = this.querySelector('.btn-delete-race');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card load click event
        this.dispatchEvent(new CustomEvent('requestDeleteRace', {
          bubbles: true,
          composed: true,
          detail: { id: race.id, name: race.name }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-races-card', SlotRaceRegistrationsRacesCard);

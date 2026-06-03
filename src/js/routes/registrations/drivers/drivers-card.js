class SlotRaceRegistrationsDriversCard extends HTMLElement {
  set driver(value) {
    this._driver = value;
    this.render();
  }

  get driver() {
    return this._driver;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this._driver) return;
    const driver = this._driver;
    const name = driver.name || '';
    const nickname = driver.nickname || '';
    const photoUrl = driver.photo || '';

    const racesCount = driver.races !== undefined ? driver.races : (driver.gps !== undefined ? driver.gps : 0);
    const lapsCount = driver.laps !== undefined ? driver.laps : 0;
    const bestLapsCount = driver.best_laps !== undefined ? driver.best_laps : 0;

    this.innerHTML = `
      <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          
          <!-- Top Section: Avatar + Driver Info -->
          <div class="d-flex align-items-center gap-3 mb-2">
            <!-- Avatar Container -->
            <div class="rounded-circle border border-secondary-subtle shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-body-secondary flex-shrink-0" style="width: 80px; height: 80px; border-width: 2px !important;">
              ${photoUrl ? `
                <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
              ` : `
                <i class="mdi mdi-account text-secondary" style="font-size: 48px; line-height: 1;"></i>
              `}
            </div>
            
            <!-- Info Section -->
            <div class="text-start overflow-hidden">
              <div class="text-secondary fw-semibold small text-uppercase tracking-wider" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                ${window.t('registrations.modal.driver_caps_label') || 'PILOTO'}
              </div>
              <h4 class="fw-bold text-body-emphasis mb-1 text-truncate" title="${name}" style="font-size: 1.25rem;">${name}</h4>
              ${nickname ? `
                <div class="small text-truncate fw-semibold" style="color: var(--bs-primary);" title="${nickname}">
                  ${window.t('registrations.modal.nickname_label') || 'Apelido'}: ${nickname}
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Divider Line -->
          <hr class="my-2 border-secondary-subtle opacity-25">
          
          <!-- Bottom Section: Stats + Action Icons -->
          <div class="d-flex align-items-center justify-content-between mt-1">
            <!-- Stats Left -->
            <div class="small text-secondary text-truncate d-flex align-items-center" style="font-size: 0.8rem;">
              <span class="d-inline-flex align-items-center" title="Corridas">
                <i class="mdi mdi-flag-checkered text-secondary-emphasis fs-6 me-1"></i>
                <strong class="text-body-emphasis">${racesCount}</strong>
              </span>
              <span class="mx-2 text-secondary opacity-50">|</span>
              <span class="d-inline-flex align-items-center" title="${window.t('registrations.modal.laps_label') || 'Voltas'}">
                <i class="mdi mdi-reload text-secondary-emphasis fs-6 me-1"></i>
                <strong class="text-body-emphasis">${lapsCount}</strong>
              </span>
              <span class="mx-2 text-secondary opacity-50">|</span>
              <span class="d-inline-flex align-items-center" title="${window.t('registrations.modal.best_laps_label') || 'Melhores Voltas'}">
                <i class="mdi mdi-flash text-secondary-emphasis fs-6 me-1"></i>
                <strong class="text-body-emphasis">${bestLapsCount}</strong>
              </span>
            </div>
            
            <!-- Actions Right -->
            <div class="d-flex align-items-center gap-2">
              <span class="fs-5 hover-scale-btn text-info btn-edit-driver" style="cursor: pointer;" title="${window.t('registrations.modal.edit_button') || 'Editar'}">
                <i class="mdi mdi-pencil-outline"></i>
              </span>
              <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-driver" style="cursor: pointer;" title="${window.t('registrations.modal.delete_button') || 'Excluir'}">
                <i class="mdi mdi-trash-can-outline"></i>
              </span>
            </div>
          </div>
          
        </div>
      </div>
    `;

    // Bind edit request events
    const editBtn = this.querySelector('.btn-edit-driver');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestEditDriver', {
          detail: { driver }
        }));
      });
    }

    // Bind delete confirmation request events
    const deleteBtn = this.querySelector('.btn-delete-driver');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestDeleteDriver', {
          detail: { id: driver.id, name }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-drivers-card', SlotRaceRegistrationsDriversCard);

class SlotRaceRegistrationsCarsCard extends HTMLElement {
  set car(value) {
    this._car = value;
    this.render();
  }

  get car() {
    return this._car;
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
    if (!this._car) return;
    const car = this._car;
    const drivers = this._drivers || [];

    const name = car.name || '';
    const manufacturer = car.manufacturer || car.brand || '';
    const scale = car.scale || '';
    const photoUrl = car.photo || '';

    const ownerDriver = drivers.find(d => d.id === car.ownerId);
    const ownerName = ownerDriver ? (ownerDriver.nickname || ownerDriver.name) : '';

    this.innerHTML = `
      <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          
          <!-- 16:9 Landscape Car Image -->
          <div class="rounded-3 border border-secondary-subtle shadow-sm overflow-hidden bg-body-secondary mb-3 w-100 position-relative" style="aspect-ratio: 16/9;">
            ${photoUrl ? `
              <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
            ` : `
              <div class="w-100 h-100 d-flex align-items-center justify-content-center">
                <i class="mdi mdi-car-sports text-secondary" style="font-size: 56px; line-height: 1;"></i>
              </div>
            `}
          </div>
          
          <!-- Upper row: Model name & Scale badge side-by-side -->
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
              <div class="small text-secondary text-truncate" style="font-size: 0.8rem;" title="${manufacturer || '-'}">
                ${window.t('registrations.cars_modal.manufacturer_label') || 'Fabricante'}: <strong class="text-body-emphasis">${manufacturer || '-'}</strong>
              </div>
              <div class="small text-secondary mt-1 text-truncate" style="font-size: 0.8rem;" title="${ownerName || window.t('registrations.cars_modal.no_owner') || 'Sem proprietário'}">
                ${window.t('registrations.cars_modal.owner_label') || 'Proprietário'}: <strong style="color: var(--bs-primary); font-weight: bold;">${ownerName || window.t('registrations.cars_modal.no_owner') || 'Sem proprietário'}</strong>
              </div>
            </div>
            
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
              <span class="fs-5 hover-scale-btn text-info btn-edit-car" style="cursor: pointer;" title="${window.t('registrations.cars_modal.edit_button') || 'Editar'}">
                <i class="mdi mdi-pencil-outline"></i>
              </span>
              <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-car" style="cursor: pointer;" title="${window.t('registrations.cars_modal.delete_button') || 'Excluir'}">
                <i class="mdi mdi-trash-can-outline"></i>
              </span>
            </div>
          </div>
          
        </div>
      </div>
    `;

    // Bind edit request events
    const editBtn = this.querySelector('.btn-edit-car');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestEditCar', {
          detail: { car }
        }));
      });
    }

    // Bind delete confirmation request events
    const deleteBtn = this.querySelector('.btn-delete-car');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestDeleteCar', {
          detail: { id: car.id, name }
        }));
      });
    }
  }
}

customElements.define('slotrace-registrations-cars-card', SlotRaceRegistrationsCarsCard);

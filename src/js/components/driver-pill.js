class SlotRaceDriverPill extends HTMLElement {
  constructor() {
    super();
    this.pilotId = null;
    this.name = '';
    this.photoUrl = '';
    this.carName = '';
    this.onRemove = null;
  }

  setParams({ pilotId, name, photoUrl, carName, onRemove }) {
    this.pilotId = pilotId;
    this.name = name;
    this.photoUrl = photoUrl;
    this.carName = carName;
    this.onRemove = onRemove;
    this.render();
  }

  render() {
    // Style as the capsule driver pill
    this.className = 'driver-pill-wrapper position-relative d-inline-flex align-items-center bg-body-secondary border border-secondary-subtle rounded-pill p-1 pe-2 me-1 mb-1';
    this.style.height = '48px';
    this.style.minWidth = 'max-content';

    this.innerHTML = `
      <style>
        .driver-pill-wrapper:hover .delete-badge {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      </style>
      
      <!-- Circular Avatar Container with Active Theme Color border -->
      <div class="rounded-circle overflow-hidden bg-body-tertiary flex-shrink-0 shadow-sm" style="width: 38px; height: 38px; border: 2px solid var(--bs-primary);">
        ${this.photoUrl ? `
          <img src="${this.photoUrl}" class="w-100 h-100 object-fit-cover">
        ` : `
          <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary text-secondary">
            <i class="mdi mdi-account fs-5"></i>
          </div>
        `}
      </div>
      
      <!-- Driver Nickname and Car text -->
      <div class="d-flex flex-column justify-content-center ms-2 me-2" style="user-select: none; line-height: 1.25;">
        <span class="fw-bold text-body-emphasis small" style="font-size: 0.85rem; letter-spacing: 0.02em; white-space: nowrap;">
          ${this.name}
        </span>
        ${this.carName ? `
          <span class="text-secondary fw-semibold" style="font-size: 0.68rem; white-space: nowrap; opacity: 0.85; letter-spacing: 0.01em;">
            ${this.carName}
          </span>
        ` : ''}
      </div>
      
      <!-- Absolute positioned Red X circle badge in top right (hidden by default, appears on hover) -->
      <span class="position-absolute badge rounded-circle bg-dark border border-secondary-subtle d-flex align-items-center justify-content-center btn-remove-race-pilot delete-badge" style="width: 20px; height: 20px; cursor: pointer; padding: 0; font-size: 0.65rem; z-index: 3; top: -5px; right: -5px; transition: opacity 0.15s ease-in-out; opacity: 0; pointer-events: none;" title="Remover piloto">
        <i class="mdi mdi-close text-white"></i>
      </span>
    `;

    // Bind remove button callback
    const removeBtn = this.querySelector('.btn-remove-race-pilot');
    if (removeBtn && this.onRemove) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onRemove();
      });
    }
  }
}

customElements.define('slotrace-driver-pill', SlotRaceDriverPill);

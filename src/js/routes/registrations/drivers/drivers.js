class SlotRaceRegistrationsDrivers extends HTMLElement {
  connectedCallback() {
    this.render();
    
    // Bind modal and form events
    this.setupEvents();
    
    this._langListener = () => {
      this.render();
      this.setupEvents();
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <div class="d-flex justify-content-end mb-3">
        <button id="btn-new-driver" class="btn btn-primary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-plus-circle-outline fs-5"></i>
          ${window.t('registrations.new_driver')}
        </button>
      </div>

      <!-- Drivers List Grid -->
      <slotrace-registrations-drivers-list class="mt-4 d-block"></slotrace-registrations-drivers-list>

      <!-- Delete Driver Confirmation Modal -->
      <slotrace-registrations-drivers-delete-modal></slotrace-registrations-drivers-delete-modal>

      <!-- Driver Creation Modal Component -->
      <slotrace-registrations-drivers-create-modal></slotrace-registrations-drivers-create-modal>
    `;
  }

  setupEvents() {
    const btnNewDriver = this.querySelector('#btn-new-driver');
    const createModal = this.querySelector('slotrace-registrations-drivers-create-modal');
    
    if (btnNewDriver && createModal) {
      btnNewDriver.addEventListener('click', () => {
        createModal.show();
      });
    }
  }
}

// Define the custom element <slotrace-registrations-drivers>
customElements.define('slotrace-registrations-drivers', SlotRaceRegistrationsDrivers);
